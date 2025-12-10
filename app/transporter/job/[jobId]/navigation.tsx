// app/transporter/job/[jobId]/navigation.tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Job, MOCK_JOBS } from "../../../../data/mockJobs"; // 👈 adjust path

const ACCENT = "#16a34a";

type Stop = {
  key: string;
  type: "pickup" | "drop";
  label: string;
  latitude: number;
  longitude: number;
  order: number;
};

export default function JobNavigation() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const id = Array.isArray(jobId) ? jobId[0] : jobId;

  const job: Job | undefined = useMemo(
    () => MOCK_JOBS.find((j) => j.id === id),
    [id]
  );

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Job not found</Text>
      </View>
    );
  }

  const sortedOrders = [...job.orders].sort(
    (a, b) => a.pickupOrder - b.pickupOrder
  );

  const pickupStops: Stop[] = sortedOrders.map((o) => ({
    key: `pickup-${o.id}`,
    type: "pickup",
    label: `Pickup ${o.pickupOrder} - ${o.farmer.name}`,
    latitude: o.farmer.location.latitude,
    longitude: o.farmer.location.longitude,
    order: o.pickupOrder,
  }));

  const dropStop: Stop = {
    key: "drop",
    type: "drop",
    label: `Drop - ${job.buyer.name}`,
    latitude: job.buyer.location.latitude,
    longitude: job.buyer.location.longitude,
    order: pickupStops.length + 1,
  };

  const stops: Stop[] = [...pickupStops, dropStop];

  const first = stops[0];
  const initialRegion = {
    latitude: first.latitude,
    longitude: first.longitude,
    latitudeDelta: 0.7,
    longitudeDelta: 0.7,
  };

  const openInGoogleMaps = async () => {
    if (stops.length < 2) return;
    const origin = `${stops[0].latitude},${stops[0].longitude}`;
    const destination = `${stops[stops.length - 1].latitude},${
      stops[stops.length - 1].longitude
    }`;
    const waypoints = stops
      .slice(1, -1)
      .map((s) => `${s.latitude},${s.longitude}`)
      .join("|");

    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    if (waypoints) {
      url += `&waypoints=${encodeURIComponent(waypoints)}`;
    }
    url += "&travelmode=driving";

    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        "Cannot open maps",
        "Google Maps or browser is not available on this device."
      );
      return;
    }
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navigation</Text>
      <Text style={styles.subtitle}>{job.id}</Text>

      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
        >
          <Polyline
            coordinates={stops.map((s) => ({
              latitude: s.latitude,
              longitude: s.longitude,
            }))}
            strokeWidth={4}
            strokeColor={ACCENT}
          />
          {stops.map((stop) => (
            <Marker
              key={stop.key}
              coordinate={{
                latitude: stop.latitude,
                longitude: stop.longitude,
              }}
              title={stop.label}
              description={
                stop.type === "pickup"
                  ? `Pickup ${stop.order}`
                  : "Drop location"
              }
              pinColor={stop.type === "pickup" ? ACCENT : "#ef4444"}
            />
          ))}
        </MapView>
      </View>

      <View style={styles.legend}>
        {pickupStops.map((s) => (
          <Text key={s.key} style={styles.legendItem}>
            • Pickup {s.order}: {s.label.replace(`Pickup ${s.order} - `, "")}
          </Text>
        ))}
        <Text style={styles.legendItem}>• Drop: {job.buyer.name}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Back to job</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={openInGoogleMaps}
        >
          <Text style={styles.primaryButtonText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const CARD_BG = "#f9fafb";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  mapContainer: {
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: CARD_BG,
    height: 320,
  },
  map: {
    flex: 1,
  },
  legend: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: CARD_BG,
  },
  legendItem: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 2,
  },
  buttonRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: ACCENT,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ACCENT,
  },
  secondaryButtonText: {
    color: ACCENT,
    fontWeight: "600",
    fontSize: 14,
  },
});
