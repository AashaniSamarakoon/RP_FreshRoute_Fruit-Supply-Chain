import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { supabase } from "../../../utils/supabaseClient";

const { width } = Dimensions.get("window");
const PRIMARY_GREEN = "#2f855a";

export default function VehicleScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data State
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [telemetry, setTelemetry] = useState({ temp: 0, humidity: 0 });

  // --- 1. SETUP & DATA FETCHING ---
  useEffect(() => {
    setupDashboard();
  }, []);

  const setupDashboard = async () => {
    try {
      setLoading(true);

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
      .select("*")
      .eq("id", vId)
      .single();

    if (data) {
      setVehicle(data);
      setTelemetry({
        temp: data.current_temp || 0,
        humidity: data.current_humidity || 0,
      });
    }
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
          // Update local state with live DB changes
          setVehicle((prev: any) => ({ ...prev, ...payload.new }));
          setTelemetry({
            temp: payload.new.current_temp,
            humidity: payload.new.current_humidity,
          });
        },
      )
      .subscribe();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setupDashboard();
  };

  // --- 3. DYNAMIC LOGIC ---
  const isSensorActive = () => {
    if (!vehicle?.last_telemetry_at) return false;

    // 1. Format the database string to standard ISO 8601 UTC format
    // Changes "2026-03-08 06:10:13.8" -> "2026-03-08T06:10:13.8Z"
    let timeString = vehicle.last_telemetry_at;
    if (!timeString.includes("T")) timeString = timeString.replace(" ", "T");
    if (!timeString.endsWith("Z")) timeString += "Z";

    // 2. Calculate the difference
    const lastTelemetry = new Date(timeString).getTime();
    const now = new Date().getTime();

    // diff in milliseconds / (1000ms * 60s) = minutes
    const diffMinutes = (now - lastTelemetry) / (1000 * 60);

    return diffMinutes <= 10;
  };

  const sensorActive = isSensorActive();
  const sensorStatusText = sensorActive ? "ACTIVE" : "OFFLINE";
  const sensorStatusColor = sensorActive ? PRIMARY_GREEN : "#e53e3e";

  // --- 4. RENDER COMPONENTS ---
  const StatCard = ({ icon, label, value, color, fullWidth = false }: any) => (
    <View style={[styles.statCard, fullWidth && styles.statCardFull]}>
      <View style={[styles.iconCircle, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text
          style={[
            styles.statValue,
            { color: color === "#e53e3e" ? color : "#2d3748" },
          ]}
        >
          {value}
        </Text>
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
          source={require("../../../assets/images/truck.jpg")}
          style={styles.vehicleImage}
        />
        <View style={styles.imageOverlay}>
          <View style={styles.plateContainer}>
            <Text style={styles.plateText}>
              {vehicle?.vehicle_license_plate || "UNASSIGNED"}
            </Text>
          </View>
          <Text style={styles.vehicleType}>
            {vehicle?.vehicle_type || "Truck"} •{" "}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Live Conditions */}
        <Text style={styles.sectionTitle}>Live Telemetry</Text>
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
          {/* Sensor Status */}
          <StatCard
            icon="hardware-chip-outline"
            label="Sensor Connectivity"
            value={sensorStatusText}
            color={sensorStatusColor}
            fullWidth={true}
          />

          {/* Mini Map Card replacing the text location */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Ionicons name="location-sharp" size={18} color="#e53e3e" />
              <Text style={styles.mapLabel}>Current Location</Text>
            </View>

            <View style={styles.mapContainer}>
              {vehicle?.current_lat && vehicle?.current_lng ? (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: vehicle.current_lat,
                    longitude: vehicle.current_lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: vehicle.current_lat,
                      longitude: vehicle.current_lng,
                    }}
                  >
                    <View style={styles.customMarker}>
                      <Ionicons name="car" size={18} color="#fff" />
                    </View>
                  </Marker>
                </MapView>
              ) : (
                <View style={styles.noMapContainer}>
                  <Ionicons name="map-outline" size={32} color="#cbd5e0" />
                  <Text style={styles.noMapText}>Location Unavailable</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7fafc" },
  center: { justifyContent: "center", alignItems: "center" },
  content: { padding: 16, marginTop: -20 },

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
    paddingBottom: 35,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  plateContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    marginBottom: 4,
  },
  plateText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  vehicleType: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 2,
  },

  // Typography
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#a0aec0",
    marginBottom: 12,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  // Telemetry
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
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  statCardFull: { width: "100%" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  statLabel: {
    fontSize: 12,
    color: "#718096",
    marginBottom: 2,
    fontWeight: "600",
  },
  statValue: { fontSize: 18, fontWeight: "bold" },

  // Map Card
  mapCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  mapLabel: {
    fontSize: 14,
    color: "#2d3748",
    fontWeight: "700",
    marginLeft: 6,
  },
  mapContainer: {
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#edf2f7",
  },
  map: { width: "100%", height: "100%" },
  customMarker: {
    backgroundColor: PRIMARY_GREEN,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  noMapContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noMapText: {
    marginTop: 8,
    color: "#a0aec0",
    fontSize: 14,
    fontWeight: "500",
  },
});
