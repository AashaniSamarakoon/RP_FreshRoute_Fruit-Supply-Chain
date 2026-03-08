// app/transporter/notifications.tsx
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AlertData {
  id: string;
  vehicle_id: string;
  order_id: string;
  alert_type: string;
  message: string;
  value_at_time: number;
  created_at: string;
  is_read: boolean;
  optimal_temp_c: number;
  max_safe_temp_c: number;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      // 1. Get Logged-in User
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) return;
      const user = JSON.parse(userJson);

      // 2. Get Vehicle ID
      const { data: tData } = await supabase
        .from("transporter")
        .select("vehicle_id")
        .eq("user_id", user.id)
        .single();

      if (!tData?.vehicle_id) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      setVehicleId(tData.vehicle_id);

      // 3. Fetch Alerts
      const { data: alertsData, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("vehicle_id", tData.vehicle_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAlerts(alertsData || []);
    } catch (error) {
      console.error("Failed to fetch alerts", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const markAsRead = async (alertId: string, currentStatus: boolean) => {
    if (currentStatus) return; // Already read

    // Optimistic UI update
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a)),
    );

    // DB update
    await supabase.from("alerts").update({ is_read: true }).eq("id", alertId);
  };

  const markAllAsRead = async () => {
    if (!vehicleId) return;

    // Optimistic UI update
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));

    // DB update
    await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("vehicle_id", vehicleId)
      .eq("is_read", false);
  };

  // Helper to format date nicely
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderAlertCard = ({ item }: { item: AlertData }) => {
    const isUnread = !item.is_read;
    const isTempAlert =
      item.alert_type === "HIGH_TEMP" || item.message.includes("Temp");

    return (
      <TouchableOpacity
        style={[styles.card, isUnread && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => markAsRead(item.id, item.is_read)}
      >
        <View style={styles.cardIconBox}>
          <View
            style={[
              styles.iconCircle,
              isTempAlert ? styles.iconRed : styles.iconBlue,
            ]}
          >
            <Ionicons
              name={isTempAlert ? "thermometer" : "notifications"}
              size={20}
              color={isTempAlert ? "#dc2626" : "#2563eb"}
            />
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.alertType, isUnread && styles.textBold]}>
              {item.alert_type
                ? item.alert_type.replace("_", " ")
                : "System Alert"}
            </Text>
            <Text style={styles.timeText}>{formatTime(item.created_at)}</Text>
          </View>

          <Text style={[styles.messageText, isUnread && styles.textBoldDark]}>
            {item.message}
          </Text>

          {item.value_at_time && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Recorded Value:</Text>
              <Text style={styles.metricValue}>
                {item.value_at_time.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Unread indicator dot */}
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Premium Header */}
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBackBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>

          <TouchableOpacity
            onPress={markAllAsRead}
            style={styles.headerActionBtn}
          >
            <Ionicons name="checkmark-done" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item) => item.id}
            renderItem={renderAlertCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={60}
                  color="#cbd5e0"
                />
                <Text style={styles.emptyText}>You're all caught up!</Text>
                <Text style={styles.emptySubText}>
                  No active alerts for your vehicle.
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
  safeArea: { flex: 1, backgroundColor: "#166534" }, // Match header for top notch
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  customHeader: {
    backgroundColor: "#166534",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 20 : 10,
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
  headerActionBtn: { padding: 4, marginRight: -8 },

  listContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
  },
  cardUnread: {
    backgroundColor: "#fef2f2", // Very light red tint for urgent unread
    borderColor: "#fecaca",
  },

  cardIconBox: { marginRight: 16 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconRed: { backgroundColor: "#fee2e2" },
  iconBlue: { backgroundColor: "#dbeafe" },

  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  alertType: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textBold: { color: "#dc2626", fontWeight: "800" },
  timeText: { fontSize: 11, color: "#94a3b8", fontWeight: "500" },

  messageText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    fontWeight: "500",
  },
  textBoldDark: { color: "#0f172a", fontWeight: "700" },

  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  metricLabel: { fontSize: 12, color: "#64748b", marginRight: 6 },
  metricValue: { fontSize: 12, color: "#dc2626", fontWeight: "800" },

  unreadDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444",
  },

  // Empty State
  emptyContainer: { alignItems: "center", marginTop: 100 },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
  },
  emptySubText: { marginTop: 8, fontSize: 14, color: "#94a3b8" },
});
