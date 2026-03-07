import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useOnboarding } from "../OnboardingContext";
import OnboardingShell from "../OnboardingShell";

export default function BusinessStep() {
  const router = useRouter();
  const { updateBuyerData } = useOnboarding();
  const [company, setCompany] = useState("");
  const [taxTin, setTaxTin] = useState("");
  const [saving, setSaving] = useState(false);

  // location state - default to center of Sri Lanka so map always displays
  const DEFAULT_REGION: Region = {
    latitude: 7.8731,
    longitude: 80.7718,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const mapRef = useRef<MapView>(null);

  // keep context in sync as user types/chooses location
  useEffect(() => {
    updateBuyerData({ company_name: company, tax_tin_number: taxTin });
  }, [company, taxTin]);

  // persist map coordinates if user returns from location picker
  useEffect(() => {
    updateBuyerData({ lat: region.latitude, lng: region.longitude });
  }, [region]);

  // Try to get current location in background, non-blocking
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const loc = await Location.getCurrentPositionAsync({
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

  const onNext = () => {
    if (!company || !taxTin) {
      Alert.alert(
        "Missing Information",
        "Please fill in your company name and tax ID to continue.",
      );
      return;
    }
    const update: any = {
      company_name: company,
      tax_tin_number: taxTin,
    };
    if (region) {
      update.latitude = region.latitude;
      update.longitude = region.longitude;
    }
    updateBuyerData(update);
    router.push("/onboarding/buyer/kyc");
  };

  return (
    <OnboardingShell
      step={2}
      // hideBack
      footer={
        <TouchableOpacity
          style={[styles.primaryButton, saving && { opacity: 0.7 }]}
          onPress={onNext}
          disabled={saving}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? "Saving..." : "Next: Upload Documents"}
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
      <View style={{ marginTop: 20 }}>
        <Text style={styles.title}>Business Profile</Text>
        <Text style={styles.subtitle}>
          Help us verify your business entity to access wholesale farmer
          listings.
        </Text>

        {/* Map Preview Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Business Location Pin</Text>
          <TouchableOpacity
            style={styles.mapContainer}
            activeOpacity={0.8}
            onPress={() => router.push("/onboarding/buyer/location" as any)}
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
          <Text style={styles.label}>Company / Business Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="business-outline"
              size={20}
              color="#6B7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Fresh Foods Pvt Ltd"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Tax TIN Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color="#6B7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={taxTin}
              onChangeText={setTaxTin}
              placeholder="e.g. 123456789"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  // Input Styles
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: "#111827",
  },

  // Map Styles
  mapContainer: {
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F3F4F6",
  },
  mapPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  smallMap: {
    flex: 1,
  },
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

  // Footer Button Styles
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
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
