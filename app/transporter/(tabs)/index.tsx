// app/transporter/index.tsx
import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);

  // New state for graceful error handling
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setErrorMessage(null); // Clear previous errors

      const data = await api.get(`/api/transporter/jobs`);

      const allJobs = data.data?.jobs || data.jobs || [];
      const activeJobs = allJobs.filter((j: Job) => j.status !== "COMPLETED");

      setJobs(activeJobs);
      setFilteredJobs(activeJobs);
      setVehicleInfo(data.data?.vehicle || data.vehicle);
    } catch (error: any) {
      // Safely parse the error message coming from your Node backend
      const backendErrorMsg =
        error?.response?.data?.message ||
        error?.message ||
        JSON.stringify(error);

      // Check if it's the expected "No vehicle" error
      if (backendErrorMsg.includes("No vehicle assigned")) {
        // Quietly handle the expected business logic without a red console error
        setErrorMessage(
          "You haven't been assigned a vehicle yet. Please contact your dispatch manager.",
        );
      } else {
        // It's a real network/server failure, so we log it and show the generic message
        console.error("Failed to load dashboard data", error);
        setErrorMessage(
          "We couldn't connect to the server. Please pull down to refresh.",
        );
      }

      // Ensure the lists are cleared out on error
      setJobs([]);
      setFilteredJobs([]);
      setVehicleInfo(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, []),
  );

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

  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "SCHEDULED":
        return { bg: "#fffaf0", text: "#dd6b20" }; // Warm Orange
      case "COMPLETED":
        return { bg: "#f0fff4", text: "#2f855a" }; // Green
      default:
        return { bg: "#ebf8ff", text: "#3182ce" }; // Blue
    }
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => router.push(`/transporter/job/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.routeTitle} numberOfLines={2}>
              {item.route_name}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.badgeText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons
                name="calendar-clear-outline"
                size={16}
                color="#4a5568"
              />
            </View>
            <Text style={styles.infoText}>
              {new Date(item.job_date).toDateString()}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={16} color="#4a5568" />
            </View>
            <Text style={styles.infoText}>{item.total_weight_kg} kg</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.clickHint}>View details & route</Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#cbd5e0" />
        </View>
      </TouchableOpacity>
    );
  };

  const SubHeader = () => (
    <View style={styles.subHeaderContainer}>
      <Text style={styles.sectionTitle}>Active Deliveries</Text>
      {vehicleInfo && (
        <View style={styles.vehicleTag}>
          <Ionicons name="bus" size={14} color="#4a5568" />
          <Text style={styles.vehicleText}>
            {vehicleInfo.vehicle_license_plate}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
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
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={errorMessage ? "alert-circle-outline" : "bus-outline"}
                  size={60}
                  color={errorMessage ? "#f87171" : "#cbd5e0"}
                />
                <Text
                  style={[styles.emptyText, errorMessage && styles.errorText]}
                >
                  {errorMessage || "No active jobs assigned."}
                </Text>
              </View>
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
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { flex: 1, paddingHorizontal: 16 },

  // Sub Header Styles
  subHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  vehicleTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vehicleText: {
    fontSize: 12,
    color: "#334155",
    marginLeft: 6,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 24,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoGrid: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    borderStyle: "dashed",
  },
  clickHint: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },

  // Empty State Styles
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 30,
  },
  emptyText: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 24,
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
  },
});
