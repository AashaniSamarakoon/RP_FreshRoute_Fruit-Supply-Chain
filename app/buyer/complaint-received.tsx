import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ComplaintReceived() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string; fromAdd?: string }>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const fromAdd = params.fromAdd === "1";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        const role = (user.role ?? user.user_metadata?.role ?? "").toString().toLowerCase();
        if (role !== "buyer") {
          router.replace("/buyer");
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleViewComplaints = () => {
    // Leave empty – implement complaints list page later
  };

  const handleViewOrders = () => {
    router.replace("/buyer/(tabs)/orders" as any);
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Header title="Complaint Received" showBackButton />
        <View style={styles.centerContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Header title="Complaint Received" showBackButton />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={BuyerColors.primaryGreen} />
        </View>

        <Text style={styles.title}>Complaint added successfully</Text>
        <Text style={styles.subtitle}>
          An admin will review and get back to you.
        </Text>

        {!fromAdd && params.orderId && (
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Order ID:</Text>
              <Text style={styles.infoValue}>{params.orderId}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={handleViewComplaints}>
          <Text style={styles.actionButtonText}>View complaints</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]} onPress={handleViewOrders}>
          <Text style={styles.actionButtonTextPrimary}>View orders</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1 },
  content: {
    padding: 24,
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
    color: "#11181C",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    padding: 20,
    borderRadius: 10,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoLabel: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
  infoValue: { fontSize: 16, fontWeight: "600", color: "#11181C", flex: 1, textAlign: "right" },
  actionButton: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 12,
  },
  actionButtonPrimary: {
    backgroundColor: BuyerColors.primaryGreen,
  },
  actionButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  actionButtonTextPrimary: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
