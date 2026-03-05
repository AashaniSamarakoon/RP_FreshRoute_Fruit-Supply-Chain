/**
 * Maps and location utilities
 */

import { Linking, Platform } from "react-native";

/**
 * Open directions to a location in the device's default maps app
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 * @param label - Optional label for the destination
 */
export const openDirections = async (
  latitude: number,
  longitude: number,
  label?: string,
) => {
  const destination = `${latitude},${longitude}`;

  const url = Platform.select({
    ios: `maps:0,0?q=${label ? encodeURIComponent(label) + "@" : ""}${destination}`,
    android: `geo:0,0?q=${destination}${label ? `(${encodeURIComponent(label)})` : ""}`,
  });

  if (url) {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to Google Maps web
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${destination}`;
      await Linking.openURL(webUrl);
    }
  }
};

/**
 * Open Google Maps with directions from current location
 * @param latitude - Destination latitude
 * @param longitude - Destination longitude
 */
export const openGoogleMapsDirections = async (
  latitude: number,
  longitude: number,
) => {
  const url = Platform.select({
    ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });

  if (url) {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback to web
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      await Linking.openURL(webUrl);
    }
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param distanceInKm - Distance in kilometers
 * @returns Formatted distance string
 */
export const formatDistance = (distanceInKm: number): string => {
  if (distanceInKm < 1) {
    return `${Math.round(distanceInKm * 1000)} m`;
  }
  return `${distanceInKm.toFixed(1)} km`;
};
