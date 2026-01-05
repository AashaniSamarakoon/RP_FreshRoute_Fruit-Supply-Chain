import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../config";
import { useTranslation } from "../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const BLUE = "#3b82f6";
const ORANGE = "#f59e0b";
const RED = "#ef4444";

interface NotificationDetail {
  id: string | number;
  title: string;
  body: string;
  created_at?: string;
  read_at?: string | null;
  category?: string;
  severity?: string;
  action_button_text?: string;
  action_url?: string;
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const notificationId = (params.id as string) || "";
  const initialFromParams: NotificationDetail | null = notificationId
    ? {
        id: notificationId,
        title: (params.title as string) || "",
        body: (params.body as string) || "",
        created_at: (params.created_at as string) || undefined,
        category: (params.category as string) || undefined,
        severity: (params.severity as string) || undefined,
      }
    : null;
  const { t } = useTranslation();

  const [notification, setNotification] = useState<NotificationDetail | null>(initialFromParams);
  const [loading, setLoading] = useState(!initialFromParams);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!notificationId) {
      setError("Missing notification id");
      setLoading(false);
      return;
    }
    const loadDetail = async () => {
      // If we already have data from params, keep showing it while fetching.
      if (!notification) {
        setLoading(true);
      }
      setError(null);
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/farmer/notifications/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Safely handle non-JSON responses from the server (e.g., HTML error pages).
        const raw = await res.text();
        let data: any = null;
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch (parseErr) {
          setError(`Failed to parse response (status ${res.status})`);
          console.log("[NOTIFICATION-DETAIL] parse error", parseErr, raw?.slice(0, 200));
          if (!notification) {
            setNotification(null);
          }
          setLoading(false);
          return;
        }

        if (!res.ok) {
          setError(data?.message || `Failed to load notification (status ${res.status})`);
          if (!notification) {
            setNotification(null);
          }
          setLoading(false);
          return;
        }

        const n = data.notification || data;
        setNotification({
          id: n.id || n._id || notificationId,
          title: n.title || initialFromParams?.title || "",
          body: n.body || n.description || initialFromParams?.body || "",
          created_at: n.created_at || initialFromParams?.created_at,
          read_at: n.read_at,
          category: n.category || initialFromParams?.category,
          severity: n.severity || initialFromParams?.severity,
          action_button_text: n.action_button_text || n.actionButtonText,
          action_url: n.action_url || n.actionButtonUrl,
        });

        // Ensure it is marked as read if still unread.
        if (!n.read_at) {
          try {
            await fetch(`${BACKEND_URL}/api/farmer/notifications/${n.id || n._id}/read`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            });
          } catch (markErr) {
            console.log("[NOTIFICATION-DETAIL] mark read failed", markErr);
          }
        }
      } catch (err) {
        console.error("[NOTIFICATION-DETAIL] Unexpected error", err);
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    // If we already have body/title from params, still fetch to confirm but keep showing content.
    loadDetail();
  }, [notificationId, notification]);

  const iconMeta = useMemo(() => {
    if (!notification) return { name: "notifications", color: PRIMARY_GREEN, bg: LIGHT_GREEN };
    if (notification.severity === "high") return { name: "alert-circle", color: RED, bg: "#fee2e2" };
    if (notification.category?.toLowerCase().includes("price")) return { name: "trending-up", color: BLUE, bg: "#dbeafe" };
    if (notification.category?.toLowerCase().includes("demand")) return { name: "pulse", color: PRIMARY_GREEN, bg: LIGHT_GREEN };
    return { name: "notifications", color: ORANGE, bg: "#fef3c7" };
  }, [notification]);

  const onActionPress = () => {
    if (!notification?.action_url) return;
    Linking.openURL(notification.action_url).catch(() => {
      Alert.alert("Unable to open link");
    });
  };

  const formattedTime = notification?.created_at
    ? new Date(notification.created_at).toLocaleString()
    : notification?.read_at
      ? new Date(notification.read_at).toLocaleString()
      : "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("notificationDetail.headerTitle")}</Text>
          <TouchableOpacity>
            <Ionicons name="share-social" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>{t("notifications.loading" as any) || "Loading..."}</Text>
          </View>
        ) : error && !notification ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle" size={40} color={RED} />
            <Text style={styles.loadingText}>{error}</Text>
          </View>
        ) : !notification ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="notifications-off-outline" size={40} color="#ccc" />
            <Text style={styles.loadingText}>{t("notifications.emptyText")}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Notification Icon */}
            <View style={styles.iconContainer}>
              <View style={[styles.largeIconCircle, { backgroundColor: iconMeta.bg }]}>
                <Ionicons name={iconMeta.name as any} size={40} color={iconMeta.color} />
              </View>
            </View>

            {/* Notification Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.notificationTitle}>{notification.title}</Text>
              <Text style={styles.notificationSubtitle}>{formattedTime}</Text>
            </View>

            {/* Notification Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>{notification.body}</Text>
            </View>

            {/* Action Button */}
            {notification.action_button_text && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onActionPress}
                disabled={!notification.action_url}
              >
                <Text style={styles.actionButtonText}>{notification.action_button_text}</Text>
              </TouchableOpacity>
            )}

            {/* Additional Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#999" />
                <Text style={styles.infoText}>
                  {t("notificationDetail.received", { time: formattedTime || "" })}
                </Text>
              </View>
              {notification.category && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag" size={16} color="#999" />
                  <Text style={styles.infoText}>{notification.category}</Text>
                </View>
              )}
              {notification.severity && (
                <View style={styles.infoRow}>
                  <Ionicons name="warning" size={16} color="#999" />
                  <Text style={styles.infoText}>{notification.severity}</Text>
                </View>
              )}
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
    textAlign: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  largeIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  notificationSubtitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    textAlign: "left",
  },
  actionButton: {
    marginHorizontal: 24,
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 24,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f5f5f5",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
  },
});
