import * as Location from "expo-location";
import { Linking } from "react-native";

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export interface LocationVerificationResult {
  success: boolean;
  distance: number | null;
  error: string | null;
}

/**
 * Verify if current device location matches the pickup location
 * @param pickupLat Latitude of pickup location
 * @param pickupLng Longitude of pickup location
 * @param threshold Distance threshold in meters (default: 100m)
 * @returns LocationVerificationResult with success status, distance, and error message
 */
export const verifyLocation = async (
  pickupLat: number | null,
  pickupLng: number | null,
  threshold: number = 100
): Promise<LocationVerificationResult> => {
  // If no pickup location provided, skip verification
  if (pickupLat === null || pickupLng === null) {
    return {
      success: true,
      distance: null,
      error: null,
    };
  }

  try {
    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return {
        success: false,
        distance: null,
        error: "Location permission denied. Please enable location access.",
      };
    }

    // Get current location with high accuracy
    const currentLocation = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const currentLat = currentLocation.coords.latitude;
    const currentLng = currentLocation.coords.longitude;

    // Calculate distance
    const distance = calculateDistance(
      pickupLat,
      pickupLng,
      currentLat,
      currentLng
    );

    // Small delay for UX (optional, can be removed if not needed)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (distance <= threshold) {
      // Location matches
      return {
        success: true,
        distance,
        error: null,
      };
    } else {
      // Location doesn't match - format distance
      const distanceText = distance < 1000 
        ? `${distance.toFixed(0)}m` 
        : `${(distance / 1000).toFixed(2)} km`;
      
      return {
        success: false,
        distance,
        error: `Location mismatch. You are ${distanceText} away from the pickup location. Please move to the correct location.`,
      };
    }
  } catch (error) {
    console.error("Location verification error:", error);
    return {
      success: false,
      distance: null,
      error: "Failed to verify location. Please try again.",
    };
  }
};

/**
 * Open Google Maps navigation to the specified location
 * @param lat Latitude of destination
 * @param lng Longitude of destination
 */
export const openGoogleMapsToLocation = (lat: number | null, lng: number | null): void => {
  if (lat !== null && lng !== null) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  }
};

