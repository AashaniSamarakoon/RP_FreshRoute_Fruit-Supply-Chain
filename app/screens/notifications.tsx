import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../components/Header";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";

const notifications = [
  {
    id: "2",
    icon: "alert-circle",
    iconColor: "#f59e0b",
    iconBg: "#fef3c7",
    title: "Price Alert: Apple prices may rise 8%",
    subtitle: "Just now",
  },
  {
    id: "1",
    icon: "trending-up",
    iconColor: "#10b981",
    iconBg: LIGHT_GREEN,
    title: "Price Alert: Avocados are Trending Up",
    subtitle: "16 minutes ago",
  },
  {
    id: "3",
    icon: "trending-up",
    iconColor: "#3b82f6",
    iconBg: "#dbeafe",
    title: "High demand for strawberries",
    subtitle: "1h ago",
  },
  {
    id: "4",
    icon: "leaf",
    iconColor: PRIMARY_GREEN,
    iconBg: LIGHT_GREEN,
    title: "Tip: Delay orange harvest",
    subtitle: "3h ago",
  },
];

export default function NotificationsScreen() {
  const router = useRouter();

  const renderItem = ({ item }: { item: (typeof notifications)[0] }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => router.push(`/screens/notification-detail?id=${item.id}`)}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon as any} size={24} color={item.iconColor} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationSubtitle}>{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title="Notifications" onBack={() => router.back()} />
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  notificationSubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
});
