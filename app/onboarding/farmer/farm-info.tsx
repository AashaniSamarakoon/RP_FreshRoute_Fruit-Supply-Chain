import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useOnboarding } from "../OnboardingContext";
import OnboardingShell, { HEADER_HEIGHT } from "../OnboardingShell";

const cropOptions = [
  { id: "mango", label: "Mango", icon: "🥭" },
  { id: "banana", label: "Banana", icon: "🍌" },
  { id: "pineapple", label: "Pineapple", icon: "🍍" },
];

export default function FarmInfoStep() {
  const router = useRouter();
  const { updateFarmerData } = useOnboarding();
  const [acreage, setAcreage] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // map preview state - default to center of Sri Lanka so map always displays
  const DEFAULT_REGION: Region = {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const mapRef = useRef<MapView>(null);

  // Try to get current location in background, non-blocking
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        let loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (err) {
        console.log("Could not get location, using default", err);
      }
    })();
  }, []);

  const toggleCrop = (id: string) => {
    setSelectedCrops((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const onNext = () => {
    if (!acreage || selectedCrops.length === 0) {
      Alert.alert(
        "Missing Information",
        "Please fill in all fields to continue.",
      );
      return;
    }
    // store values in memory
    updateFarmerData({
      farm_size: Number(acreage),
      primary_crops: selectedCrops,
    });
    router.push("/onboarding/farmer/kyc" as any);
  };

  return (
    <OnboardingShell
      step={2}
      hideBack
      footer={
        <TouchableOpacity
          style={[styles.primaryButton, saving && { opacity: 0.7 }]}
          onPress={onNext}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Continue to Verification"}
          </Text>
          {!saving && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
          )}
        </TouchableOpacity>
      }
    >
      <Text style={styles.title}>Farm Details</Text>
      <Text style={styles.subtitle}>
        Help us understand your capacity to get better wholesale matches.
      </Text>

      {/* Map Preview Section */}
      <View style={styles.section}>
        <Text style={styles.label}>Farm Location Pin</Text>
        <TouchableOpacity
          style={styles.mapContainer}
          activeOpacity={0.8}
          onPress={() => router.push("/onboarding/farmer/location" as any)}
        >
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.smallMap}
            region={region}
            pointerEvents="none"
          />
          <View style={styles.pinContainer}>
            <Ionicons name="location" size={32} color="#2E7D32" />
          </View>
          {/* Edit Overlay Banner */}
          <View style={styles.mapEditOverlay}>
            <Ionicons name="pencil" size={14} color="#fff" />
            <Text style={styles.mapEditText}>Tap to edit location</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Form Fields */}
      <View style={styles.section}>
        <Text style={styles.label}>Total Acreage</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={acreage}
            onChangeText={setAcreage}
            placeholder="e.g. 2.5"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={styles.inputSuffix}>Acres</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Primary Crops</Text>
        <View style={styles.chipRow}>
          {cropOptions.map((crop) => {
            const isActive = selectedCrops.includes(crop.id);
            return (
              <TouchableOpacity
                key={crop.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => toggleCrop(crop.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipIcon}>{crop.icon}</Text>
                <Text
                  style={[styles.chipText, isActive && styles.chipTextActive]}
                >
                  {crop.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </OnboardingShell>
  );
}

// Ensure header is hidden globally for this route
export const options = { headerShown: false };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex1: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    paddingTop: HEADER_HEIGHT + 20,
    paddingBottom: 120,
  }, // Extra padding bottom for fixed button

  // Header & Typography
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 44 : 15,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  backButton: { marginRight: 16, padding: 4 },
  progressContainer: { flex: 1, flexDirection: "row", gap: 6, marginRight: 16 },
  progressActive: {
    height: 4,
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: 2,
  },
  progressInactive: {
    height: 4,
    flex: 1,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
  },
  stepText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginTop: HEADER_HEIGHT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 32,
  },

  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },

  // Inputs
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  inputSuffix: {
    position: "absolute",
    right: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Chips
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  chipActive: {
    backgroundColor: "#E8F5E9",
    borderColor: "#2E7D32",
    borderWidth: 1.5,
  },
  chipIcon: { fontSize: 16, marginRight: 6 },
  chipText: { color: "#374151", fontSize: 15, fontWeight: "500" },
  chipTextActive: { color: "#1B5E20", fontWeight: "700" },

  // Map
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  mapPlaceholder: { justifyContent: "center", alignItems: "center" },
  smallMap: { flex: 1 },
  pinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -32 }],
  },
  mapEditOverlay: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  mapEditText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Bottom Fixed Button
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
    height: 56,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  buttonIcon: { marginLeft: 8 },
});
