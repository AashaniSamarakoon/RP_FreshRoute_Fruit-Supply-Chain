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
  CheckCircle,
  Image as ImageIcon,
  Upload,
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
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatus>(null);
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
      console.error("[PaymentUpload] Error fetching order:", error);
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
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: IMAGE_ASPECT,
        quality: IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[PaymentUpload] Camera error:", error);
      setErrorMessage("Failed to capture photo");
      setErrorModalVisible(true);
    }
  }, []);

  // Pick image from gallery
  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images" as any,
        allowsEditing: true,
        aspect: IMAGE_ASPECT,
        quality: IMAGE_QUALITY,
      });

      if (!result.canceled && result.assets[0]) {
        const fileSize = await getFileSize(result.assets[0].uri);

        if (fileSize > MAX_FILE_SIZE) {
          Alert.alert(
            "File Too Large",
            "Please select an image smaller than 5MB",
          );
          return;
        }

        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("[PaymentUpload] Gallery error:", error);
      setErrorMessage("Failed to select image");
      setErrorModalVisible(true);
    }
  }, [getFileSize]);

  // Get authentication token
  const getAuthToken = useCallback(async (): Promise<string | null> => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      Alert.alert("Authentication Required", "Please login again", [
        {
          text: "OK",
          onPress: () => router.replace("/login" as any),
        },
      ]);
    }
    return token;
  }, [router]);

  // Create form data for upload
  const createFormData = useCallback(
    (imageUri: string): FormData => {
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
    },
    [params.orderId],
  );

  // Get success message based on verification status
  const getSuccessMessage = useCallback(
    (status: VerificationStatus, defaultMessage?: string): string => {
      const messages = {
        AUTO_APPROVED:
          "Your payment has been verified and approved automatically! Your order will be processed shortly.",
        FLAGGED:
          "Your payment slip has been submitted for verification. You will be notified once it's reviewed (usually within 24 hours).",
        REJECTED:
          "Payment slip verification failed. Please upload a clearer image with visible amount and date.",
      };

      return (
        defaultMessage ||
        (status && messages[status]) ||
        "Your payment slip has been uploaded successfully and is being processed."
      );
    },
    [],
  );

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

      // Start progress animation
      progressInterval = setInterval(() => {
        setUploadProgress((prev) =>
          prev >= MAX_PROGRESS ? MAX_PROGRESS : prev + 10,
        );
      }, UPLOAD_PROGRESS_INTERVAL);

      // Create and upload form data via shared helper
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

        setSuccessMessage(
          getSuccessMessage(result.verificationStatus, result.message),
        );
        setSuccessModalVisible(true);
      }
    } catch (error: any) {
      console.error("[PaymentUpload] Upload error:", error);
      setErrorMessage(error.message || "Failed to upload payment slip");
      setErrorModalVisible(true);
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      setUploading(false);
    }
  }, [imageUri, orderDetails, getAuthToken, createFormData, getSuccessMessage]);

  // Handle success modal close
  const handleSuccessClose = useCallback(() => {
    setSuccessModalVisible(false);
    router.push({
      pathname: "/buyer/payment-status" as any,
      params: { orderId: params.orderId },
    });
  }, [router, params.orderId]);

  // Handle error modal close
  const handleErrorClose = useCallback(() => {
    setErrorModalVisible(false);
  }, []);

  // Handle image change
  const handleImageChange = useCallback(() => {
    setImageUri(null);
  }, []);

  // Memoized values
  const successTitle = useMemo(
    () =>
      verificationStatus === "AUTO_APPROVED"
        ? "✅ Payment Verified!"
        : "📤 Payment Slip Uploaded",
    [verificationStatus],
  );

  const showUploadButton = Boolean(imageUri);
  const showImagePicker = !imageUri;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Upload Payment Slip" showBackButton />

      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Upload Instructions */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>⚠️ Upload Instructions</Text>
            <InstructionsList />
          </View>

          <View style={styles.statusDivider} />

          {/* Order Summary */}
          {orderDetails && <OrderSummary orderDetails={orderDetails} />}

          {/* Image Preview */}
          {imageUri && (
            <>
              <View style={styles.statusDivider} />
              <ImagePreview
                imageUri={imageUri}
                onChangeImage={handleImageChange}
              />
            </>
          )}

          {/* Image Picker Buttons */}
          {showImagePicker && (
            <ImagePickerButtons
              onTakePhoto={takePhoto}
              onPickImage={pickImage}
            />
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Upload Button */}
        {showUploadButton && (
          <UploadButton
            uploading={uploading}
            uploadProgress={uploadProgress}
            onUpload={uploadPaymentSlip}
          />
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

// Sub-components
function InstructionsList() {
  const instructions = useMemo(
    () => [
      "Ensure good lighting",
      "Capture full payment slip",
      "Amount, date, reference number (order id) clearly visible",
      "Formats: JPG, PNG (Max 5MB)",
    ],
    [],
  );

  return (
    <View style={styles.instructionsList}>
      {instructions.map((text, index) => (
        <InstructionItem key={index} text={text} />
      ))}
    </View>
  );
}

function InstructionItem({ text }: { text: string }) {
  return (
    <View style={styles.instructionItem}>
      <CheckCircle size={16} color={BuyerColors.primaryGreen} />
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

interface OrderSummaryProps {
  orderDetails: OrderDetails;
}

function OrderSummary({ orderDetails }: OrderSummaryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Order Summary</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Product</Text>
        <Text style={styles.detailValue}>
          {orderDetails.fruit_type} - {orderDetails.variant}
        </Text>
      </View>
      <View style={styles.priceDivider} />
      <View style={styles.detailRow}>
        <Text style={styles.priceTotalLabel}>Amount to Pay</Text>
        <Text style={styles.priceTotalValue}>
          {formatCurrency(orderDetails.total_amount)}
        </Text>
      </View>
    </View>
  );
}

interface ImagePreviewProps {
  imageUri: string;
  onChangeImage: () => void;
}

function ImagePreview({ imageUri, onChangeImage }: ImagePreviewProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Payment Slip Preview</Text>
      <Image
        source={{ uri: imageUri }}
        style={styles.previewImage}
        resizeMode="contain"
      />
      <TouchableOpacity style={styles.changeButton} onPress={onChangeImage}>
        <Text style={styles.changeButtonText}>Change Image</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ImagePickerButtonsProps {
  onTakePhoto: () => void;
  onPickImage: () => void;
}

function ImagePickerButtons({
  onTakePhoto,
  onPickImage,
}: ImagePickerButtonsProps) {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.cameraButton} onPress={onTakePhoto}>
        <Camera size={20} color="#fff" />
        <Text style={styles.cameraButtonText}>Take Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.galleryButton} onPress={onPickImage}>
        <ImageIcon size={20} color={BuyerColors.primaryGreen} />
        <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

interface UploadButtonProps {
  uploading: boolean;
  uploadProgress: number;
  onUpload: () => void;
}

function UploadButton({
  uploading,
  uploadProgress,
  onUpload,
}: UploadButtonProps) {
  return (
    <View style={styles.fixedBottom}>
      <View style={styles.fixedBottomContent}>
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              Uploading... {uploadProgress}%
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            uploading && styles.primaryButtonDisabled,
          ]}
          onPress={onUpload}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.primaryButtonText}>Uploading...</Text>
            </>
          ) : (
            <>
              <Upload size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Upload Payment Slip</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    marginBottom: 14,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: "#333",
  },
  detailValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
    marginBottom: 12,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  priceTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    backgroundColor: "#F8F8F8",
    marginBottom: 12,
  },
  changeButton: {
    paddingVertical: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    alignItems: "center",
  },
  changeButtonText: {
    color: BuyerColors.primaryGreen,
    fontSize: 15,
    fontWeight: "600",
  },
  buttonContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  cameraButton: {
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  cameraButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  galleryButton: {
    backgroundColor: "#F8F8F8",
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  galleryButtonText: {
    color: BuyerColors.primaryGreen,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  fixedBottom: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedBottomContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bottomPadding: {
    height: 16,
  },
});
