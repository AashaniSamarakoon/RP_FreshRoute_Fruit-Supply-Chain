import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

interface ManifestItem {
  sequence: number;
  type: "PICKUP" | "DROP";
  lat: number;
  lng: number;
  location?: string;
  order_id: string;
  distance_from_last_km?: number;
}

export default function JobMap() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  const [routeName, setRouteName] = useState("");

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      const data = await api.get(`/api/transporter/jobs/${id}`);

      const rawManifest = data.route_manifest || [];
      const cleanManifest = rawManifest
        .map((item: any) => ({
          ...item,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lng),
        }))
        .filter((item: any) => !isNaN(item.lat) && !isNaN(item.lng));

      setManifest(cleanManifest);
      setRouteName(data.route_name);

      // Auto-zoom to fit markers
      if (cleanManifest.length > 0) {
        setTimeout(() => {
          fitMapToMarkers(cleanManifest);
        }, 500);
      }
    } catch (error) {
      console.error("Failed to load map data", error);
    } finally {
      setLoading(false);
    }
  };

  const fitMapToMarkers = (stops: ManifestItem[]) => {
    if (!stops || stops.length === 0 || !mapRef.current) return;

    const coordinates = stops.map((stop) => ({
      latitude: stop.lat,
      longitude: stop.lng,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
      animated: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f855a" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading Route...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back Button Overlay */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Render Markers */}
        {manifest.map((stop, index) => (
          <Marker
            key={`${index}_${stop.sequence}`}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`${stop.sequence}. ${stop.type}`}
            description={`Stop #${stop.sequence}`}
            pinColor={stop.type === "PICKUP" ? "green" : "red"}
          />
        ))}

        {/* Render Route Polyline */}
        {manifest.length > 1 && (
          <Polyline
            coordinates={manifest.map((s) => ({
              latitude: s.lat,
              longitude: s.lng,
            }))}
            strokeColor="#2f855a" // FreshRoute Green
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Bottom Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.routeTitle}>{routeName}</Text>
        <Text style={styles.subtitle}>
          {manifest.length} Stops • Total Distance approx.{" "}
          {manifest
            .reduce((acc, item) => acc + (item.distance_from_last_km || 0), 0)
            .toFixed(1)}{" "}
          km
        </Text>

        <TouchableOpacity
          style={styles.recenterBtn}
          onPress={() => fitMapToMarkers(manifest)}
        >
          <Text style={styles.recenterText}>Recenter Route</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },

  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },

  infoCard: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    alignItems: "center",
  },
  routeTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4, marginBottom: 12 },

  recenterBtn: {
    backgroundColor: "#edf2f7",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  recenterText: { color: "#2d3748", fontWeight: "600", fontSize: 12 },
});
