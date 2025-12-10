import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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

interface NotificationDetail {
  id: number;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  description: string;
  detailedDescription: string;
  time: string;
  actionButtonText: string;
  actionButtonUrl?: string;
}

const notificationDetails: { [key: string]: NotificationDetail } = {
  "1": {
    id: 1,
    icon: "trending-up",
    iconColor: "#10b981",
    iconBg: LIGHT_GREEN,
    title: "Price Alert: Avocados are Trending Up",
    subtitle: "16 minutes ago",
    description: "FreshRoute AI predicts a 15% increase in avocado prices over the next 48 hours due to a surge in regional demand.",
    detailedDescription: "FreshRoute AI predicts a 15% increase in avocado prices over the next 48 hours due to a surge in regional demand. Consider adjusting your inventory levels.",
    time: "16 minutes ago",
    actionButtonText: "View Avocado Demand Report",
  },
  "2": {
    id: 2,
    icon: "alert-circle",
    iconColor: "#f59e0b",
    iconBg: "#fef3c7",
    title: "Price Alert: Apple prices may rise 8%",
    subtitle: "Just now",
    description: "The forecast predicts a significant price increase. Consider holding apples for next 3 days to maximize profit.",
    detailedDescription: "The forecast predicts a significant price increase in apples. Consider holding apples for the next 3 days to maximize profit potential.",
    time: "Just now",
    actionButtonText: "View Apple Price Forecast",
  },
  "3": {
    id: 3,
    icon: "trending-up",
    iconColor: "#3b82f6",
    iconBg: "#dbeafe",
    title: "High demand for strawberries",
    subtitle: "1h ago",
    description: "New forecast shows high demand for strawberries in economic centers in your region this weekend.",
    detailedDescription: "New forecast shows high demand for strawberries in economic centers in your region this weekend. Prepare your inventory accordingly.",
    time: "1h ago",
    actionButtonText: "View Forecast Details",
  },
  "4": {
    id: 4,
    icon: "leaf",
    iconColor: PRIMARY_GREEN,
    iconBg: LIGHT_GREEN,
    title: "Tip: Delay orange harvest",
    subtitle: "3h ago",
    description: "Consider delaying orange harvest by 3 days for a potential 5% price increase.",
    detailedDescription: "Consider delaying orange harvest by 3 days for a potential 5% price increase based on upcoming market trends.",
    time: "3h ago",
    actionButtonText: "View Orange Market Trends",
  },
};

export default function NotificationDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const notificationId = params.id as string || "1";
  
  const notification = notificationDetails[notificationId] || notificationDetails["1"];

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
            <Ionicons name="share-social" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Notification Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.largeIconCircle, { backgroundColor: notification.iconBg }]}>
              <Ionicons name={notification.icon as any} size={40} color={notification.iconColor} />
            </View>
          </View>

          {/* Notification Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationSubtitle}>{notification.subtitle}</Text>
          </View>

          {/* Notification Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>{notification.detailedDescription}</Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {}}
          >
            <Text style={styles.actionButtonText}>{notification.actionButtonText}</Text>
          </TouchableOpacity>

          {/* Additional Info */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color="#999" />
              <Text style={styles.infoText}>Received {notification.time}</Text>
            </View>
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
  scrollView: {
    flex: 1,
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
