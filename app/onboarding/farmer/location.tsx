import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useOnboarding } from "../OnboardingContext";

export default function LocationStep() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { updateFarmerData } = useOnboarding();
  const [region, setRegion] = useState<Region | null>(null);
  const [address, setAddress] = useState("Dragging to locate...");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    goToCurrentLocation();
  }, []);

  // Snap map to actual GPS location
  const goToCurrentLocation = async () => {
    try {
      setSearching(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };

      setRegion(currentRegion);
      mapRef.current?.animateToRegion(currentRegion, 1000);
      updateAddress(currentRegion.latitude, currentRegion.longitude);
      setLoading(false);
    } catch (err) {
      Alert.alert("Error", "Could not fetch current location.");
    } finally {
      setSearching(false);
    }
  };

  const updateAddress = async (lat: number, lng: number) => {
    try {
      let result = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (result.length > 0) {
        const { name, street, district, city } = result[0];
        setAddress(
          `${name || ""} ${street || ""}, ${city || district || ""}`
            .replace(/^[ ,]+/, "")
            .trim(),
        );
      }
    } catch (e) {
      setAddress("Unknown Location");
    }
  };

  // Search function using Expo's free geocoder
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const result = await Location.geocodeAsync(searchQuery);
      if (result.length > 0) {
        const { latitude, longitude } = result[0];
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        Alert.alert(
          "Not Found",
          "Could not find that location. Try a broader area like 'Dambulla'.",
        );
      }
    } catch (err) {
      Alert.alert("Error", "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setMoving(false);
    setRegion(newRegion);
    updateAddress(newRegion.latitude, newRegion.longitude);
  };

  const onNext = () => {
    if (!region) return;
    // store location in context
    updateFarmerData({
      lat: region.latitude,
      lng: region.longitude,
      location: address,
    });
    router.push("/onboarding/farmer/farm-info" as any);
  };

  if (loading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region!}
        onRegionChange={() => setMoving(true)}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation={true}
        showsMyLocationButton={false} // We are using a custom button for better UI
      />

      {/* Center Pin */}
      <View style={styles.pinContainer} pointerEvents="none">
        <View style={[styles.pinFloating, moving && styles.pinLifted]}>
          <Ionicons name="location" size={48} color="#2E7D32" />
          <View style={styles.pinShadow} />
        </View>
      </View>

      {/* Top Overlay: Back Button + Search Bar */}
      <SafeAreaView style={styles.overlayTop} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color="#6B7280"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search area (e.g., Dambulla)"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searching && (
              <ActivityIndicator
                size="small"
                color="#2E7D32"
                style={{ marginRight: 10 }}
              />
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Custom Current Location Button */}
      <TouchableOpacity
        style={styles.currentLocButton}
        onPress={goToCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#2E7D32" />
      </TouchableOpacity>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.addressTitle}>Selected Address</Text>
        <Text style={styles.addressText} numberOfLines={2}>
          {moving ? "Locating..." : address}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, moving && { opacity: 0.7 }]}
          onPress={onNext}
          disabled={moving}
        >
          <Text style={styles.primaryButtonText}>Next: Farm Details</Text>
          <Ionicons
            name="arrow-forward"
            size={20}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const options = { headerShown: false };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  map: { flex: 1 },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 12, color: "#6B7280", fontWeight: "500" },

  pinContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  pinFloating: { alignItems: "center", transform: [{ translateY: -24 }] },
  pinLifted: { transform: [{ translateY: -35 }] },
  pinShadow: {
    width: 8,
    height: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 4,
    marginTop: -4,
  },

  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 40 : 10,
  },
  headerRow: { flexDirection: "row", alignItems: "center", width: "100%" },

  backButton: {
    backgroundColor: "white",
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  searchContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: "#111827" },

  // Custom GPS Button
  currentLocButton: {
    position: "absolute",
    bottom: 180,
    right: 20,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },

  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 15,
  },
  addressTitle: {
    fontSize: 12,
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    marginBottom: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    // marginBottom: 24,
    minHeight: 40,
  },

  primaryButton: {
    backgroundColor: "#2E7D32",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
