import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Types ---
interface ManifestItem {
  sequence: number;
  type: "PICKUP" | "DROP";
  lat: number;
  lng: number;
  location?: string;
  address?: string;
  distance_from_last_km: number;
  order_id: string;
  is_completed?: boolean;
  allocated_quantity?: number;
}

interface OrderInfo {
  id: string;
  fruit_type: string;
  fruit_variant: string;
  quantity: number;
  status?: string;
  farmer: { name: string; phone: string } | null;
  buyer: { name: string; phone: string } | null;
  specs: {
    optimal_temp_c: number;
    max_safe_temp_c: number;
    force_refrigeration: boolean;
    handling_guidelines?: string[];
  } | null;
}

export default function JobDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [ordersData, setOrdersData] = useState<Record<string, OrderInfo>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [jobStatusLoading, setJobStatusLoading] = useState(false);
  const [verifiedOrders, setVerifiedOrders] = useState<Set<string>>(new Set());

  // --- NEW: Keep track of rejected orders locally to prevent UI flickering ---
  const [rejectedOrders, setRejectedOrders] = useState<Set<string>>(new Set());

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderInfo | null>(null);
  const [selectedAllocatedQuantity, setSelectedAllocatedQuantity] =
    useState<number>(0);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      const checkVerifiedOrders = async () => {
        try {
          const verifiedOrdersJson = await AsyncStorage.getItem(
            `verified_orders_${id}`,
          );
          if (verifiedOrdersJson) {
            const orders = JSON.parse(verifiedOrdersJson);
            setVerifiedOrders(new Set(orders));
          }
        } catch (error) {
          console.error("Error checking verified orders:", error);
        }
      };
      checkVerifiedOrders();
    }, [id]),
  );

  const reverseGeocodeStops = async (cleanManifest: ManifestItem[]) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return cleanManifest;

      const updatedManifest = await Promise.all(
        cleanManifest.map(async (stop) => {
          try {
            const geocode = await Location.reverseGeocodeAsync({
              latitude: stop.lat,
              longitude: stop.lng,
            });
            if (geocode.length > 0) {
              const place = geocode[0];
              const addressStr = [place.street, place.city, place.region]
                .filter(Boolean)
                .join(", ");
              return { ...stop, address: addressStr };
            }
          } catch (e) {
            console.warn("Geocoding failed for a stop", e);
          }
          return stop;
        }),
      );
      return updatedManifest;
    } catch (e) {
      console.error("Geocoding permission error:", e);
      return cleanManifest;
    }
  };

  const fetchJobDetails = async () => {
    try {
      const data: any = await api.get(`/api/transporter/jobs/${id}`);

      setJob(data);
      setOrdersData(data.orders_data || {});

      const cleanManifest = (data.route_manifest || []).map((item: any) => ({
        ...item,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lng),
        allocated_quantity: item.allocated_quantity || 0,
      }));

      setManifest(cleanManifest);
      setLoading(false);

      reverseGeocodeStops(cleanManifest).then((manifestWithAddresses) => {
        setManifest(manifestWithAddresses);
      });
    } catch (error) {
      Alert.alert("Error", "Failed to load details");
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (!manifest.length) return;

    const origin = `${manifest[0].lat},${manifest[0].lng}`;
    const destination = `${manifest[manifest.length - 1].lat},${
      manifest[manifest.length - 1].lng
    }`;

    let waypointsParam = "";
    if (manifest.length > 2) {
      const stops = manifest.slice(1, manifest.length - 1);
      const waypointCoords = stops.map((s) => `${s.lat},${s.lng}`).join("|");
      waypointsParam = `&waypoints=${waypointCoords}`;
    }

    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;

    Linking.openURL(url).catch((err) => {
      console.error("Error opening map", err);
      Alert.alert("Error", "Could not open map application.");
    });
  };

  const updateJobStatus = async (newStatus: "IN_TRANSIT" | "COMPLETED") => {
    const actionText =
      newStatus === "IN_TRANSIT"
        ? "start this job"
        : "mark this job as completed";

    Alert.alert("Confirm Action", `Are you sure you want to ${actionText}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          try {
            setJobStatusLoading(true);

            const response: any = await api.put(
              `/api/transporter/jobs/${id}/status`,
              { status: newStatus },
            );

            if (
              response.success ||
              response.data?.success ||
              response.message ||
              response.status === 200
            ) {
              setJob((prevJob: any) => ({
                ...prevJob,
                status: newStatus,
              }));

              Alert.alert(
                "Success",
                `Job ${newStatus === "IN_TRANSIT" ? "Started" : "Completed"}!`,
              );
            } else {
              throw new Error("API did not return a success flag");
            }
          } catch (error) {
            console.error("Status update error:", error);
            Alert.alert("Error", `Failed to update job status`);
          } finally {
            setJobStatusLoading(false);
          }
        },
      },
    ]);
  };

  const handleVerifyQuality = async (orderId: string) => {
    try {
      const updatedVerifiedOrders = new Set(verifiedOrders);
      updatedVerifiedOrders.add(orderId);
      setVerifiedOrders(updatedVerifiedOrders);

      await AsyncStorage.setItem(
        `verified_orders_${id}`,
        JSON.stringify(Array.from(updatedVerifiedOrders)),
      );

      Alert.alert(
        "Testing Mode",
        "Order instantly verified! You can now pickup.",
      );
    } catch (error) {
      console.error("Error saving test verification:", error);
      Alert.alert("Error", "Could not bypass verification.");
    }
  };

  // const handleAction = (stop: ManifestItem) => {
  //   const { type, order_id, allocated_quantity } = stop;

  //   if (type === "PICKUP" && !verifiedOrders.has(order_id)) {
  //     Alert.alert("Verification Required", "Please verify the quality first.");
  //     return;
  //   }

  //   Alert.alert(
  //     "Confirm Action",
  //     `Are you sure you want to confirm this ${type}?`,
  //     [
  //       { text: "Cancel", style: "cancel" },
  //       {
  //         text: "Confirm",
  //         onPress: async () => {
  //           try {
  //             setActionLoading(true);
  //             const response: any = await api.post(
  //               `/api/transporter/jobs/${id}/action`,
  //               {
  //                 orderId: order_id,
  //                 type: type,
  //               },
  //             );

  //             if (response.success || response.data?.success) {
  //               if (type === "DROP") {
  //                 const { data: orderData, error: fetchError } = await supabase
  //                   .from("orders")
  //                   .select("quantity, delivered_quantity")
  //                   .eq("id", order_id)
  //                   .single();

  //                 if (fetchError) {
  //                   console.error("Failed fetching order data:", fetchError);
  //                 } else {
  //                   const currentDelivered = orderData.delivered_quantity || 0;
  //                   const amountToDrop = allocated_quantity || 0;
  //                   const newDelivered = currentDelivered + amountToDrop;
  //                   const totalQuantity = orderData.quantity;

  //                   const updates: any = { delivered_quantity: newDelivered };

  //                   if (newDelivered >= totalQuantity) {
  //                     updates.status = "completed";
  //                   }

  //                   const { error: updateError } = await supabase
  //                     .from("orders")
  //                     .update(updates)
  //                     .eq("id", order_id);

  //                   if (updateError) {
  //                     console.error("Failed to update order:", updateError);
  //                   }
  //                 }
  //               }

  //               await fetchJobDetails();
  //               Alert.alert(
  //                 "Success",
  //                 response.message || response.data?.message,
  //               );
  //             }
  //           } catch (error) {
  //             console.error(error);
  //             Alert.alert("Error", `Failed to confirm ${type}`);
  //           } finally {
  //             setActionLoading(false);
  //           }
  //         },
  //       },
  //     ],
  //   );
  // };

  // --- REJECT LOGIC FIXED ---

  const handleAction = (stop: ManifestItem) => {
    const { type, order_id, allocated_quantity } = stop;

    if (type === "PICKUP" && !verifiedOrders.has(order_id)) {
      Alert.alert("Verification Required", "Please verify the quality first.");
      return;
    }

    Alert.alert(
      "Confirm Action",
      `Are you sure you want to confirm this ${type}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response: any = await api.post(
                `/api/transporter/jobs/${id}/action`,
                {
                  orderId: order_id,
                  type: type,
                },
              );

              if (response.success || response.data?.success) {
                if (type === "DROP") {
                  const { data: orderData, error: fetchError } = await supabase
                    .from("orders")
                    .select("quantity, delivered_quantity")
                    .eq("id", order_id)
                    .single();

                  if (fetchError) {
                    console.error("Failed fetching order data:", fetchError);
                  } else {
                    const currentDelivered = orderData.delivered_quantity || 0;
                    const amountToDrop = allocated_quantity || 0;
                    const newDelivered = currentDelivered + amountToDrop;
                    const totalQuantity = orderData.quantity;

                    const updates: any = { delivered_quantity: newDelivered };

                    if (newDelivered >= totalQuantity) {
                      updates.status = "completed";
                    }

                    const { error: updateError } = await supabase
                      .from("orders")
                      .update(updates)
                      .eq("id", order_id);

                    if (updateError) {
                      console.error("Failed to update order:", updateError);
                    }
                  }
                } else if (type === "PICKUP") {
                  const { error: updateError } = await supabase
                    .from("orders")
                    .update({ status: "picked_up" })
                    .eq("id", order_id);

                  if (updateError) {
                    console.error(
                      "Failed to update order to picked_up:",
                      updateError,
                    );
                  }
                }

                await fetchJobDetails();
                Alert.alert(
                  "Success",
                  response.message || response.data?.message,
                );
              }
            } catch (error) {
              console.error(error);
              Alert.alert("Error", `Failed to confirm ${type}`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleRejectOrder = (orderId: string) => {
    Alert.alert(
      "Reject Pickup",
      "Are you sure you want to reject this pickup? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const { error } = await supabase
                .from("orders")
                .update({ status: "rejected" })
                .eq("id", orderId);

              if (error) {
                console.error("Supabase update error:", error);
                throw error;
              }

              // 1. Lock the rejected state locally so it CANNOT flicker
              setRejectedOrders((prev) => new Set(prev).add(orderId));

              // 2. Optimistically update ordersData
              setOrdersData((prev) => ({
                ...prev,
                [orderId]: { ...prev[orderId], status: "rejected" },
              }));

              // 3. DO NOT call fetchJobDetails() here anymore.
              // Calling it causes a race condition where it pulls stale backend data
              Alert.alert("Success", "Pickup has been rejected.");
            } catch (err: any) {
              Alert.alert(
                "Error",
                err.message ||
                  "Failed to reject pickup. Check database constraints.",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const viewOrderInfo = (stop: ManifestItem) => {
    const info = ordersData[stop.order_id];
    if (info) {
      setSelectedOrder(info);
      setSelectedAllocatedQuantity(stop.allocated_quantity || 0);
      setModalVisible(true);
    } else {
      Alert.alert("Info", "Order details not available.");
    }
  };

  if (loading)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );

  const isJobActive = job?.status === "IN_TRANSIT";
  const isJobCompleted = job?.status === "COMPLETED";

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- Custom Premium Header --- */}
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Header Overview Card --- */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>{job?.route_name}</Text>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#64748b" />
            <Text style={styles.date}>
              {new Date(job?.job_date).toDateString()}
            </Text>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Load</Text>
              <Text style={styles.statValue}>{job?.total_weight_kg} kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Stops</Text>
              <Text style={styles.statValue}>{manifest.length}</Text>
            </View>
          </View>

          {/* JOB STATUS BUTTON */}
          <View style={{ marginTop: 20 }}>
            {jobStatusLoading ? (
              <View
                style={[styles.jobStatusBtn, { backgroundColor: "#e2e8f0" }]}
              >
                <ActivityIndicator size="small" color="#64748b" />
              </View>
            ) : isJobCompleted ? (
              <View
                style={[
                  styles.jobStatusBtn,
                  { backgroundColor: "#dcfce7", borderColor: "#22c55e" },
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#15803d" />
                <Text
                  style={[
                    styles.jobStatusText,
                    { color: "#15803d", marginLeft: 8 },
                  ]}
                >
                  Job Completed
                </Text>
              </View>
            ) : isJobActive ? (
              <TouchableOpacity
                style={[
                  styles.jobStatusBtn,
                  { backgroundColor: "#dc2626", borderColor: "#b91c1c" },
                ]}
                onPress={() => updateJobStatus("COMPLETED")}
              >
                <Text style={styles.jobStatusText}>Mark as Completed</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.jobStatusBtn,
                  { backgroundColor: "#2563eb", borderColor: "#1d4ed8" },
                ]}
                onPress={() => updateJobStatus("IN_TRANSIT")}
              >
                <Text style={styles.jobStatusText}>Start Job</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- Map Actions --- */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnMap]}
            onPress={() => router.push(`/transporter/map/${id}`)}
          >
            <Ionicons name="map-outline" size={20} color="#2563eb" />
            <Text style={styles.btnTextMap}>Route Map</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnGoogle]}
            onPress={openGoogleMaps}
          >
            <Ionicons name="navigate-circle-outline" size={22} color="#fff" />
            <Text style={styles.btnTextGoogle}>Start Navigation</Text>
          </TouchableOpacity>
        </View>

        {/* --- Timeline / Manifest --- */}
        <Text style={styles.sectionTitle}>Route Manifest</Text>
        {!isJobActive && !isJobCompleted && (
          <Text style={styles.warningText}>
            Start the job to unlock actions.
          </Text>
        )}

        <View style={styles.timeline}>
          {manifest.map((stop, index) => {
            const isLast = index === manifest.length - 1;
            const isPickup = stop.type === "PICKUP";
            const orderInfo = ordersData[stop.order_id];

            // FIXED: Now we check our local rejectedOrders Set as well!
            const isOrderRejected =
              orderInfo?.status === "rejected" ||
              orderInfo?.status === "REJECTED" ||
              rejectedOrders.has(stop.order_id);

            // Find if the corresponding pickup for this exact order ID is completed
            const relatedPickupStop = manifest.find(
              (s) => s.order_id === stop.order_id && s.type === "PICKUP",
            );
            const isPickupCompleted = !!relatedPickupStop?.is_completed;
            const canDrop = isPickupCompleted;

            return (
              <View key={index} style={styles.stopItem}>
                {/* Timeline Visuals */}
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.dot,
                      isPickup ? styles.dotGreen : styles.dotBlue,
                      stop.is_completed && styles.dotCompleted,
                      isOrderRejected && styles.dotRejected,
                    ]}
                  >
                    {stop.is_completed && !isOrderRejected && (
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    )}
                    {isOrderRejected && (
                      <Ionicons name="close" size={12} color="#fff" />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.line,
                        stop.is_completed && styles.lineCompleted,
                        isOrderRejected && styles.lineRejected,
                      ]}
                    />
                  )}
                </View>

                {/* Stop Card */}
                <View
                  style={[
                    styles.stopContent,
                    (!isJobActive && !isJobCompleted) || isOrderRejected
                      ? { opacity: 0.6 }
                      : {},
                  ]}
                >
                  <View style={styles.stopHeader}>
                    <View
                      style={[
                        styles.typeTag,
                        isOrderRejected
                          ? styles.typeTagRejected
                          : isPickup
                            ? styles.typeTagGreen
                            : styles.typeTagBlue,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeTagText,
                          isOrderRejected
                            ? styles.typeTextRejected
                            : isPickup
                              ? styles.typeTextGreen
                              : styles.typeTextBlue,
                        ]}
                      >
                        {stop.sequence}. {stop.type}
                      </Text>
                    </View>
                    <Text style={styles.stopDist}>
                      {stop.distance_from_last_km > 0
                        ? `+${stop.distance_from_last_km} km`
                        : "Start Point"}
                    </Text>
                  </View>

                  <View style={styles.addressContainer}>
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#64748b"
                      style={{ marginTop: 2 }}
                    />
                    <Text
                      style={[
                        styles.stopAddress,
                        isOrderRejected && {
                          textDecorationLine: "line-through",
                        },
                      ]}
                    >
                      {stop.address ||
                        `Lat: ${stop.lat.toFixed(4)}, Lng: ${stop.lng.toFixed(4)}`}
                    </Text>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.stopButtons}>
                    <TouchableOpacity
                      style={styles.infoBtn}
                      onPress={() => viewOrderInfo(stop)}
                    >
                      <Ionicons
                        name="information-circle-outline"
                        size={18}
                        color="#475569"
                      />
                      <Text style={styles.infoBtnText}>Details</Text>
                    </TouchableOpacity>

                    {/* Action Buttons Wrapper */}
                    <View style={styles.actionWrapper}>
                      {/* 1. Handling Rejected States */}
                      {isOrderRejected ? (
                        <View style={[styles.actionBtn, styles.disabledBtn]}>
                          <Ionicons
                            name="close-circle"
                            size={18}
                            color="#94a3b8"
                          />
                          <Text
                            style={[
                              styles.completedBtnText,
                              { color: "#94a3b8" },
                            ]}
                          >
                            Order Rejected
                          </Text>
                        </View>
                      ) : stop.is_completed ? (
                        /* 2. Handling Completed Stops */
                        <View style={[styles.actionBtn, styles.completedBtn]}>
                          <Ionicons
                            name="checkmark-done"
                            size={18}
                            color="#15803d"
                          />
                          <Text style={styles.completedBtnText}>
                            {isPickup ? "Picked Up" : "Delivered"}
                          </Text>
                        </View>
                      ) : !isPickup && !canDrop ? (
                        /* 3. Handling Dependent Drop Constraints */
                        <View style={[styles.actionBtn, styles.disabledBtn]}>
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color="#94a3b8"
                          />
                          <Text
                            style={[
                              styles.completedBtnText,
                              { color: "#94a3b8" },
                            ]}
                          >
                            Awaiting Pickup
                          </Text>
                        </View>
                      ) : isPickup && !verifiedOrders.has(stop.order_id) ? (
                        /* 4. Quality Verification Gate */
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            styles.verifyBtn,
                            !isJobActive && styles.disabledBtn,
                          ]}
                          onPress={() => handleVerifyQuality(stop.order_id)}
                          disabled={!isJobActive}
                        >
                          <Ionicons
                            name="scan-outline"
                            size={16}
                            color={isJobActive ? "#15803d" : "#94a3b8"}
                          />
                          <Text
                            style={[
                              styles.verifyBtnText,
                              !isJobActive && { color: "#94a3b8" },
                            ]}
                          >
                            Verify Quality
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        /* 5. Final Confirmation Button */
                        <TouchableOpacity
                          style={[
                            styles.actionBtn,
                            styles.primaryActionBtn,
                            !isJobActive && styles.disabledBtn,
                          ]}
                          onPress={() => handleAction(stop)}
                          disabled={!isJobActive || actionLoading}
                        >
                          {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text
                              style={[
                                styles.primaryActionBtnText,
                                !isJobActive && { color: "#94a3b8" },
                              ]}
                            >
                              Confirm {isPickup ? "Pickup" : "Drop"}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}

                      {/* Direct Reject Button */}
                      {isPickup &&
                        !stop.is_completed &&
                        !isOrderRejected &&
                        isJobActive && (
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleRejectOrder(stop.order_id)}
                            disabled={actionLoading}
                          >
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color="#ef4444"
                            />
                          </TouchableOpacity>
                        )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* --- Details Modal --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Cargo Info</Text>

                  {/* Show tag if rejected in details */}
                  {(selectedOrder.status === "rejected" ||
                    selectedOrder.status === "REJECTED" ||
                    rejectedOrders.has(selectedOrder.id)) && (
                    <View style={[styles.alertBox, { marginBottom: 12 }]}>
                      <Ionicons name="close-circle" size={16} color="#dc2626" />
                      <Text style={styles.alertText}>ORDER WAS REJECTED</Text>
                    </View>
                  )}

                  <Text style={styles.infoText}>
                    Product:{" "}
                    <Text style={styles.bold}>
                      {selectedOrder.fruit_type} ({selectedOrder.fruit_variant})
                    </Text>
                  </Text>
                  <Text style={styles.infoText}>
                    Pickup Quantity:{" "}
                    <Text style={styles.bold}>
                      {selectedAllocatedQuantity} kg
                    </Text>
                  </Text>
                  {selectedAllocatedQuantity !== selectedOrder.quantity && (
                    <Text
                      style={[
                        styles.infoText,
                        { fontSize: 13, color: "#64748b" },
                      ]}
                    >
                      (Total Order Request: {selectedOrder.quantity} kg)
                    </Text>
                  )}
                </View>

                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Contacts</Text>
                  <View style={styles.contactCard}>
                    <Text style={styles.subLabel}>Farmer</Text>
                    <Text style={styles.contactVal}>
                      {selectedOrder.farmer?.name || "N/A"}
                    </Text>
                    <Text style={styles.phoneVal}>
                      {selectedOrder.farmer?.phone || "No phone"}
                    </Text>
                  </View>
                  <View style={[styles.contactCard, { marginTop: 8 }]}>
                    <Text style={styles.subLabel}>Buyer</Text>
                    <Text style={styles.contactVal}>
                      {selectedOrder.buyer?.name || "N/A"}
                    </Text>
                    <Text style={styles.phoneVal}>
                      {selectedOrder.buyer?.phone || "No phone"}
                    </Text>
                  </View>
                </View>

                {selectedOrder.specs && (
                  <View style={[styles.infoSection, styles.specSection]}>
                    <Text style={styles.sectionHeader}>
                      Transport Requirements
                    </Text>
                    <View style={styles.specGrid}>
                      <View style={styles.specItem}>
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: "#fee2e2" },
                          ]}
                        >
                          <Ionicons
                            name="thermometer-outline"
                            size={18}
                            color="#dc2626"
                          />
                        </View>
                        <View>
                          <Text style={styles.specLabel}>Max Temp</Text>
                          <Text style={styles.specVal}>
                            {selectedOrder.specs.max_safe_temp_c}°C
                          </Text>
                        </View>
                      </View>
                      <View style={styles.specItem}>
                        <View
                          style={[
                            styles.iconBox,
                            { backgroundColor: "#dbeafe" },
                          ]}
                        >
                          <Ionicons
                            name="snow-outline"
                            size={18}
                            color="#2563eb"
                          />
                        </View>
                        <View>
                          <Text style={styles.specLabel}>Optimal</Text>
                          <Text style={styles.specVal}>
                            {selectedOrder.specs.optimal_temp_c}°C
                          </Text>
                        </View>
                      </View>
                    </View>

                    {selectedOrder.specs.force_refrigeration && (
                      <View style={styles.alertBox}>
                        <Ionicons name="warning" size={16} color="#dc2626" />
                        <Text style={styles.alertText}>
                          STRICT REFRIGERATION REQUIRED
                        </Text>
                      </View>
                    )}

                    {selectedOrder.specs.handling_guidelines &&
                      selectedOrder.specs.handling_guidelines.length > 0 && (
                        <View style={styles.guidelinesBox}>
                          <Text style={styles.guidelinesLabel}>
                            Handling Guidelines
                          </Text>
                          {selectedOrder.specs.handling_guidelines.map(
                            (point, index) => (
                              <View key={index} style={styles.bulletRow}>
                                <View style={styles.bulletPoint} />
                                <Text style={styles.guidelinesText}>
                                  {point}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      )}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

  // Header
  customHeader: {
    backgroundColor: "#166534",
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 40) + 10 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBackBtn: { padding: 4, marginLeft: -8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  scroll: { padding: 16, paddingBottom: 40 },

  // Overview Card
  headerCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  dateRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  date: { color: "#64748b", marginLeft: 6, fontSize: 14, fontWeight: "500" },

  statGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
  },
  statBox: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 30, backgroundColor: "#e2e8f0" },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: "#0f172a" },

  // Job Status Button
  jobStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  jobStatusText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnMap: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  btnTextMap: {
    color: "#1d4ed8",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 15,
  },
  btnGoogle: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnTextGoogle: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  warningText: {
    fontSize: 13,
    color: "#ea580c",
    fontWeight: "600",
    marginBottom: 16,
    fontStyle: "italic",
  },

  // Timeline
  timeline: { paddingLeft: 8 },
  stopItem: { flexDirection: "row", marginBottom: 24 },
  timelineLeft: { alignItems: "center", marginRight: 16, width: 24 },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dotGreen: {
    backgroundColor: "#10b981",
    borderWidth: 4,
    borderColor: "#d1fae5",
  },
  dotBlue: {
    backgroundColor: "#3b82f6",
    borderWidth: 4,
    borderColor: "#dbeafe",
  },
  dotCompleted: { backgroundColor: "#16a34a", borderWidth: 0 },
  dotRejected: {
    backgroundColor: "#cbd5e1",
    borderWidth: 4,
    borderColor: "#f1f5f9",
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    position: "absolute",
    top: 18,
    bottom: -24,
  },
  lineCompleted: { backgroundColor: "#16a34a" },
  lineRejected: { backgroundColor: "#cbd5e1", borderStyle: "dashed" },

  stopContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeTagGreen: { backgroundColor: "#ecfdf5" },
  typeTagBlue: { backgroundColor: "#eff6ff" },
  typeTagRejected: { backgroundColor: "#f1f5f9" },
  typeTagText: {
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  typeTextGreen: { color: "#059669" },
  typeTextBlue: { color: "#2563eb" },
  typeTextRejected: { color: "#64748b" },
  stopDist: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingRight: 8,
  },
  stopAddress: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },

  stopButtons: { flexDirection: "row", gap: 8 },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },

  actionWrapper: { flex: 1, flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryActionBtn: { backgroundColor: "#0f172a" },
  primaryActionBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  disabledBtn: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },

  verifyBtn: {
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  verifyBtnText: {
    color: "#166534",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 4,
  },

  completedBtn: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  completedBtnText: {
    color: "#15803d",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },

  rejectBtn: {
    width: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  closeBtn: { backgroundColor: "#f1f5f9", padding: 6, borderRadius: 20 },

  infoSection: { marginBottom: 24 },
  sectionHeader: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "800",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoText: { fontSize: 15, color: "#475569", marginBottom: 6 },
  bold: { fontWeight: "700", color: "#0f172a" },

  contactCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  contactVal: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  phoneVal: { color: "#2563eb", fontWeight: "600", marginTop: 2 },

  specSection: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  specGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  specItem: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  specLabel: { fontSize: 12, color: "#64748b", fontWeight: "600" },
  specVal: { fontSize: 16, fontWeight: "800", color: "#0f172a" },

  alertBox: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  alertText: {
    color: "#dc2626",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 8,
  },

  guidelinesBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  guidelinesLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#94a3b8",
    marginTop: 7,
    marginRight: 10,
  },
  guidelinesText: { flex: 1, fontSize: 14, color: "#334155", lineHeight: 22 },
});
