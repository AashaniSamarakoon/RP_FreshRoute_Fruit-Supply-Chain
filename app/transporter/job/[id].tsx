import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../../config";

interface ManifestItem {
  sequence: number;
  type: "PICKUP" | "DROP";
  lat: number;
  lng: number;
  location?: string;
  distance_from_last_km: number;
  order_id: string;
}

// Type for the enriched order data
interface OrderInfo {
  id: string;
  fruit_type: string;
  fruit_variant: string;
  quantity: number;
  farmer: { name: string; phone: string } | null;
  buyer: { name: string; phone: string } | null;
  specs: {
    optimal_temp_c: number;
    max_safe_temp_c: number;
    force_refrigeration: boolean;
  } | null;
}

export default function JobDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [job, setJob] = useState<any>(null);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [ordersData, setOrdersData] = useState<Record<string, OrderInfo>>({});

  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderInfo | null>(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/transporter/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setJob(data);
        setManifest(data.route_manifest || []);
        // Store the detailed order map
        setOrdersData(data.orders_data || {});
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = () => {
    if (!manifest.length) return;
    const origin = `${manifest[0].lat},${manifest[0].lng}`;
    const destination = `${manifest[manifest.length - 1].lat},${
      manifest[manifest.length - 1].lng
    }`;
    let waypoints = "";
    if (manifest.length > 2) {
      const stops = manifest.slice(1, manifest.length - 1);
      waypoints =
        "&waypoints=" + stops.map((s) => `${s.lat},${s.lng}`).join("|");
    }
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleAction = (type: "PICKUP" | "DROP", seq: number) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to confirm this ${type}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => console.log(`Confirmed ${type} at seq ${seq}`),
        },
      ]
    );
  };

  const viewOrderInfo = (orderId: string) => {
    const info = ordersData[orderId];
    if (info) {
      setSelectedOrder(info);
      setModalVisible(true);
    } else {
      Alert.alert("Info", "Order details not available.");
    }
  };

  if (loading)
    return (
      <ActivityIndicator style={{ flex: 1 }} size="large" color="#2f855a" />
    );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Info */}
        <View style={styles.headerCard}>
          <Text style={styles.title}>{job?.route_name}</Text>
          <Text style={styles.date}>
            {new Date(job?.job_date).toDateString()}
          </Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Total Load</Text>
              <Text style={styles.statValue}>{job?.total_weight_kg} kg</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Stops</Text>
              <Text style={styles.statValue}>{manifest.length}</Text>
            </View>
          </View>
        </View>

        {/* Map Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.btn, styles.btnMap]}
            onPress={() => router.push(`/transporter/map/${id}`)}
          >
            <Ionicons name="map" size={20} color="#fff" />
            <Text style={styles.btnText}>View Route</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnGoogle]}
            onPress={openGoogleMaps}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.btnText}>Google Nav</Text>
          </TouchableOpacity>
        </View>

        {/* Manifest Timeline */}
        <Text style={styles.sectionTitle}>Route Manifest</Text>
        <View style={styles.timeline}>
          {manifest.map((stop, index) => (
            <View key={index} style={styles.stopItem}>
              {/* Timeline Line */}
              <View style={styles.timelineLeft}>
                <View
                  style={[
                    styles.dot,
                    stop.type === "PICKUP" ? styles.dotGreen : styles.dotRed,
                  ]}
                />
                {index < manifest.length - 1 && <View style={styles.line} />}
              </View>

              {/* Content */}
              <View style={styles.stopContent}>
                <View style={styles.stopHeader}>
                  <Text style={styles.stopType}>{stop.type}</Text>
                  <Text style={styles.stopDist}>
                    {stop.distance_from_last_km > 0
                      ? `+${stop.distance_from_last_km} km`
                      : "Start"}
                  </Text>
                </View>

                <Text style={styles.stopCoords}>
                  Lat: {stop.lat.toFixed(4)}, Lng: {stop.lng.toFixed(4)}
                </Text>

                {/* Buttons Row */}
                <View style={styles.stopButtons}>
                  {/* View Info Button */}
                  <TouchableOpacity
                    style={styles.infoBtn}
                    onPress={() => viewOrderInfo(stop.order_id)}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#2b6cb0"
                    />
                    <Text style={styles.infoBtnText}>View Info</Text>
                  </TouchableOpacity>

                  {/* Action Button */}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleAction(stop.type, stop.sequence)}
                  >
                    <Text style={styles.actionBtnText}>
                      Confirm {stop.type === "PICKUP" ? "Pickup" : "Drop"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ORDER DETAILS MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View>
                {/* 1. Fruit Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Cargo Info</Text>
                  <Text style={styles.infoText}>
                    Product:{" "}
                    <Text style={styles.bold}>
                      {selectedOrder.fruit_type} ({selectedOrder.fruit_variant})
                    </Text>
                  </Text>
                  <Text style={styles.infoText}>
                    Quantity:{" "}
                    <Text style={styles.bold}>{selectedOrder.quantity} kg</Text>
                  </Text>
                </View>

                {/* 2. Contact Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionHeader}>Contacts</Text>
                  <View style={styles.contactRow}>
                    <Text style={styles.subLabel}>Farmer:</Text>
                    <Text style={styles.contactVal}>
                      {selectedOrder.farmer?.name}
                    </Text>
                    <Text style={styles.phoneVal}>
                      {selectedOrder.farmer?.phone || "No phone"}
                    </Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Text style={styles.subLabel}>Buyer:</Text>
                    <Text style={styles.contactVal}>
                      {selectedOrder.buyer?.name}
                    </Text>
                    <Text style={styles.phoneVal}>
                      {selectedOrder.buyer?.phone || "No phone"}
                    </Text>
                  </View>
                </View>

                {/* 3. Transport Specs */}
                {selectedOrder.specs && (
                  <View style={[styles.infoSection, styles.specSection]}>
                    <Text style={styles.sectionHeader}>
                      Transport Requirements
                    </Text>
                    <View style={styles.specGrid}>
                      <View style={styles.specItem}>
                        <Ionicons
                          name="thermometer-outline"
                          size={16}
                          color="#c53030"
                        />
                        <Text style={styles.specLabel}>Max Temp</Text>
                        <Text style={styles.specVal}>
                          {selectedOrder.specs.max_safe_temp_c}°C
                        </Text>
                      </View>
                      <View style={styles.specItem}>
                        <Ionicons
                          name="snow-outline"
                          size={16}
                          color="#2b6cb0"
                        />
                        <Text style={styles.specLabel}>Optimal</Text>
                        <Text style={styles.specVal}>
                          {selectedOrder.specs.optimal_temp_c}°C
                        </Text>
                      </View>
                    </View>
                    {selectedOrder.specs.force_refrigeration && (
                      <View style={styles.alertBox}>
                        <Text style={styles.alertText}>
                          ⚠️ STRICT REFRIGERATION REQUIRED
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa" },
  scroll: { padding: 16, paddingBottom: 40 },
  headerCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#2d3748" },
  date: { color: "#718096", marginBottom: 12 },
  statRow: { flexDirection: "row", marginTop: 8 },
  stat: { marginRight: 24 },
  statLabel: { fontSize: 12, color: "#a0aec0", textTransform: "uppercase" },
  statValue: { fontSize: 18, fontWeight: "bold", color: "#2f855a" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  btn: {
    flex: 0.48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 10,
  },
  btnMap: { backgroundColor: "#4299e1" },
  btnGoogle: { backgroundColor: "#e53e3e" },
  btnText: { color: "#fff", fontWeight: "bold", marginLeft: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#2d3748",
  },
  timeline: { paddingLeft: 8 },
  stopItem: { flexDirection: "row", marginBottom: 24 },
  timelineLeft: { alignItems: "center", marginRight: 16, width: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, zIndex: 1 },
  dotGreen: { backgroundColor: "#48bb78" },
  dotRed: { backgroundColor: "#f56565" },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: "#cbd5e0",
    position: "absolute",
    top: 16,
    bottom: -24,
  },
  stopContent: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },
  stopHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  stopType: { fontWeight: "bold", color: "#4a5568" },
  stopDist: { fontSize: 12, color: "#a0aec0" },
  stopCoords: { color: "#718096", fontSize: 12, marginBottom: 8 },

  // New Styles
  stopButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  infoBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#bee3f8",
    borderRadius: 6,
    flex: 0.45,
    justifyContent: "center",
  },
  infoBtnText: {
    color: "#2b6cb0",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionBtn: {
    backgroundColor: "#edf2f7",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",
    flex: 0.5,
  },
  actionBtnText: { color: "#2d3748", fontWeight: "600", fontSize: 12 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  infoSection: { marginBottom: 16 },
  sectionHeader: {
    fontSize: 14,
    color: "#718096",
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  infoText: { fontSize: 16, color: "#2d3748", marginBottom: 4 },
  bold: { fontWeight: "bold" },
  contactRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  subLabel: { width: 60, fontWeight: "600", color: "#4a5568" },
  contactVal: { flex: 1, color: "#2d3748" },
  phoneVal: { color: "#2b6cb0" },
  specSection: { backgroundColor: "#f7fafc", padding: 10, borderRadius: 8 },
  specGrid: { flexDirection: "row" },
  specItem: { marginRight: 24, alignItems: "center" },
  specLabel: { fontSize: 12, color: "#718096" },
  specVal: { fontSize: 16, fontWeight: "bold" },
  alertBox: {
    marginTop: 10,
    backgroundColor: "#fff5f5",
    padding: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  alertText: { color: "#c53030", fontWeight: "bold", fontSize: 12 },
});
