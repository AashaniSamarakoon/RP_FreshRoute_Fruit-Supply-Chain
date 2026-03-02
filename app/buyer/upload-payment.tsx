import Header from "@/components/Header";
import ErrorModal from "@/components/modals/ErrorModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Info,
  RefreshCw
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const IMAGE_QUALITY = 0.8;
const IMAGE_ASPECT = [4, 3] as [number, number];
const UPLOAD_PROGRESS_INTERVAL = 200;
const MAX_PROGRESS = 90;

// Types
interface OrderDetails {
  id: string;
  total_amount: number;
  fruit_type: string;
  variant: string;
  created_at: string;
}

type VerificationStatus = "AUTO_APPROVED" | "FLAGGED" | "REJECTED" | null;

interface UploadResult {
  paymentId: string;
  verificationStatus: VerificationStatus;
  requiresManualReview: boolean;
  message: string;
}

export default function PaymentSlipUploadScreen() {
  const params = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  // State
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Effects
  useEffect(() => {
    if (params.orderId) {
      fetchOrderDetails();
      requestPermissions();
    }
  }, [params.orderId]);

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("placed_orders")
        .select("id, total_amount, fruit_type, variant, created_at")
        .eq("id", params.orderId)
        .single();

      if (error) throw error;
      setOrderDetails(data);
    } catch (error) {
      setErrorMessage("Failed to load order details");
      setErrorModalVisible(true);
    }
  }, [params.orderId]);

  // Request camera and media permissions
  const requestPermissions = useCallback(async () => {
    const [cameraPermission, mediaPermission] = await Promise.all([
      ImagePicker.requestCameraPermissionsAsync(),
      ImagePicker.requestMediaLibraryPermissionsAsync(),
    ]);

    if (!cameraPermission.granted || !mediaPermission.granted) {
      Alert.alert(
        "Permission Required",
        "Camera and photo library access is needed to upload payment slips.",
      );
    }
  }, []);

  // Get file size
  const getFileSize = useCallback(async (uri: string): Promise<number> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return blob.size;
    } catch {
      return 0;
    }
  }, []);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: IMAGE_ASPECT,
        quality: IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      setErrorMessage("Failed to capture photo");
      setErrorModalVisible(true);
    }
  }, []);

  // Pick image from gallery
  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: IMAGE_ASPECT,
        quality: IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        const fileSize = await getFileSize(result.assets[0].uri);

        if (fileSize > MAX_FILE_SIZE) {
          Alert.alert("File Too Large", "Please select an image smaller than 5MB");
          return;
        }
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      setErrorMessage("Failed to select image");
      setErrorModalVisible(true);
    }
  }, [getFileSize]);

  // Get authentication token
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Authentication Required", "Please login again", [
        { text: "OK", onPress: () => router.replace("/login" as any) },
      ]);
    }
    return token;
  }, [router]);

  // Create form data for upload
  const createFormData = useCallback((imageUri: string): FormData => {
    const fileExt = imageUri.split(".").pop() || "jpg";
    const fileName = `payment-slip-${params.orderId}-${Date.now()}.${fileExt}`;

    const formData = new FormData();
    formData.append("paymentSlip", {
      uri: imageUri,
      type: `image/${fileExt}`,
      name: fileName,
    } as any);
    formData.append("orderId", params.orderId);

    return formData;
  }, [params.orderId]);

  const getSuccessMessage = useCallback((status: VerificationStatus, defaultMessage?: string): string => {
    const messages = {
      AUTO_APPROVED: "Your payment has been verified and approved automatically! Your order will be processed shortly.",
      FLAGGED: "Your payment slip has been submitted for verification. You will be notified once it's reviewed (usually within 24 hours).",
      REJECTED: "Payment slip verification failed. Please upload a clearer image with visible amount and date.",
    };
    return defaultMessage || (status && messages[status]) || "Your payment slip has been uploaded successfully and is being processed.";
  }, []);

  // Upload payment slip
  const uploadPaymentSlip = useCallback(async () => {
    if (!imageUri || !orderDetails) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      const token = await getAuthToken();
      if (!token) return;

      progressInterval = setInterval(() => {
        setUploadProgress((prev) => prev >= MAX_PROGRESS ? MAX_PROGRESS : prev + 10);
      }, UPLOAD_PROGRESS_INTERVAL);

      const formData = createFormData(imageUri);
      let result: UploadResult | null = null;
      try {
        result = await api.postForm("/api/buyer/payment-slip/upload", formData);
      } finally {
        if (progressInterval) clearInterval(progressInterval);
      }

      if (result) {
        setUploadProgress(100);
        setVerificationStatus(result.verificationStatus);

        if (result.verificationStatus === "REJECTED") {
          throw new Error(getSuccessMessage("REJECTED", result.message));
        }

        setSuccessMessage(getSuccessMessage(result.verificationStatus, result.message));
        setSuccessModalVisible(true);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to upload payment slip");
      setErrorModalVisible(true);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
    }
  }, [imageUri, orderDetails, getAuthToken, createFormData, getSuccessMessage]);

  const handleSuccessClose = useCallback(() => {
    setSuccessModalVisible(false);
    router.push({
      pathname: "/buyer/payment-status" as any,
      params: { orderId: params.orderId },
    });
  }, [router, params.orderId]);

  const handleErrorClose = useCallback(() => {
    setErrorModalVisible(false);
  }, []);

  const handleImageChange = useCallback(() => {
    setImageUri(null);
  }, []);

  const successTitle = useMemo(() =>
    verificationStatus === "AUTO_APPROVED" ? "✅ Payment Verified!" : "📤 Payment Slip Uploaded",
    [verificationStatus],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Header title="Upload Payment Slip" showBackButton />

      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Summary */}
          {orderDetails && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order</Text>
                <Text style={styles.receiptValue}>{orderDetails.fruit_type} • {orderDetails.variant}</Text>
              </View>
              
              <View style={styles.dashedSeparator} />
              
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>Amount to Pay</Text>
                <Text style={styles.receiptTotalValue}>Rs. {formatCurrency(orderDetails.total_amount)}</Text>
              </View>
            </View>
          )}

          {/* Upload Instructions Callout */}
          <View style={styles.guidelinesBox}>
            <View style={styles.guidelinesHeader}>
              <Info size={18} color="#4F46E5" />
              <Text style={styles.guidelinesTitle}>Verification Guidelines</Text>
            </View>
            <View style={styles.guidelinesList}>
              <View style={styles.guidelineItem}>
                <CheckCircle2 size={14} color="#6366F1" />
                <Text style={styles.guidelineText}>Capture the full payment slip clearly.</Text>
              </View>
              <View style={styles.guidelineItem}>
                <CheckCircle2 size={14} color="#6366F1" />
                <Text style={styles.guidelineText}>Ensure <Text style={{fontWeight: '700'}}>Amount</Text> and <Text style={{fontWeight: '700'}}>Date</Text> are legible.</Text>
              </View>
              <View style={styles.guidelineItem}>
                <CheckCircle2 size={14} color="#6366F1" />
                <Text style={styles.guidelineText}>Format: JPG or PNG (Max 5MB).</Text>
              </View>
            </View>
          </View>

          {/* Image Area */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Document</Text>
            
            {!imageUri ? (
              <View style={styles.uploadZone}>
                <View style={styles.uploadZoneContent}>
                  <View style={styles.uploadIconCircle}>
                    <Upload size={28} color={BuyerColors.primaryGreen} />
                  </View>
                  <Text style={styles.uploadZoneTitle}>Tap to select image</Text>
                  <Text style={styles.uploadZoneSubtitle}>Choose from your camera or gallery</Text>
                </View>
                
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={takePhoto}>
                    <Camera size={18} color="#4B5563" />
                    <Text style={styles.actionBtnText}>Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
                    <ImageIcon size={18} color="#4B5563" />
                    <Text style={styles.actionBtnText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                <TouchableOpacity style={styles.changeImageBtn} onPress={handleImageChange}>
                  <RefreshCw size={16} color="#4B5563" />
                  <Text style={styles.changeImageText}>Replace Image</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Fixed Upload Button */}
        {imageUri && (
          <View style={styles.fixedBottomPanel}>
            {uploading && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
                <Text style={styles.progressText}>Verifying and Uploading... {uploadProgress}%</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, uploading && styles.primaryButtonDisabled]}
              onPress={uploadPaymentSlip}
              disabled={uploading}
              activeOpacity={0.8}
            >
              {uploading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.primaryButtonText}>Processing...</Text>
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Submit Payment Slip</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modals */}
      <SuccessModal
        visible={successModalVisible}
        onClose={handleSuccessClose}
        title={successTitle}
        message={successMessage}
        buttonText="View Status"
        onButtonPress={handleSuccessClose}
      />
      <ErrorModal
        visible={errorModalVisible}
        onClose={handleErrorClose}
        title="Upload Failed"
        message={errorMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  mainContainer: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingVertical: 16 },
  bottomPadding: { height: 40 },

  // Section Styles
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16, letterSpacing: -0.2 },
  
  // Receipt Style Order Summary
  receiptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  receiptLabel: { fontSize: 15, color: "#6B7280", fontWeight: "500" },
  receiptValue: { fontSize: 15, color: "#111827", fontWeight: "600" },
  dashedSeparator: { height: 1, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', marginVertical: 12 },
  receiptTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  receiptTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  receiptTotalValue: { fontSize: 22, fontWeight: "900", color: BuyerColors.primaryGreen },

  // Guidelines Callout Box
  guidelinesBox: { backgroundColor: "#EEF2FF", marginHorizontal: 20, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: "#E0E7FF" },
  guidelinesHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  guidelinesTitle: { fontSize: 15, fontWeight: "700", color: "#4338CA" },
  guidelinesList: { gap: 8 },
  guidelineItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  guidelineText: { fontSize: 13, color: "#4F46E5", flex: 1, lineHeight: 20 },

  // Dropzone Area
  uploadZone: { backgroundColor: "#F9FAFB", borderWidth: 2, borderColor: "#E5E7EB", borderStyle: "dashed", borderRadius: 16, padding: 24, alignItems: "center" },
  uploadZoneContent: { alignItems: "center", marginBottom: 20 },
  uploadIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  uploadZoneTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  uploadZoneSubtitle: { fontSize: 13, color: "#6B7280" },
  
  actionButtonsRow: { flexDirection: "row", gap: 12, width: "100%" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB", gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: "#4B5563" },

  // Image Preview Area
  imagePreviewContainer: { backgroundColor: "#F9FAFB", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
  previewImage: { width: "100%", height: 300, borderRadius: 12, marginBottom: 16, backgroundColor: "#E5E7EB" },
  changeImageBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: "#D1D5DB", gap: 8, width: "100%" },
  changeImageText: { fontSize: 14, fontWeight: "700", color: "#4B5563" },

  // Fixed Bottom Panel
  fixedBottomPanel: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingHorizontal: 20, paddingVertical: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  primaryButton: { backgroundColor: BuyerColors.primaryGreen, borderRadius: 12, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", letterSpacing: 0.3 },

  // Progress Bar
  progressContainer: { marginBottom: 16 },
  progressBar: { height: 6, backgroundColor: "#E5E7EB", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: BuyerColors.primaryGreen, borderRadius: 3 },
  progressText: { fontSize: 13, color: "#6B7280", textAlign: "center", fontWeight: "500" },
});