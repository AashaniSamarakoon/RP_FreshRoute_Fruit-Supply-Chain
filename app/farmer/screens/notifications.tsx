import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslation } from "../../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const YELLOW = "#fbbf24";
const ORANGE = "#f59e0b";
const BLUE = "#3b82f6";
const RED = "#ef4444";

interface NotificationItem {
  id: string | number;
  title: string;
  description: string;
  time: string;
  category?: string;
  severity?: string;
  read_at?: string | null;
  icon?: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Price Alerts" | "Demand Updates" | "App Notifs">("All");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, [selectedFilter]);

  const filterToCategorySlug = (filter: typeof selectedFilter) => {
    switch (filter) {
      case "Price Alerts":
        return "price";
      case "Demand Updates":
        return "demand";
      case "App Notifs":
        return "app";
      default:
        return "";
    }
  };

  const loadNotifications = async () => {
    console.log("[NOTIFICATIONS] Loading notifications...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[NOTIFICATIONS] No token found");
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const categorySlug = filterToCategorySlug(selectedFilter);
      const url = categorySlug
        ? `${BACKEND_URL}/api/farmer/notifications/category/${categorySlug}`
        : `${BACKEND_URL}/api/farmer/notifications`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        console.log("[NOTIFICATIONS] Error:", data.message);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      const mapped: NotificationItem[] = (data.notifications || data || []).map((n: any) => ({
        id: n.id || n._id,
        title: n.title,
        description: n.body,
        time: n.created_at,
        category: n.category,
        severity: n.severity,
        read_at: n.read_at,
      }));

      setNotifications(mapped);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("[NOTIFICATIONS] Unexpected error", err);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      await fetch(`${BACKEND_URL}/api/farmer/notifications/read-all`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    } catch (err) {
      console.error("[NOTIFICATIONS] markAllRead error", err);
    }
  };

  const markAsReadAndNavigate = async (notification: NotificationItem) => {
    const { id } = notification;
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        await fetch(`${BACKEND_URL}/api/farmer/notifications/${id}/read`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      router.push({
        pathname: "/farmer/screens/notification-detail",
        params: {
          id: String(id),
          title: notification.title,
          body: notification.description,
          created_at: notification.time,
          category: notification.category || "",
          severity: notification.severity || "",
        },
      });
    } catch (err) {
      console.error("[NOTIFICATIONS] markAsRead error", err);
      router.push({
        pathname: "/farmer/screens/notification-detail",
        params: {
          id: String(id),
          title: notification.title,
          body: notification.description,
          created_at: notification.time,
          category: notification.category || "",
          severity: notification.severity || "",
        },
      });
    }
  };

  const iconForNotification = (n: NotificationItem) => {
    if (n.severity === "high") return { name: "alert-circle", color: RED, bg: "#fee2e2" };
    if (n.category?.toLowerCase().includes("price")) return { name: "trending-up", color: BLUE, bg: "#dbeafe" };
    if (n.category?.toLowerCase().includes("demand")) return { name: "pulse", color: PRIMARY_GREEN, bg: LIGHT_GREEN };
    return { name: "notifications", color: ORANGE, bg: "#fef3c7" };
  };

  const unreadNotifications = notifications.filter((n) => !n.read_at);
  const earlierNotifications = notifications.filter((n) => !!n.read_at);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notifications.headerTitle")}</Text>
          <TouchableOpacity onPress={markAllRead} disabled={unreadCount === 0}>
            <Ionicons
              name="checkmark-done"
              size={24}
              color={unreadCount === 0 ? "#ccc" : PRIMARY_GREEN}
            />
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "All" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("All")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "All" && styles.filterTextActive,
              ]}
            >
              {t("notifications.filters.all")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "Price Alerts" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("Price Alerts")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "Price Alerts" && styles.filterTextActive,
              ]}
            >
              {t("notifications.filters.priceAlerts")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "Demand Updates" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("Demand Updates")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "Demand Updates" && styles.filterTextActive,
              ]}
            >
              {t("notifications.filters.demandUpdates")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, selectedFilter === "App Notifs" && styles.filterPillActive]}
            onPress={() => setSelectedFilter("App Notifs")}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === "App Notifs" && styles.filterTextActive,
              ]}
            >
              {t("notifications.filters.appNotifs")}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>{t("notifications.emptyText")}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {unreadNotifications.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t("notifications.sections.unread")}</Text>
                {unreadNotifications.map((notification) => {
                  const icon = iconForNotification(notification);
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={styles.notificationCard}
                      onPress={() => markAsReadAndNavigate(notification)}
                    >
                      <View style={styles.notificationLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
                          <Ionicons name={icon.name as any} size={20} color={icon.color} />
                        </View>
                        <View style={styles.unreadDot} />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationDescription}>
                          {notification.description}
                        </Text>
                        <Text style={styles.notificationTime}>{notification.time ? new Date(notification.time).toLocaleString() : ""}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {earlierNotifications.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t("notifications.sections.earlier")}</Text>
                {earlierNotifications.map((notification) => {
                  const icon = iconForNotification(notification);
                  return (
                    <TouchableOpacity
                      key={notification.id}
                      style={styles.notificationCard}
                      onPress={() => markAsReadAndNavigate(notification)}
                    >
                      <View style={styles.notificationLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: icon.bg }]}>
                          <Ionicons name={icon.name as any} size={20} color={icon.color} />
                        </View>
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <Text style={styles.notificationDescription}>
                          {notification.description}
                        </Text>
                        <Text style={styles.notificationTime}>{notification.time ? new Date(notification.time).toLocaleString() : ""}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            <View style={styles.allCaughtUpContainer}>
              <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
              <Text style={styles.allCaughtUpTitle}>{t("notifications.emptyTitle")}</Text>
              <Text style={styles.allCaughtUpText}>{t("notifications.emptyText")}</Text>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  filterScrollView: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: LIGHT_GRAY,
    minWidth: 80,
    alignItems: "center",
  },
  filterPillActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    letterSpacing: 0.5,
  },
  notificationCard: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  notificationLeft: {
    marginRight: 12,
    position: "relative",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_GREEN,
    position: "absolute",
    top: 0,
    left: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: "#999",
  },
  allCaughtUpContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  allCaughtUpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 12,
    marginBottom: 4,
  },
  allCaughtUpText: {
    fontSize: 13,
    color: "#999",
  },
});
