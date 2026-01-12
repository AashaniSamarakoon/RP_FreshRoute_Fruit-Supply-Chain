import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../../utils/supabaseClient";

const { width } = Dimensions.get("window");
const PRIMARY_GREEN = "#2f855a";

export default function VehicleScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data State
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState({ temp: 0, humidity: 0 });
  const [locationName, setLocationName] = useState("Locating...");
  const [stats, setStats] = useState({
    totalDistance: "12,450 km", // Mock for now
    jobsCompleted: 0,
    sensorStatus: "ACTIVE",
  });

  // --- 1. SETUP & DATA FETCHING ---
  useEffect(() => {
    setupDashboard();
  }, []);

  const setupDashboard = async () => {
    try {
      setLoading(true);
      await getLocation(); // Get GPS first

      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) return;
      const user = JSON.parse(userJson);

      // Get Vehicle ID
      const { data: vData } = await supabase
        .from("transporter")
        .select("vehicle_id")
        .eq("user_id", user.id)
        .single();

      if (vData?.vehicle_id) {
        setVehicleId(vData.vehicle_id);
        fetchVehicleData(vData.vehicle_id);
        fetchJobStats(user.id); // Get real job count
        subscribeToTelemetry(vData.vehicle_id);
      }
    } catch (e) {
      console.error("Vehicle setup failed", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchVehicleData = async (vId: string) => {
    const { data } = await supabase
      .from("vehicles")
      .select("current_temp, current_humidity")
      .eq("id", vId)
      .single();

    if (data) {
      setTelemetry({
        temp: data.current_temp || 0,
        humidity: data.current_humidity || 0,
      });
    }
  };

  const fetchJobStats = async (userId: string) => {
    // Count completed jobs for this transporter
    const { count } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("transporter_id", userId)
      .eq("status", "COMPLETED");

    setStats((prev) => ({ ...prev, jobsCompleted: count || 0 }));
  };

  // --- 2. REALTIME SUBSCRIPTION ---
  const subscribeToTelemetry = (vId: string) => {
    supabase
      .channel(`vehicle-dashboard:${vId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${vId}`,
        },
        (payload) => {
          setTelemetry({
            temp: payload.new.current_temp,
            humidity: payload.new.current_humidity,
          });
        }
      )
      .subscribe();
  };

  // --- 3. GPS LOCATION ---
  const getLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationName("Permission Denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      let address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address.length > 0) {
        const place = address[0];
        // e.g. "Colombo, Western Province"
        setLocationName(`Malabe , ${place.region || ""}`);
      }
    } catch (error) {
      setLocationName("Unknown Location");
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setupDashboard();
  };

  // --- 4. RENDER COMPONENTS ---
  const StatCard = ({ icon, label, value, color, fullWidth = false }: any) => (
    <View style={[styles.statCard, fullWidth && styles.statCardFull]}>
      <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={PRIMARY_GREEN} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Hero Image */}
      <View style={styles.heroSection}>
        <Image
          // CHANGE THIS LINE: Point to your local file
          // Adjust the path "../../../assets/..." based on where your file is
          source={require("../../../assets/images/truck.jpg")}
          style={styles.vehicleImage}
        />
        <View style={styles.imageOverlay}>
          <View style={styles.plateContainer}>
            <Text style={styles.plateText}>WP-ND-4582</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Live Conditions */}
        <Text style={styles.sectionTitle}>Live Conditions</Text>
        <View style={styles.telemetryGrid}>
          {/* Temperature Card */}
          <View style={[styles.telemetryCard, styles.tempCard]}>
            <View style={styles.rowBetween}>
              <Ionicons name="thermometer-outline" size={24} color="#fff" />
              <Text style={styles.telemetryLabelWhite}>TEMP</Text>
            </View>
            <Text style={styles.telemetryValueLarge}>
              {telemetry.temp.toFixed(1)}°C
            </Text>
            <Text style={styles.telemetrySub}>Target: 13.0°C</Text>
          </View>

          {/* Humidity Card */}
          <View style={[styles.telemetryCard, styles.humidCard]}>
            <View style={styles.rowBetween}>
              <Ionicons name="water-outline" size={24} color="#2d3748" />
              <Text style={styles.telemetryLabel}>HUMIDITY</Text>
            </View>
            <Text style={styles.telemetryValueDark}>
              {telemetry.humidity.toFixed(1)}%
            </Text>
            <Text style={styles.telemetrySubDark}>Optimal Range</Text>
          </View>
        </View>

        {/* Status Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          {/* Current Location (Full Width) */}
          <StatCard
            icon="location-sharp"
            label="Current Location"
            value={locationName}
            color="#e53e3e"
            fullWidth={true}
          />

          {/* Jobs Completed */}
          <StatCard
            icon="checkmark-circle"
            label="Jobs Done"
            value={stats.jobsCompleted}
            color={PRIMARY_GREEN}
          />

          {/* Total Distance */}
          <StatCard
            icon="map"
            label="Total Distance"
            value={stats.totalDistance}
            color="#3182ce"
          />

          {/* Sensor Status */}
          <StatCard
            icon="hardware-chip-outline"
            label="Sensor Status"
            value={stats.sensorStatus}
            color="#805ad5"
            fullWidth={true}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16, marginTop: -20 }, // Pull up over image

  // Hero Section
  heroSection: {
    height: 250,
    backgroundColor: "#eee",
    position: "relative",
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30, // Extra space for overlap
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  plateContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  plateText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },

  // Typography
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d3748",
    marginBottom: 12,
    marginTop: 8,
  },

  // Telemetry (Green/White Cards)
  telemetryGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  telemetryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    height: 120,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  tempCard: { backgroundColor: PRIMARY_GREEN },
  humidCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  telemetryLabelWhite: {
    color: "#ffffff90",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  telemetryLabel: {
    color: "#718096",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  telemetryValueLarge: { color: "#fff", fontSize: 32, fontWeight: "bold" },
  telemetryValueDark: { color: "#2d3748", fontSize: 32, fontWeight: "bold" },
  telemetrySub: { color: "#c6f6d5", fontSize: 12 },
  telemetrySubDark: { color: "#718096", fontSize: 12 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: (width - 40) / 2, // 2 columns
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#edf2f7",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardFull: {
    width: "100%",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statLabel: { fontSize: 12, color: "#718096", marginBottom: 2 },
  statValue: { fontSize: 16, fontWeight: "bold", color: "#2d3748" },
});
