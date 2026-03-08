// components/Header.tsx
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslationContext } from "../../../context/TranslationContext";
import {
  isTrackingActive,
  startLocationTracking,
  stopLocationTracking,
} from "../../../utils/locationTask";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

interface HeaderProps {
  onSearch?: (text: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslationContext();

  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState("Transporter");
  const [isTracking, setIsTracking] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  // Dynamic Greeting Logic
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  useEffect(() => {
    let alertSubscription: any;

    const setupHeader = async () => {
      // 1. Check Tracking Status
      const isCurrentlyActive = await isTrackingActive();
      const wantsTracking = await AsyncStorage.getItem("auto_track_enabled");

      if (isCurrentlyActive) {
        setIsTracking(true);
      } else if (wantsTracking === "true") {
        const started = await startLocationTracking();
        setIsTracking(started);
      } else {
        setIsTracking(false);
      }

      // 2. Load User Data
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const firstName = user.user_metadata?.first_name;
      const lastName = user.user_metadata?.last_name;

      if (firstName) {
        setUserName(`${firstName} ${lastName || ""}`.trim());
      }

      // 3. Fetch Assigned Vehicle and Unread Alerts Count
      try {
        const { data: tData } = await supabase
          .from("transporter")
          .select("vehicle_id")
          .eq("user_id", user.id)
          .single();

        if (tData?.vehicle_id) {
          // Count unread alerts for this vehicle
          const { count } = await supabase
            .from("alerts")
            .select("*", { count: "exact", head: true })
            .eq("vehicle_id", tData.vehicle_id)
            .eq("is_read", false);

          setUnreadCount(count || 0);

          // 4. Setup Realtime Subscription for new alerts
          alertSubscription = supabase
            .channel(`public:alerts:${tData.vehicle_id}`)
            .on(
              "postgres_changes",
              {
                event: "INSERT",
                schema: "public",
                table: "alerts",
                filter: `vehicle_id=eq.${tData.vehicle_id}`,
              },
              (payload) => {
                const newAlert = payload.new;
                console.log("Realtime Alert Received:", newAlert);

                // Increment badge counter
                setUnreadCount((prev) => prev + 1);

                // Show Native Popup
                // Alert.alert(
                //   "⚠️ SHIPMENT ALERT",
                //   newAlert.message ||
                //     "A temperature issue was detected with your shipment.",
                //   [{ text: "Close", style: "cancel" }],
                // );
              },
            )
            .subscribe();
        }
      } catch (err) {
        console.error("[Header] Failed to fetch alerts", err);
      }
    };

    setupHeader();

    // Cleanup subscription on unmount
    return () => {
      if (alertSubscription) {
        supabase.removeChannel(alertSubscription);
      }
    };
  }, [router]);

  const toggleTracking = async () => {
    if (isTracking) {
      await stopLocationTracking();
      await AsyncStorage.setItem("auto_track_enabled", "false");
      setIsTracking(false);
    } else {
      const started = await startLocationTracking();
      if (started) {
        await AsyncStorage.setItem("auto_track_enabled", "true");
        setIsTracking(true);
      }
    }
  };

  const handleNotificationPress = () => {
    // Optimistically clear badge when clicking to view notifications
    setUnreadCount(0);
    router.push("/transporter/notifications" as any);
  };

  return (
    <>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🍃 FreshRoute</Text>
          <Text style={styles.greeting}>
            {/* If translation exists use it, otherwise fallback to dynamic English greeting */}
            {t
              ? t("farmer.greeting", { name: userName }) // Update translation key if needed
              : `${greeting}, ${userName}`}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          {/* Location Tracking Toggle */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: isTracking ? "#e6fffa" : "transparent" },
            ]}
            onPress={toggleTracking}
          >
            <Ionicons
              name={isTracking ? "location" : "location-outline"}
              size={24}
              color={isTracking ? PRIMARY_GREEN : "#666"}
            />
            {isTracking && <View style={styles.trackingDot} />}
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            onPress={handleNotificationPress}
            style={[styles.iconButton, { marginLeft: 8 }]}
          >
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                {/* Display actual count if under 100, otherwise 99+ */}
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          placeholderTextColor="#999"
          onChangeText={onSearch}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    color: "#000",
    textTransform: "capitalize",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    position: "relative",
    padding: 8,
    borderRadius: 50,
  },
  trackingDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_GREEN,
    borderWidth: 1,
    borderColor: "#fff",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
});
