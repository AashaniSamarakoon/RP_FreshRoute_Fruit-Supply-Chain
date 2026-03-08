// services/locationTask.ts
import api from "@/services/api"; // Adjust path if needed
import * as Location from "expo-location";

// Store the interval ID so we can stop it later
let trackingInterval: ReturnType<typeof setInterval> | null = null;

// Helper function to fetch and send a single location ping
const pingLocation = async () => {
  try {
    // Get the current location (low/balanced accuracy is faster and saves battery)
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Send to your Node backend
    await api.post("/api/transporter/location", {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    });

    console.log(
      `📍 Scheduled location synced: ${location.coords.latitude}, ${location.coords.longitude}`,
    );
  } catch (err) {
    //console.error("Failed to sync scheduled location:", err);
  }
};

// 1. Helper to start tracking (Foreground Only)
export const startLocationTracking = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Foreground location permission is required to track deliveries.");
      return false;
    }

    // Ping immediately so we don't have to wait 5 minutes for the very first update
    await pingLocation();

    // Set up the exact 5-minute timer (300,000 ms)
    trackingInterval = setInterval(() => {
      pingLocation();
    }, 300000);

    console.log("Started foreground location polling (every 5 mins)");
    return true;
  } catch (error) {
    console.error("Error starting location tracking:", error);
    return false;
  }
};

// 2. Helper to stop tracking
export const stopLocationTracking = async () => {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
    console.log("Stopped foreground location polling");
  }
};

// 3. Helper to check current status
export const isTrackingActive = async () => {
  return trackingInterval !== null;
};
