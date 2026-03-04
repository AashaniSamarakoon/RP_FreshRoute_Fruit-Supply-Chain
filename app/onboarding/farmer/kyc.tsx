import api from "@/services/api";
import { uploadImageToSupabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useOnboarding } from "../OnboardingContext";
import OnboardingShell, { HEADER_HEIGHT } from "../OnboardingShell";

export default function KycStep() {
  const router = useRouter();
  const { farmerData, clearOnboardingData } = useOnboarding();
  const [nicFront, setNicFront] = useState<string | null>(null);
  const [nicBack, setNicBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [proofDoc, setProofDoc] = useState<string | null>(null); // new document
  const [bankDetails, setBankDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async (setter: (uri: string) => void) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };

  const takePhoto = async (setter: (uri: string) => void) => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets.length > 0) {
      setter(result.assets[0].uri);
    }
  };

  const onSubmit = async () => {
    // 1. Validate all four docs plus bank details
    if (!nicFront || !nicBack || !selfie || !proofDoc || !bankDetails) {
      Alert.alert(
        "Missing Information",
        "Please upload all required documents to continue.",
      );
      return;
    }

    // quick config sanity check (non‑development builds only)
    if (!process.env.EXPO_PUBLIC_BACKEND_URL && !__DEV__) {
      Alert.alert(
        "Configuration error",
        "Backend URL is not specified. Please set EXPO_PUBLIC_BACKEND_URL.",
      );
      return;
    }

    setSubmitting(true);
    try {
      // prepare context pieces
      let userStr = await AsyncStorage.getItem("user");
      let user: any;
      if (userStr) {
        user = JSON.parse(userStr);
      } else {
        throw new Error(
          "User information missing from storage. Please log in again.",
        );
      }
      const userId = user.id as string;

      // farmerData comes from OnboardingContext (saved under "onboarding_farmer")
      // and contains lat/lng/location from the location step plus
      // farm_size/primary_crops from the farm-info step.
      const locInfo = farmerData;
      const farmInfo = farmerData;

      // 2. upload all images sequentially so failure is easier to trace
      let nicFrontUrl: string,
        nicBackUrl: string,
        selfieUrl: string,
        proofUrl: string;
      try {
        nicFrontUrl = await uploadImageToSupabase(
          nicFront!,
          userId,
          "Farmer",
          "nic",
          "front.jpg",
        );
        nicBackUrl = await uploadImageToSupabase(
          nicBack!,
          userId,
          "Farmer",
          "nic",
          "back.jpg",
        );
        selfieUrl = await uploadImageToSupabase(
          selfie!,
          userId,
          "Farmer",
          "profile",
          "selfie.jpg",
        );
        proofUrl = await uploadImageToSupabase(
          proofDoc!,
          userId,
          "Farmer",
          "documents",
          "proof_of_farming.jpg",
        );
      } catch (uploadErr: any) {
        console.error("Image upload failed", uploadErr);
        throw new Error(
          "Image upload failed: " + (uploadErr.message || uploadErr),
        );
      }

      // 3. Build payload
      const payload = {
        lat: locInfo.lat,
        lng: locInfo.lng,
        location: locInfo.location,
        bank_details: bankDetails,
        farm_size: farmInfo.farm_size,
        primary_crops: farmInfo.primary_crops,
        nic_front_url: nicFrontUrl,
        nic_back_url: nicBackUrl,
        avatar_url: selfieUrl,
        proof_of_farming_url: proofUrl,
      };
      console.log("Submitting KYC payload", payload);

      // 4. send to backend endpoint
      await api.put("/api/auth/onboarding/farmer", payload);

      // 5. cleanup in-memory context and mark onboarding
      clearOnboardingData();
      await AsyncStorage.setItem("onboarded", "true");
      router.replace("/farmer" as any);
    } catch (err: any) {
      console.error("KYC submission error", err);
      Alert.alert("Error", err.message || "Failed to submit Registration");
    } finally {
      setSubmitting(false);
    }
  };

  const UploadBox = ({ label, imageUri, setter, icon }: any) => (
    <View style={styles.uploadSection}>
      <Text style={styles.label}>{label}</Text>
      {imageUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.editBadge}
            onPress={() => pickImage(setter)}
          >
            <Ionicons name="pencil" size={14} color="#fff" />
            <Text style={styles.editBadgeText}>Edit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploadBox}>
          <View style={styles.iconCircle}>
            <Ionicons name={icon} size={28} color="#2E7D32" />
          </View>
          <Text style={styles.uploadInstructions}>
            Tap below to provide document
          </Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => pickImage(setter)}
            >
              <Ionicons name="images-outline" size={18} color="#374151" />
              <Text style={styles.actionBtnText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => takePhoto(setter)}
            >
              <Ionicons name="camera-outline" size={18} color="#374151" />
              <Text style={styles.actionBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <OnboardingShell
      step={3}
      footer={
        <TouchableOpacity
          style={[styles.primaryButton, submitting && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                Complete Registration
              </Text>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#fff"
                style={styles.buttonIcon}
              />
            </>
          )}
        </TouchableOpacity>
      }
    >
      <Text style={styles.title}>Identity & Payout</Text>
      <Text style={styles.subtitle}>
        We need this to verify you on the blockchain network and process your
        payments.
      </Text>

      <UploadBox
        label="NIC Front"
        imageUri={nicFront}
        setter={setNicFront}
        icon="id-card-outline"
      />
      <UploadBox
        label="NIC Back"
        imageUri={nicBack}
        setter={setNicBack}
        icon="scan-outline"
      />
      <UploadBox
        label="Profile Selfie"
        imageUri={selfie}
        setter={setSelfie}
        icon="person-outline"
      />
      <UploadBox
        label="Proof of Farming Document"
        imageUri={proofDoc}
        setter={setProofDoc}
        icon="document-text-outline"
      />

      <View style={styles.field}>
        <Text style={styles.label}>Bank Details</Text>
        <View style={styles.inputWrapper}>
          <Ionicons
            name="business-outline"
            size={20}
            color="#6B7280"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            value={bankDetails}
            onChangeText={setBankDetails}
            placeholder="Account No + Bank Name"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>
    </OnboardingShell>
  );
}

export const options = { headerShown: false };

const styles = StyleSheet.create({
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

  uploadSection: { marginBottom: 24 },
  uploadBox: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  uploadInstructions: { fontSize: 13, color: "#6B7280", marginBottom: 16 },

  field: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 16, fontSize: 15, color: "#111827" },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  actionBtnText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  previewContainer: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  previewImage: { width: "100%", height: "100%" },
  editBadge: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
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
