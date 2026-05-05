// import Header from "@/components/Header";
// import { BuyerColors } from "@/constants/theme";
// import { supabase } from "@/utils/supabaseClient";
// import { Ionicons } from "@expo/vector-icons";
// import { logger } from "@/utils/logger";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import React, { useEffect, useMemo, useRef, useState } from "react";
// import {
//     ActivityIndicator,
//     Dimensions,
//     Linking,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import MapView, { Marker } from "react-native-maps";
// import { SafeAreaView } from "react-native-safe-area-context";
// // Import Bottom Sheet components
// import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

// const { width, height } = Dimensions.get("window");

// export default function TrackDeliveryScreen() {
//   const params = useLocalSearchParams<{
//     orderId: string;
//     farmerLat?: string;
//     farmerLng?: string;
//     buyerLat?: string;
//     buyerLng?: string;
//     driverLat?: string;
//     driverLng?: string;
//   }>();
//   const router = useRouter();

//   const [loading, setLoading] = useState(true);
//   const [order, setOrder] = useState<any>(null);

//   const bottomSheetRef = useRef<BottomSheet>(null);
//   const snapPoints = useMemo(() => ["15%", "15%"], []);

//   useEffect(() => {
//     if (params.orderId) fetchOrder();
//     else setLoading(false);
//   }, [params.orderId]);

//   const fetchOrder = async () => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase
//         .from("placed_orders")
//         .select("*")
//         .eq("id", params.orderId)
//         .single();
//       if (!error && data) setOrder(data);
//     } catch (e) {
//       console.log(e);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const farmerLocation = {
//     latitude: params.farmerLat ? Number(params.farmerLat) : 6.9271,
//     longitude: params.farmerLng ? Number(params.farmerLng) : 79.8612,
//   };
//   const buyerLocation = {
//     latitude: params.buyerLat ? Number(params.buyerLat) : 6.8407,
//     longitude: params.buyerLng ? Number(params.buyerLng) : 79.993,
//   };

//   const driverLocation =
//     params.driverLat && params.driverLng
//       ? {
//           latitude: Number(params.driverLat),
//           longitude: Number(params.driverLng),
//         }
//       : {
//           latitude: (farmerLocation.latitude + buyerLocation.latitude) / 2,
//           longitude: (farmerLocation.longitude + buyerLocation.longitude) / 2,
//         };

//   const mapCenter = {
//     latitude: (farmerLocation.latitude + buyerLocation.latitude) / 2,
//     longitude: (farmerLocation.longitude + buyerLocation.longitude) / 2,
//   };
//   const latDelta =
//     Math.abs(farmerLocation.latitude - buyerLocation.latitude) * 2.5 + 0.06;
//   const lngDelta =
//     Math.abs(farmerLocation.longitude - buyerLocation.longitude) * 2.5 + 0.06;

//   const handleCallDriver = () => {
//     const phone = order?.driver_phone ?? "+94771234567";
//     Linking.openURL(`tel:${phone}`);
//   };

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <Header title="Live Tracking" showBackButton />
//         <View style={styles.centerContainer}>
//           <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
//           <Text style={styles.loadingText}>Connecting to GPS...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
//       <Header title="Live Tracking" showBackButton />

//       <View style={styles.container}>
//         <MapView
//           style={styles.map}
//           initialRegion={{
//             latitude: mapCenter.latitude,
//             longitude: mapCenter.longitude,
//             latitudeDelta: latDelta,
//             longitudeDelta: lngDelta,
//           }}
//           mapPadding={{ top: 0, right: 0, bottom: height * 0.45, left: 0 }}
//         >
//           <Marker coordinate={farmerLocation} title="Pickup Location">
//             <View style={styles.markerContainer}>
//               <View
//                 style={[styles.smallMarkerIcon, { backgroundColor: "#F59E0B" }]}
//               >
//                 <Ionicons name="storefront" size={14} color="#FFF" />
//               </View>
//             </View>
//           </Marker>

//           <Marker coordinate={buyerLocation} title="Delivery Destination">
//             <View style={styles.markerContainer}>
//               <View
//                 style={[
//                   styles.smallMarkerIcon,
//                   { backgroundColor: BuyerColors.primaryGreen },
//                 ]}
//               >
//                 <Ionicons name="location" size={14} color="#FFF" />
//               </View>
//             </View>
//           </Marker>

//           <Marker coordinate={driverLocation} title={order?.driver_name ?? "Driver"}>
//             <View style={styles.markerContainer}>
//               <View style={[styles.driverMarkerIcon, { backgroundColor: "#3B82F6" }]}>
//                 <Ionicons name="car" size={20} color="#FFF" />
//               </View>
//             </View>
//           </Marker>
//         </MapView>

//         <View style={styles.etaOverlay}>
//           <Text style={styles.etaTitle}>Estimated Arrival</Text>
//           <Text style={styles.etaTime}>45 Mins</Text>
//         </View>

//         <BottomSheet
//           ref={bottomSheetRef}
//           index={0}
//           snapPoints={snapPoints}
//           style={styles.bottomSheetShadow}
//           handleIndicatorStyle={styles.grabHandle}
//           backgroundStyle={styles.bottomSheetBackground}
//         >
//           <BottomSheetScrollView
//             contentContainerStyle={styles.sheetContent}
//             showsVerticalScrollIndicator={false}
//             bounces={true}
//           >
//             <View style={styles.cardHeader}>
//               <View style={styles.driverInfo}>
//                 <View style={styles.driverAvatar}>
//                   <Ionicons name="person" size={20} color="#9CA3AF" />
//                 </View>
//                 <View>
//                   <Text style={styles.driverName}>{order?.driver_name ?? "Sunil Perera"}</Text>
//                   <Text style={styles.vehicleDetails}>{order?.vehicle_details ?? "WP CA-1234 • Mini Truck"}</Text>
//                 </View>
//               </View>

//               <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
//                 <Ionicons name="call" size={20} color="#16A34A" />
//               </TouchableOpacity>
//             </View>

//             <View style={{ height: 40 }} />
//           </BottomSheetScrollView>
//         </BottomSheet>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
//   centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
//   loadingText: {
//     marginTop: 16,
//     color: "#6B7280",
//     fontSize: 15,
//     fontWeight: "500",
//   },
//   container: { flex: 1, backgroundColor: "#F3F4F6", position: "relative" },

//   // --- Map Styles ---
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
//   markerContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   smallMarkerIcon: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 2,
//     borderColor: "#FFF",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 4,
//   },
//   driverMarkerIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 3,
//     borderColor: "#FFF",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 5,
//     elevation: 8,
//   },

//   // --- ETA Overlay ---
//   etaOverlay: {
//     position: "absolute",
//     top: 20,
//     alignSelf: "center",
//     backgroundColor: "rgba(255, 255, 255, 0.95)",
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 30,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 10,
//     alignItems: "center",
//     borderWidth: 1,
//     borderColor: "rgba(255,255,255,0.4)",
//   },
//   etaTitle: {
//     fontSize: 10,
//     color: "#6B7280",
//     fontWeight: "700",
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//     marginBottom: 2,
//   },
//   etaTime: {
//     fontSize: 20,
//     fontWeight: "900",
//     color: "#111827",
//   },

//   // --- Bottom Sheet Styles ---
//   bottomSheetShadow: {
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 20,
//   },
//   bottomSheetBackground: {
//     backgroundColor: "#FFFFFF",
//     borderTopLeftRadius: 32,
//     borderTopRightRadius: 32,
//   },
//   grabHandle: {
//     width: 48,
//     height: 5,
//     backgroundColor: "#D1D5DB",
//     borderRadius: 3,
//   },
//   sheetContent: {
//     paddingHorizontal: 24,
//     paddingTop: 12,
//   },

//   // --- Driver Info Section ---
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingBottom: 24,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F3F4F6",
//   },
//   driverInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 14,
//   },
//   driverAvatar: {
//     width: 52,
//     height: 52,
//     borderRadius: 26,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   driverName: {
//     fontSize: 17,
//     fontWeight: "800",
//     color: "#111827",
//     marginBottom: 4,
//   },
//   vehicleDetails: {
//     fontSize: 13,
//     color: "#6B7280",
//     fontWeight: "500",
//   },
//   callButton: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: "#F0FDF4",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: "#BBF7D0",
//   },

//   // --- Timeline Section ---
//   timelineContainer: {
//     marginTop: 24,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: "800",
//     color: "#111827",
//     marginBottom: 20,
//     letterSpacing: -0.2,
//   },
//   timelineWrapper: {
//     paddingLeft: 8,
//   },

//   // --- Order Details Card ---
//   orderDetailsCard: {
//     backgroundColor: "#F9FAFB",
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 24,
//     marginTop: 24,
//     borderWidth: 1,
//     borderColor: "#E5E7EB",
//   },
//   orderDetailsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   orderDetailItem: {},
//   orderDetailLabel: {
//     fontSize: 10,
//     fontWeight: "700",
//     color: "#9CA3AF",
//     textTransform: "uppercase",
//     letterSpacing: 0.5,
//     marginBottom: 4,
//   },
//   orderDetailValue: {
//     fontSize: 15,
//     fontWeight: "800",
//     color: "#111827",
//   },
//   orderDetailsDivider: {
//     height: 1,
//     backgroundColor: "#E5E7EB",
//     marginBottom: 12,
//   },
//   orderInfoRow: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 6,
//   },
//   orderInfoText: {
//     flex: 1,
//     fontSize: 13,
//     color: "#6B7280",
//     fontWeight: "500",
//     lineHeight: 18,
//   },
// });

import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { logger } from "@/utils/logger";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

interface Shipment {
  order_id: string;
  job_id: string | null;
  quantity: number;
  status: string;
  is_picked_up: boolean;
  vehicle: {
    id: string;
    vehicle_license_plate: string;
    vehicle_type: string;
    current_lat: number | null;
    current_lng: number | null;
    current_temp: number;
    current_humidity: number;
    transporter_id: string | null;
    driver_name: string;
    driver_phone: string | null;
  } | null;
}

export default function TrackDeliveryScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    farmerLat?: string;
    farmerLng?: string;
    buyerLat?: string;
    buyerLng?: string;
  }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [placedOrder, setPlacedOrder] = useState<any>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "35%"], []);

  useEffect(() => {
    let trackingChannel: any;

    const fetchAndSubscribe = async () => {
      if (!params.orderId) return;

      try {
        setLoading(true);

        // 1. Fetch the master Placed Order
        const { data: pOrder, error: pError } = await supabase
          .from("placed_orders")
          .select("*")
          .eq("id", params.orderId)
          .single();

        if (pError || !pOrder) throw new Error("Placed order not found");
        setPlacedOrder(pOrder);

        // 2. Fetch the corresponding logistical orders
        const { data: logOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("placed_order_id", pOrder.id);

        const targetOrderIds =
          logOrders && logOrders.length > 0
            ? logOrders.map((o) => o.id)
            : [pOrder.id];

        // 3. Search transport_jobs for manifests containing these order IDs
        let allJobs: any[] = [];
        for (const targetId of targetOrderIds) {
          const { data: tJobs } = await supabase
            .from("transport_jobs")
            .select(
              `
              id,
              status,
              route_manifest,
              vehicles (
                id, vehicle_license_plate, vehicle_type, current_lat, current_lng, current_temp, current_humidity, transporter_id
              )
            `,
            )
            .contains(
              "route_manifest",
              JSON.stringify([{ order_id: targetId }]),
            );

          if (tJobs) {
            allJobs = [...allJobs, ...tJobs];
          }
        }

        // Deduplicate jobs just in case
        allJobs = Array.from(new Map(allJobs.map((j) => [j.id, j])).values());

        // 4. Fetch Driver User Details based on transporter_id
        const transporterIds = [
          ...new Set(
            allJobs.map((j) => j.vehicles?.transporter_id).filter(Boolean),
          ),
        ];

        const driversMap: Record<
          string,
          { name: string; phone: string | null }
        > = {};

        if (transporterIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, first_name, last_name, phone")
            .in("id", transporterIds);

          if (usersData) {
            usersData.forEach((u) => {
              driversMap[u.id] = {
                name: `${u.first_name || ""} ${u.last_name || ""}`.trim(),
                phone: u.phone || null,
              };
            });
          }
        }

        // 5. Parse the Manifests to build the Shipments array
        const formattedShipments: Shipment[] = [];

        allJobs.forEach((job) => {
          if (!Array.isArray(job.route_manifest)) return;

          const pickupNode = job.route_manifest.find(
            (node: any) =>
              targetOrderIds.includes(node.order_id) && node.type === "PICKUP",
          );

          const dropNode = job.route_manifest.find(
            (node: any) =>
              targetOrderIds.includes(node.order_id) && node.type === "DROP",
          );

          if (pickupNode) {
            const isPickedUp = pickupNode.is_completed === true;
            const isDelivered =
              dropNode?.is_completed === true || job.status === "COMPLETED";

            let status = "pending";
            if (isDelivered) status = "completed";
            else if (isPickedUp) status = "PICKED_UP";

            const allocatedQty =
              pickupNode.allocated_quantity ||
              dropNode?.allocated_quantity ||
              0;

            let vehicleData = null;
            if (isPickedUp && job.vehicles) {
              const driverInfo = driversMap[job.vehicles.transporter_id] || {
                name: "Unknown Driver",
                phone: null,
              };
              vehicleData = {
                ...job.vehicles,
                driver_name: driverInfo.name,
                driver_phone: driverInfo.phone,
              };
            }

            formattedShipments.push({
              order_id: pickupNode.order_id,
              job_id: job.id,
              quantity: allocatedQty,
              status: status,
              is_picked_up: isPickedUp,
              vehicle: vehicleData,
            });
          }
        });

        setShipments(formattedShipments);

        // 6. Setup Realtime Subscriptions
        const activeVehicleIds = formattedShipments
          .filter((s) => s.is_picked_up && s.vehicle)
          .map((s) => s.vehicle!.id);

        if (activeVehicleIds.length > 0) {
          trackingChannel = supabase.channel(`multi-tracking-${pOrder.id}`);

          activeVehicleIds.forEach((vId) => {
            trackingChannel.on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "vehicles",
                filter: `id=eq.${vId}`,
              },
              (payload: any) => {
                setShipments((prev) =>
                  prev.map((shipment) =>
                    shipment.vehicle?.id === payload.new.id
                      ? {
                          ...shipment,
                          vehicle: { ...shipment.vehicle, ...payload.new },
                        }
                      : shipment,
                  ),
                );
              },
            );
          });

          trackingChannel.subscribe();
        }
       } catch (e) {
         logger.error(e);
       } finally {
         setLoading(false);
       }
    };

    fetchAndSubscribe();

    return () => {
      if (trackingChannel) supabase.removeChannel(trackingChannel);
    };
  }, [params.orderId]);

  // --- Dynamic Driver Call Action ---
  const handleCallDriver = () => {
    const activeVehicle = shipments[selectedIndex]?.vehicle;
    if (activeVehicle && activeVehicle.driver_phone) {
      Linking.openURL(`tel:${activeVehicle.driver_phone}`);
    } else {
      alert("Driver phone number is not available.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Live Tracking" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Locating your shipments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // --- Derived Global Stats ---
  const totalQty = placedOrder?.quantity || 1;
  const deliveredQty = shipments
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.quantity, 0);
  const progressPercent = Math.round((deliveredQty / totalQty) * 100);

  // --- Selected Shipment Data ---
  const activeShipment = shipments[selectedIndex];
  const activeVehicle = activeShipment?.vehicle;
  const isCurrentlyTracking = activeShipment?.is_picked_up && activeVehicle;

  // --- Map Coordinates ---
  const farmerLocation = {
    latitude: params.farmerLat ? Number(params.farmerLat) : 6.9271,
    longitude: params.farmerLng ? Number(params.farmerLng) : 79.8612,
  };
  const buyerLocation = {
    latitude: params.buyerLat ? Number(params.buyerLat) : 6.8407,
    longitude: params.buyerLng ? Number(params.buyerLng) : 79.993,
  };

  const driverLocation =
    isCurrentlyTracking &&
    activeVehicle.current_lat &&
    activeVehicle.current_lng
      ? {
          latitude: activeVehicle.current_lat,
          longitude: activeVehicle.current_lng,
        }
      : farmerLocation;

  const mapCenter = isCurrentlyTracking
    ? driverLocation
    : {
        latitude: (farmerLocation.latitude + buyerLocation.latitude) / 2,
        longitude: (farmerLocation.longitude + buyerLocation.longitude) / 2,
      };

  const latDelta =
    Math.abs(farmerLocation.latitude - buyerLocation.latitude) * 2.5 + 0.06;
  const lngDelta =
    Math.abs(farmerLocation.longitude - buyerLocation.longitude) * 2.5 + 0.06;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header title="Live Tracking" showBackButton />

      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          region={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          mapPadding={{ top: 220, right: 0, bottom: height * 0.25, left: 0 }}
        >
          <Marker coordinate={farmerLocation} title="Pickup">
            <View
              style={[styles.smallMarkerIcon, { backgroundColor: "#F59E0B" }]}
            >
              <Ionicons name="storefront" size={14} color="#FFF" />
            </View>
          </Marker>

          <Marker coordinate={buyerLocation} title="Delivery">
            <View
              style={[
                styles.smallMarkerIcon,
                { backgroundColor: BuyerColors.primaryGreen },
              ]}
            >
              <Ionicons name="location" size={14} color="#FFF" />
            </View>
          </Marker>

          {isCurrentlyTracking && (
            <Marker
              coordinate={driverLocation}
              title={activeVehicle.vehicle_license_plate}
            >
              <View
                style={[
                  styles.driverMarkerIcon,
                  { backgroundColor: "#2563EB" },
                ]}
              >
                <Ionicons name="car" size={20} color="#FFF" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* --- Top UI Overlays --- */}
        <View style={styles.topOverlays}>
          {/* Section A: Master Progress Bar */}
          <View style={styles.masterProgressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>
                Order #{placedOrder?.id.substring(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.progressPercent}>
                {progressPercent}% Delivered
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {deliveredQty} / {totalQty} kg successfully arrived
            </Text>
          </View>

          {/* Section B: Shipment Carousel */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {shipments.map((shipment, index) => {
                const isSelected = index === selectedIndex;
                const isDelivered = shipment.status === "completed";
                const isTransit = shipment.is_picked_up && !isDelivered;

                return (
                  <TouchableOpacity
                    key={shipment.job_id || index.toString()}
                    activeOpacity={0.8}
                    onPress={() => setSelectedIndex(index)}
                    style={[
                      styles.shipmentCard,
                      isSelected && styles.shipmentCardActive,
                    ]}
                  >
                    <View style={styles.shipmentHeader}>
                      <Text
                        style={[
                          styles.shipmentTitle,
                          isSelected && { color: "#FFF" },
                        ]}
                      >
                        📦 Shipment {index + 1}
                      </Text>
                      {isDelivered && (
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={isSelected ? "#FFF" : "#16A34A"}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.shipmentSub,
                        isSelected && { color: "rgba(255,255,255,0.9)" },
                      ]}
                    >
                      {shipment.quantity} kg •{" "}
                      {isDelivered
                        ? "Delivered"
                        : isTransit
                          ? "In Transit"
                          : "Awaiting Pickup"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Live Telemetry Overlay */}
          {isCurrentlyTracking &&
            !["completed"].includes(activeShipment.status) && (
              <View style={styles.telemetryOverlay}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE SENSORS</Text>
                </View>
                <View style={styles.telemetryDividerVertical} />
                <View style={styles.telemetryItem}>
                  <Ionicons
                    name="thermometer-outline"
                    size={18}
                    color="#DC2626"
                  />
                  <Text style={styles.telemetryValue}>
                    {activeVehicle.current_temp.toFixed(1)}°
                  </Text>
                </View>
                <View style={styles.telemetryItem}>
                  <Ionicons name="water-outline" size={18} color="#2563EB" />
                  <Text style={styles.telemetryValue}>
                    {activeVehicle.current_humidity.toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
        </View>

        {/* Bottom Sheet for Selected Driver Details */}
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          style={styles.bottomSheetShadow}
          handleIndicatorStyle={styles.grabHandle}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sheetSectionTitle}>Shipment Status</Text>
            <View style={styles.cardHeader}>
              <View style={styles.driverInfo}>
                <View style={styles.driverAvatar}>
                  <Ionicons
                    name={isCurrentlyTracking ? "person" : "time"}
                    size={20}
                    color="#9CA3AF"
                  />
                </View>
                <View>
                  <Text style={styles.driverName}>
                    {isCurrentlyTracking
                      ? activeVehicle.driver_name
                      : activeShipment?.status === "completed"
                        ? "Delivery Complete"
                        : "Awaiting Pickup at Farm"}
                  </Text>
                  <Text style={styles.vehicleDetails}>
                    {isCurrentlyTracking
                      ? `${activeVehicle.vehicle_license_plate} • ${activeVehicle.vehicle_type || "Truck"}`
                      : "Location hidden until pickup"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.callButton,
                  (!isCurrentlyTracking || !activeVehicle?.driver_phone) && {
                    opacity: 0.5,
                  },
                ]}
                onPress={handleCallDriver}
                disabled={!isCurrentlyTracking || !activeVehicle?.driver_phone}
              >
                <Ionicons
                  name="call"
                  size={20}
                  color={
                    isCurrentlyTracking && activeVehicle?.driver_phone
                      ? "#16A34A"
                      : "#9CA3AF"
                  }
                />
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },
  container: { flex: 1, backgroundColor: "#F3F4F6", position: "relative" },

  map: { ...StyleSheet.absoluteFillObject },

  smallMarkerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  driverMarkerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  // --- Overlays ---
  topOverlays: { position: "absolute", top: 16, width: "100%", gap: 12 },

  masterProgressCard: {
    backgroundColor: "rgba(255,255,255,0.95)",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressTitle: { fontSize: 14, fontWeight: "bold", color: "#111827" },
  progressPercent: {
    fontSize: 14,
    fontWeight: "bold",
    color: BuyerColors.primaryGreen,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: BuyerColors.primaryGreen,
  },
  progressText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

  shipmentCard: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 150,
  },
  shipmentCardActive: {
    backgroundColor: BuyerColors.primaryGreen,
    borderColor: BuyerColors.primaryGreen,
  },
  shipmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  shipmentTitle: { fontSize: 13, fontWeight: "bold", color: "#374151" },
  shipmentSub: { fontSize: 12, color: "#6B7280", fontWeight: "600" },

  telemetryOverlay: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    gap: 12,
    marginTop: 4,
  },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#DC2626" },
  liveText: { fontSize: 10, fontWeight: "800", color: "#DC2626" },
  telemetryDividerVertical: {
    width: 1,
    height: 16,
    backgroundColor: "#E5E7EB",
  },
  telemetryItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  telemetryValue: { fontSize: 14, fontWeight: "bold", color: "#111827" },

  // --- Bottom Sheet Styles ---
  bottomSheetShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  grabHandle: {
    width: 48,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
  },
  sheetContent: { paddingHorizontal: 24, paddingTop: 12 },
  sheetSectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  driverInfo: { flexDirection: "row", alignItems: "center", gap: 14 },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  driverName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  vehicleDetails: { fontSize: 13, color: "#6B7280", fontWeight: "500" },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
});
