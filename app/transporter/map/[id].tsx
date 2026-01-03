// app/transporter/map/[id].tsx
import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { BACKEND_URL } from "../../../config";

interface ManifestItem {
  sequence: number;
  type: "PICKUP" | "DROP";
  lat: number;
  lng: number;
  location?: string;
  order_id: string;
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
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/transporter/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setManifest(data.route_manifest || []);
        setRouteName(data.route_name);
        
        // Auto-zoom to fit markers after data loads
        setTimeout(() => {
            fitMapToMarkers(data.route_manifest);
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

    const coordinates = stops.map(stop => ({
      latitude: stop.lat,
      longitude: stop.lng,
    }));

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
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
        provider={PROVIDER_GOOGLE} // Use Google Maps on both iOS/Android if configured, else defaults to Apple Maps on iOS
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Render Markers */}
        {manifest.map((stop, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: stop.lat, longitude: stop.lng }}
            title={`${stop.sequence}. ${stop.type}`}
            description={`Stop #${stop.sequence}`}
            pinColor={stop.type === "PICKUP" ? "green" : "red"} 
          />
        ))}

        {/* Render Route Polyline */}
        {manifest.length > 1 && (
          <Polyline
            coordinates={manifest.map(s => ({ latitude: s.lat, longitude: s.lng }))}
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
            {manifest.reduce((acc, item) => acc + (item.distance_from_last_km || 0), 0).toFixed(1)} km
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
    alignItems: "center"
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