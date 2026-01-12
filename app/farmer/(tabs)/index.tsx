import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslationContext } from "../../../context/TranslationContext";
import { FeatureGrid, FruitDemandCards, Header } from "../components";

interface FarmerDashboardData {
  message?: string;
  upcomingPickups?: unknown[];
  stats?: { totalShipments: number; spoilageReduced: number };
}

interface UserData {
  name?: string;
  email?: string;
  role?: string;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslationContext();
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const load = async () => {
      console.log("[DASHBOARD] Loading dashboard...");
      try {
        const userJson = await AsyncStorage.getItem("user");
        console.log("[DASHBOARD] User from storage:", userJson);
        if (userJson) {
          setUser(JSON.parse(userJson));
        }

        const token = await AsyncStorage.getItem("token");
        console.log("[DASHBOARD] Token from storage:", token?.substring(0, 20) + "...");
        if (!token) {
          console.log("[DASHBOARD] No token found, skipping API call");
          return;
        }

        console.log("[DASHBOARD] Fetching:", `${BACKEND_URL}/api/farmer/dashboard`);
        const res = await fetch(`${BACKEND_URL}/api/farmer/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("[DASHBOARD] Response status:", res.status);

        const body = await res.json();
        console.log("[DASHBOARD] Response body:", body);
        if (!res.ok) {
          console.log("[DASHBOARD] Error response:", body.message);
          return Alert.alert(
            t("common.error"),
            body.message || t("farmer.errors.failed")
          );
        }
        console.log("[DASHBOARD] Data loaded successfully");
        setData(body);
      } catch (err) {
        console.error("[DASHBOARD] Error:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        Alert.alert(t("common.error"), t("farmer.errors.generic") + ": " + errorMsg);
      }
    };
    load();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  const userName = user?.name?.split(" ")[0] || "User";

  const handleSearch = (text: string) => {
    // Handle search functionality
    console.log("Search:", text);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Component with Search Bar */}
      <Header
        userName={userName}
        onSearch={handleSearch}
      />

      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Fruit Demand Cards Component */}
        <FruitDemandCards />

        {/* Feature Grid Component */}
        <FeatureGrid />
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 10,
  },
});