import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const YELLOW = "#fbbf24";
const ORANGE = "#f59e0b";
const BLUE = "#3b82f6";

interface Notification {
  id: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  category: "unread" | "earlier";
}

const mockNotifications: Notification[] = [
  {
    id: 1,
    icon: "alert-circle",
    iconColor: YELLOW,
    iconBg: "#fef3c7",
    title: "Price Alert: Apple prices may rise 8%",
    description: "The forecast shows rising apple prices. Consider holding apples for next 3 days to maximize profit. View details.",
    time: "Just now",
    category: "unread",
  },
  {
    id: 2,
    icon: "trending-up",
    iconColor: BLUE,
    iconBg: "#dbeafe",
    title: "High demand for strawberries",
    description: "New forecast shows high demand for strawberries in economic centers in your region this weekend. View forecast...",
    time: "1h ago",
    category: "unread",
  },
  {
    id: 3,
    icon: "leaf",
    iconColor: PRIMARY_GREEN,
    iconBg: LIGHT_GREEN,
    title: "Tip: Delay orange harvest",
    description: "Consider delaying orange harvest by 3 days for a potential 5% price increase. View forecast.",
    time: "3h ago",
    category: "earlier",
  },
  {
    id: 4,
    icon: "refresh",
    iconColor: "#9333ea",
    iconBg: "#f3e8ff",
    title: "FreshRoute AI model updated",
    description: "Our prediction model has been updated for improved accuracy in all regions.",
    time: "1d ago",
    category: "earlier",
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Price Alerts" | "Demand Updates" | "App Notifs">("All");

  const unreadNotifications = mockNotifications.filter(n => n.category === "unread");
  const earlierNotifications = mockNotifications.filter(n => n.category === "earlier");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity>
            <Ionicons name="checkmark-done" size={24} color={PRIMARY_GREEN} />
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
              All
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
              Price Alerts
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
              Demand Updates
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
              App Notifs
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Unread Section */}
          {unreadNotifications.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>UNREAD</Text>
              {unreadNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationCard}
                  onPress={() => router.push(`/farmer/notification-detail?id=${notification.id}`)}
                >
                  <View style={styles.notificationLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: notification.iconBg }]}>
                      <Ionicons name={notification.icon as any} size={20} color={notification.iconColor} />
                    </View>
                    <View style={styles.unreadDot} />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationDescription}>
                      {notification.description}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Earlier Section */}
          {earlierNotifications.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>EARLIER</Text>
              {earlierNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationCard}
                  onPress={() => router.push(`/farmer/notification-detail?id=${notification.id}`)}
                >
                  <View style={styles.notificationLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: notification.iconBg }]}>
                      <Ionicons name={notification.icon as any} size={20} color={notification.iconColor} />
                    </View>
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationDescription}>
                      {notification.description}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* All Caught Up */}
          <View style={styles.allCaughtUpContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
            <Text style={styles.allCaughtUpTitle}>All caught up!</Text>
            <Text style={styles.allCaughtUpText}>You have no older notifications</Text>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
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
