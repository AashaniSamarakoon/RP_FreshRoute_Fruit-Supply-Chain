// app/transporter/route.tsx
import polyline from "@mapbox/polyline"; // npm i @mapbox/polyline
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView from "react-native-maps";
// If you prefer, implement your own polyline decoder

type LatLng = { latitude: number; longitude: number };
type Stop = {
  id: string;
  type: "pickup" | "drop";
  address: string;
  coords: LatLng;
  collected?: boolean;
};

const JOBS: Record<string, { id: string; title: string; stops: Stop[] }> = {
  "job-1": {
    id: "job-1",
    title: "Order #1001 - Fruits",
    stops: [
      {
        id: "p1",
        type: "pickup",
        address: "Farm A",
        coords: { latitude: 6.9271, longitude: 79.8612 },
        collected: true,
      },
      // other stops
    ],
  },
  "job-2": {
    id: "job-2",
    title: "Order #1002 - Vegetables",
    stops: [
      {
        id: "p1",
        type: "pickup",
        address: "Farm C",
        coords: { latitude: 6.93, longitude: 79.855 },
        collected: false,
      },
      // other stops
    ],
  },
};

// Optional: put your Google Directions API key here (or from .env)
const GOOGLE_DIRECTIONS_API_KEY = ""; // <-- add your key if you want real roads

export default function RouteScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const jobId = (params.jobId as string) || "job-1";
  const job = JOBS[jobId];

  const [location, setLocation] = useState<LatLng | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  useEffect(() => {
    buildRoute();
  }, [location]);

  const buildRoute = async () => {
    setLoadingRoute(true);

    // Construct waypoints: start at current location if available, then pickups, then drop
    const coordinates = [];
    if (location) coordinates.push(location);
    job.stops.forEach((s: Stop) => coordinates.push(s.coords));

    if (GOOGLE_DIRECTIONS_API_KEY) {
      // Build string: origin=lat,lng&destination=lat,lng&waypoints=via:lat,lng|via:lat,lng
      try {
        const origin = `${coordinates[0].latitude},${coordinates[0].longitude}`;
        const destination = `${coordinates[coordinates.length - 1].latitude},${
          coordinates[coordinates.length - 1].longitude
        }`;
        const waypoints = coordinates
          .slice(1, coordinates.length - 1)
          .map((c) => `${c.latitude},${c.longitude}`)
          .join("|");
        const wpParam = waypoints
          ? `&waypoints=${encodeURIComponent(waypoints)}`
          : "";
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${wpParam}&key=${GOOGLE_DIRECTIONS_API_KEY}&mode=driving`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes && json.routes.length > 0) {
          // take the first route and decode polyline
          const poly = json.routes[0].overview_polyline.points;
          const decoded = polyline
            .decode(poly)
            .map(([lat, lng]: [number, number]) => ({
              latitude: lat,
              longitude: lng,
            }));
          setRouteCoords(decoded);
          setLoadingRoute(false);
          // fit map
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(decoded, {
              edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
              animated: true,
            });
          }, 300);
          return;
        }
      } catch (err) {
        console.warn("Directions error:", err);
      }
    }

    // Fallback: straight line segments connecting points
    const fallback = coordinates;
    setRouteCoords(fallback);
    setLoadingRoute(false);
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(fallback, {
        edgePadding: { top: 80, right: 40, bottom: 80, left: 40 },
        animated: true,
      });
    }, 300);
  };

  if (!job) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Job not found: {jobId}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {!location && (
        <View style={styles.loading}>
          <ActivityIndicator />
          <Text>Getting current location...</Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        showsUserLocation={true}
        initialRegion={{
          latitude: location?.latitude ?? job.stops[0].coords.latitude,
          longitude: location?.longitude ?? job.stops[0].coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Markers and Polyline */}
      </MapView>

      <View style={styles.control}>
        <Text style={{ fontWeight: "600" }}>{job.title}</Text>
        <Text>Next stops:</Text>
        {job.stops.map((s: Stop) => (
          <Text key={s.id}>
            • {s.type} — {s.address} {s.collected ? "✅" : ""}
          </Text>
        ))}

        <View style={{ marginTop: 8 }}>
          <Button title="Refresh Route" onPress={buildRoute} />
          <View style={{ marginTop: 8 }}>
            <Button title="Back to Dashboard" onPress={() => router.back()} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  control: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 12,
    borderRadius: 10,
  },
  loading: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
