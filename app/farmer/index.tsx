import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BACKEND_URL } from "../../config";

interface FarmerDashboardData {
  message?: string;
  upcomingPickups?: unknown[];
  stats?: { totalShipments: number; spoilageReduced: number };
}

export default function FarmerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<FarmerDashboardData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/farmer/dashboard`, {
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
      <Text style={styles.title}>Farmer Dashboard</Text>
      <Text style={styles.subtitle}>{data?.message}</Text>

      <Text style={{ marginTop: 16 }}>
        Upcoming pickups: {data?.upcomingPickups?.length ?? 0}
      </Text>

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
