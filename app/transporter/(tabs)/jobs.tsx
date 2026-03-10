// app/transporter/jobs.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../../../utils/supabaseClient";

interface Job {
  id: string;
  route_name: string;
  job_date: string;
  total_weight_kg: number;
  status: string;
  vehicle_type_assigned: string;
}

export default function JobsScreen() {
  const router = useRouter();

  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchJobs = async () => {
    try {
      // 1. Get Logged-in User
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) return;
      const user = JSON.parse(userJson);

      // 2. Find the Vehicle ID assigned to this Transporter
      const { data: tData, error: tError } = await supabase
        .from("transporter")
        .select("vehicle_id")
        .eq("user_id", user.id)
        .single();

      if (tError || !tData?.vehicle_id) {
        console.log("No vehicle assigned to this transporter.");
        setAllJobs([]);
        applyFilters([], activeTab, searchQuery);
        return;
      }

      // 3. Fetch All Jobs for this Vehicle directly from Supabase
      const { data: jobsData, error: jobsError } = await supabase
        .from("transport_jobs")
        .select("*")
        .eq("vehicle_id", tData.vehicle_id)
        .order("job_date", { ascending: false }); // Get newest first

      if (jobsError) throw jobsError;

      setAllJobs(jobsData || []);
      applyFilters(jobsData || [], activeTab, searchQuery);
    } catch (error) {
      console.error("Failed to load jobs from Supabase", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchJobs();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  // --- Filtering Logic ---
  const applyFilters = (
    jobs: Job[],
    tab: "ACTIVE" | "COMPLETED",
    search: string,
  ) => {
    let filtered = jobs.filter((job) => {
      if (tab === "ACTIVE") {
        return job.status !== "COMPLETED";
      } else {
        return job.status === "COMPLETED";
      }
    });

    if (search.trim() !== "") {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.route_name?.toLowerCase().includes(lowerSearch) ||
          job.status?.toLowerCase().includes(lowerSearch),
      );
    }

    // Sort: Newest first for history, oldest (most urgent) first for active
    filtered.sort((a, b) => {
      const dateA = new Date(a.job_date).getTime();
      const dateB = new Date(b.job_date).getTime();
      return tab === "ACTIVE" ? dateA - dateB : dateB - dateA;
    });

    setDisplayedJobs(filtered);
  };

  const handleTabChange = (tab: "ACTIVE" | "COMPLETED") => {
    setActiveTab(tab);
    applyFilters(allJobs, tab, searchQuery);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    applyFilters(allJobs, activeTab, text);
  };

  // --- UI Helpers ---
  const getStatusStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case "SCHEDULED":
        return { bg: "#fffaf0", text: "#dd6b20" };
      case "PICKED_UP":
        return { bg: "#ebf8ff", text: "#3182ce" };
      case "COMPLETED":
        return { bg: "#f0fdf4", text: "#15803d" };
      default:
        return { bg: "#f1f5f9", text: "#475569" };
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
                color="#64748b"
              />
            </View>
            <Text style={styles.infoText}>
              {new Date(item.job_date).toDateString()}
            </Text>
          </View>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Ionicons name="scale-outline" size={16} color="#64748b" />
            </View>
            <Text style={styles.infoText}>{item.total_weight_kg} kg</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.clickHint}>
            {activeTab === "ACTIVE"
              ? "View details & route"
              : "View job summary"}
          </Text>
          <Ionicons name="arrow-forward-circle" size={20} color="#cbd5e0" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Jobs</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by route or status..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#cbd5e0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "ACTIVE" && styles.tabBtnActive,
            ]}
            onPress={() => handleTabChange("ACTIVE")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "ACTIVE" && styles.tabTextActive,
              ]}
            >
              Active & Scheduled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === "COMPLETED" && styles.tabBtnActive,
            ]}
            onPress={() => handleTabChange("COMPLETED")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "COMPLETED" && styles.tabTextActive,
              ]}
            >
              History
            </Text>
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2f855a"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={displayedJobs}
            keyExtractor={(item) => item.id}
            renderItem={renderJobCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name={
                    activeTab === "ACTIVE"
                      ? "bus-outline"
                      : "checkmark-done-circle-outline"
                  }
                  size={60}
                  color="#cbd5e0"
                />
                <Text style={styles.emptyText}>
                  {activeTab === "ACTIVE"
                    ? "No active jobs right now."
                    : "No completed jobs in your history."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight || 20) + 10 : 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#0f172a" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#0f172a" },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#e2e8f0",
    borderRadius: 12,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  tabTextActive: { color: "#0f172a", fontWeight: "700" },

  listContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: { flex: 1, marginRight: 12 },
  routeTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: 24,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  infoGrid: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: { color: "#475569", fontSize: 14, fontWeight: "600" },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    borderStyle: "dashed",
  },
  clickHint: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyText: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
  },
});
