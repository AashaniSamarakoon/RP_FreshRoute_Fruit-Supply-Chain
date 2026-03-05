// app/transporter/index.tsx
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../components/header";

// Types
interface Job {
  id: string;
  route_name: string;
  job_date: string;
  total_weight_kg: number;
  status: string;
  vehicle_type_assigned: string;
}

export default function TransporterDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]); // For search
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);

  const fetchData = async () => {
    try {
      try {
        const data = await api.get(`/api/transporter/jobs`);
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
        setVehicleInfo(data.vehicle);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSearch = (text: string) => {
    if (!text) {
      setFilteredJobs(jobs);
      return;
    }
    const lowerText = text.toLowerCase();
    const filtered = jobs.filter(
      (job) =>
        job.route_name.toLowerCase().includes(lowerText) ||
        job.status.toLowerCase().includes(lowerText),
    );
    setFilteredJobs(filtered);
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/transporter/job/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.routeTitle}>{item.route_name}</Text>
        <View
          style={[
            styles.badge,
            item.status === "SCHEDULED" ? styles.badgeBlue : styles.badgeGreen,
          ]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          {new Date(item.job_date).toDateString()}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="cube-outline" size={16} color="#666" />
        <Text style={styles.infoText}>Load: {item.total_weight_kg} kg</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.clickHint}>Tap to view details & route</Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );

  // --- TESTING ONLY: quick open fruit grading with mock IDs. Remove this block when not testing. ---
  const openFruitGradingTest = () => {
    router.push({
      pathname: "/transporter/fruit-grading",
      params: {
        job_id: "test-job-mock",
        order_id: "test-order-mock",
        pickup_lat: "6.9271",
        pickup_lng: "79.8612",
      },
    });
  };
  // --- END TESTING ONLY ---

  const SubHeader = () => (
    <>
      <View style={styles.subHeaderContainer}>
        <Text style={styles.sectionTitle}>My Jobs</Text>
        {vehicleInfo && (
          <View style={styles.vehicleTag}>
            <Ionicons name="bus-outline" size={14} color="#718096" />
            <Text style={styles.vehicleText}>
              {vehicleInfo.vehicle_license_plate}
            </Text>
          </View>
        )}
      </View>
      {/* TESTING ONLY - remove this block and openFruitGradingTest + test styles */}
      <TouchableOpacity
        style={styles.testGradingBtn}
        onPress={openFruitGradingTest}
      >
        <Ionicons name="camera-outline" size={16} color="#fff" />
        <Text style={styles.testGradingBtnText}>Test grading</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      {/* New Header (No props needed for name) */}
      <Header onSearch={handleSearch} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2f855a"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobCard}
            ListHeaderComponent={SubHeader}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No active jobs assigned.</Text>
            }
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, backgroundColor: "#f5f7fa", paddingHorizontal: 16 },

  // Sub Header Styles
  subHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3748",
  },
  vehicleTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vehicleText: {
    fontSize: 13,
    color: "#4a5568",
    marginLeft: 4,
    fontWeight: "600",
  },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeTitle: { fontSize: 18, fontWeight: "bold", color: "#2d3748" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeBlue: { backgroundColor: "#bee3f8" },
  badgeGreen: { backgroundColor: "#c6f6d5" },
  badgeText: { fontSize: 12, fontWeight: "bold", color: "#2c5282" },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { marginLeft: 8, color: "#4a5568", fontSize: 14 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  clickHint: { fontSize: 12, color: "#a0aec0" },
  emptyText: { textAlign: "center", marginTop: 50, color: "#a0aec0" },

  // TESTING ONLY - remove with the testing block in JSX
  testGradingBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#805ad5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  testGradingBtnText: { fontSize: 12, color: "#fff", fontWeight: "600" },
});
