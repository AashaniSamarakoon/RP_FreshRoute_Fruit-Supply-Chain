import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BACKEND_URL } from "../../config";

interface BuyerDashboardData {
  message?: string;
  openOrders?: unknown[];
  deliveriesInTransit?: unknown[];
}

export default function BuyerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<BuyerDashboardData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/buyer/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = await res.json();
        if (!res.ok) {
          return Alert.alert(
            "Error",
            body.message || "Failed to load dashboard"
          );
        }
        setData(body);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load dashboard");
      }
    };
    load();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buyer Dashboard</Text>
      <Text style={styles.subtitle}>{data?.message}</Text>

      <Text style={{ marginTop: 16 }}>
        Open orders: {data?.openOrders?.length ?? 0}
      </Text>

      <TouchableOpacity
        style={styles.complaintButton}
        onPress={() => router.push("/buyer/make-complaint")}
      >
        <Text style={styles.complaintButtonText}>Make a Complaint</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.complaintButton}
        onPress={() => router.push("/buyer/my-complaints")}
      >
        <Text style={styles.complaintButtonText}>My Complaints</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold" },
  subtitle: { marginTop: 8, fontSize: 16 },
  complaintButton: {
    marginTop: 16,
    backgroundColor: "#2f855a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  complaintButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  logoutButton: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#e53e3e",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  logoutText: { color: "#e53e3e", fontWeight: "bold" },
});
