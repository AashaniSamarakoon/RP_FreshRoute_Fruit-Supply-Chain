import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";

function CustomBottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<"home" | "forecast" | "orders" | "market" | "profile">("home");

  useEffect(() => {
    // Determine active tab based on current route
    if (pathname === "/farmer" || pathname === "/farmer/(tabs)") {
      setActiveTab("home");
    } else if (pathname.includes("forecast")) {
      setActiveTab("forecast");
    } else if (pathname.includes("orders")) {
      setActiveTab("orders");
    } else if (pathname.includes("live-market")) {
      setActiveTab("market");
    } else if (pathname.includes("profile")) {
      setActiveTab("profile");
    }
  }, [pathname]);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          setActiveTab("home");
          router.push("/farmer");
        }}
      >
        <Ionicons
          name={activeTab === "home" ? "home" : "home-outline"}
          size={24}
          color={activeTab === "home" ? PRIMARY_GREEN : "#999"}
        />
        <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          setActiveTab("forecast");
          router.push("/farmer/forecast");
        }}
      >
        <Ionicons
          name={activeTab === "forecast" ? "calendar" : "calendar-outline"}
          size={24}
          color={activeTab === "forecast" ? PRIMARY_GREEN : "#999"}
        />
        <Text style={[styles.navLabel, activeTab === "forecast" && styles.navLabelActive]}>
          Forecast
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          setActiveTab("orders");
          router.push("/farmer/orders");
        }}
      >
        <Ionicons
          name={activeTab === "orders" ? "receipt" : "receipt-outline"}
          size={24}
          color={activeTab === "orders" ? PRIMARY_GREEN : "#999"}
        />
        <Text style={[styles.navLabel, activeTab === "orders" && styles.navLabelActive]}>
          Orders
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          setActiveTab("market");
          router.push("/farmer/live-market");
        }}
      >
        <Ionicons
          name={activeTab === "market" ? "trending-up" : "trending-up-outline"}
          size={24}
          color={activeTab === "market" ? PRIMARY_GREEN : "#999"}
        />
        <Text style={[styles.navLabel, activeTab === "market" && styles.navLabelActive]}>
          Market
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          setActiveTab("profile");
          router.push("/farmer/profile");
        }}
      >
        <Ionicons
          name={activeTab === "profile" ? "person" : "person-outline"}
          size={24}
          color={activeTab === "profile" ? PRIMARY_GREEN : "#999"}
        />
        <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FarmerLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <CustomBottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 8,
    paddingBottom: 28,
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  navLabelActive: {
    color: PRIMARY_GREEN,
    fontWeight: "600",
  },
});