import api from "@/services/api";
import { uploadImageToSupabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useOnboarding } from "../OnboardingContext";
import OnboardingShell from "../OnboardingShell";

export default function BuyerKyc() {
  const router = useRouter();
  const { buyerData, clearOnboardingData, updateBuyerData } = useOnboarding();
  const [nicFront, setNicFront] = useState<string | null>(null);
  const [nicBack, setNicBack] = useState<string | null>(null);
  const [brDoc, setBrDoc] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Store URIs in context as soon as the user picks files
  useEffect(() => {
    updateBuyerData({
      nic_front_url: nicFront ?? undefined,
      nic_back_url: nicBack ?? undefined,
      br_url: brDoc ?? undefined,
    });
  }, [nicFront, nicBack, brDoc, updateBuyerData]);

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
    if (!nicFront || !nicBack || !brDoc || !selfie) {
      Alert.alert(
        "Missing Information",
        "Please upload all documents and a selfie to continue.",
      );
      return;
    }
    setSubmitting(true);

    try {
      // 1. Retrieve the authenticated User ID
      let userStr = await AsyncStorage.getItem("user");
      if (!userStr) {
        throw new Error(
          "User information missing from storage. Please log in again.",
        );
      }
      const user = JSON.parse(userStr);
      const userId = user.id as string;

      // 2. Upload images concurrently to the capitalized 'Buyer' bucket
      const [nicFrontUrl, nicBackUrl, brUrl, selfieUrl] = await Promise.all([
        uploadImageToSupabase(nicFront, userId, "Buyer", "nic", "front.jpg"),
        uploadImageToSupabase(nicBack, userId, "Buyer", "nic", "back.jpg"),
        uploadImageToSupabase(brDoc, userId, "Buyer", "documents", "br.jpg"),
        uploadImageToSupabase(selfie, userId, "Buyer", "profile", "selfie.jpg"),
      ]);

      // 3. Build the payload
      const payload = {
        ...buyerData,
        nic_front_url: nicFrontUrl,
        nic_back_url: nicBackUrl,
        business_registration_url: brUrl, // backend expects this key
        avatar_url: selfieUrl,
        is_onboarded: true,
      };

      // 4. Send to Express Backend
      await api.put("/api/auth/onboarding/buyer", payload);

      // 5. Cleanup Context and Redirect
      clearOnboardingData();
      await AsyncStorage.setItem("onboarded", "true");
      router.replace("/buyer");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to submit registration");
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
          activeOpacity={0.8}
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
      <View style={{ marginTop: 20 }}>
        <Text style={styles.title}>Identity & Registration</Text>
        <Text style={styles.subtitle}>
          Upload your NIC and business registration to verify your identity.
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
          label="Business Registration"
          imageUri={brDoc}
          setter={setBrDoc}
          icon="document-text-outline"
        />
        <UploadBox
          label="Selfie"
          imageUri={selfie}
          setter={setSelfie}
          icon="camera-outline"
        />
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
  uploadSection: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
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

export const options = { headerShown: false };
