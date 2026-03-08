import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderDetail = {
  id: string;
  fruit_type: string;
  variant?: string;
  quantity: number;
  grade: string;
  created_at: string;
  farmer_accepted_at: string | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  total_amount?: number | null;
  delivery_location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export default function AddComplaintScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId: string;
    imageUris?: string; // JSON array of URIs when returning from camera
    reason?: string;
  }>();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showExistingComplaintModal, setShowExistingComplaintModal] = useState(false);
  const [existingComplaintId, setExistingComplaintId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const orderId = params.orderId ?? "";

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        const role = (user.role ?? user.user_metadata?.role ?? "").toString().toLowerCase();
        const fromBuyerOrder = !!params.orderId;
        if (role !== "buyer" && !fromBuyerOrder) {
          router.replace("/buyer");
          return;
        }
        setAuthChecked(true);
      } catch (e) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router, params.orderId]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const data: any = await api.get(`/api/buyer/place-order/details/${orderId}`);
      const orderData = data.order || {};
      const totalPriceRaw =
        data.total_price ??
        data.totalPrice ??
        orderData.total_price ??
        orderData.totalPrice ??
        orderData.total_amount ??
        data.total_amount;
      const totalPrice = totalPriceRaw != null ? Number(totalPriceRaw) : null;
      setOrder({
        id: orderData.id,
        fruit_type: orderData.fruit_type,
        variant: orderData.variant,
        quantity: orderData.quantity,
        grade: orderData.grade,
        created_at: orderData.created_at,
        farmer_accepted_at: orderData.farmer_accepted_at ?? null,
        unitPrice: orderData.unit_price ?? orderData.unitPrice ?? null,
        totalPrice,
        total_amount: totalPrice,
        delivery_location: orderData.delivery_location,
        latitude: orderData.latitude != null ? Number(orderData.latitude) : null,
        longitude: orderData.longitude != null ? Number(orderData.longitude) : null,
      });
    } catch (e) {
      Alert.alert("Error", "Failed to load order details.");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    if (authChecked && orderId) fetchOrder();
  }, [authChecked, orderId, fetchOrder]);

  // When returning from camera with imageUris param
  useEffect(() => {
    if (params.imageUris) {
      try {
        const uris = JSON.parse(params.imageUris as string) as string[];
        if (Array.isArray(uris)) setImageUris(uris);
      } catch (_) {}
    }
    if (params.reason != null && params.reason !== "") setReason(String(params.reason));
  }, [params.imageUris, params.reason]);

  const openCamera = () => {
    const params: Record<string, string> = { orderId, reason, fromAddComplaint: "1" };
    if (order?.latitude != null && order?.longitude != null) {
      params.pickup_lat = String(order.latitude);
      params.pickup_lng = String(order.longitude);
    }
    router.push({
      pathname: "/buyer/components/complaint-camera" as any,
      params,
    });
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      Alert.alert("Required", "Please enter the reason for your complaint.");
      return;
    }
    if (imageUris.length !== 5) {
      Alert.alert("Required", "Please add 5 image proofs using the camera.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("order_id", orderId);
      form.append("reason", trimmedReason);
      form.append("status", "in_review");
      form.append("comments", "");
      form.append("image_verification", "pending");

      for (let i = 0; i < imageUris.length; i++) {
        form.append("images", {
          uri: imageUris[i],
          name: `image_${i + 1}.jpg`,
          type: "image/jpeg",
        } as any);
      }

      const data: any = await api.postForm("/api/buyer/complaints", form);

      if (data?.existing_complaint === true) {
        setShowExistingComplaintModal(true);
        return;
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      let isExisting = false;
      let complaintId: string | null = null;
      try {
        const body = typeof err?.message === "string" ? JSON.parse(err.message) : null;
        const msg = body?.message ?? "";
        if (
          body?.existing_complaint === true ||
          body?.code === "COMPLAINT_EXISTS" ||
          /existing\s*complaint/i.test(msg) ||
          /complaint.*already\s+exist|already\s+exist.*complaint/i.test(msg)
        ) {
          isExisting = true;
          complaintId = body?.complaint?.id ?? null;
        }
      } catch (_) {}
      if (isExisting) {
        setExistingComplaintId(complaintId);
        setShowExistingComplaintModal(true);
      } else {
        Alert.alert(
          "Error",
          err?.message || err?.response?.data?.message || "Failed to submit complaint. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked || loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Header title="Add Complaint" showBackButton />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Header title="Add Complaint" showBackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Fruit</Text>
            <Text style={styles.value}>{order.fruit_type}{order.variant ? ` • ${order.variant}` : ""}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Quantity</Text>
            <Text style={styles.value}>{order.quantity} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Grade</Text>
            <Text style={styles.value}>Grade {order.grade}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Placed on</Text>
            <Text style={styles.value}>{formatDate(order.created_at)}</Text>
          </View>
          {order.farmer_accepted_at && (
            <View style={styles.detailRow}>
              <Text style={styles.label}>Accepted on</Text>
              <Text style={styles.value}>{formatDate(order.farmer_accepted_at)}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.value}>
              Rs. {order.totalPrice != null ? formatCurrency(Number(order.totalPrice)) : order.total_amount != null ? formatCurrency(Number(order.total_amount)) : "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for complaint *</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="Describe the issue with your order (quality, quantity, etc.)"
            placeholderTextColor={BuyerColors.textGray}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image proofs (5 required)</Text>
          {imageUris.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbScroll}>
              {imageUris.map((uri, index) => (
                <View key={index} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeThumb} onPress={() => removeImage(index)}>
                    <Ionicons name="close" size={18} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.thumbLabel}>{index + 1}/5</Text>
                </View>
              ))}
            </ScrollView>
          ) : null}
          <TouchableOpacity style={styles.addImagesBtn} onPress={openCamera}>
            <Ionicons name="camera" size={24} color={BuyerColors.primaryGreen} />
            <Text style={styles.addImagesBtnText}>
              {imageUris.length === 0 ? "Add image proofs (5 photos)" : "Retake / Replace images"}
            </Text>
          </TouchableOpacity>
          {imageUris.length > 0 && imageUris.length !== 5 && (
            <Text style={styles.hint}>Capture 5 images in the camera, then tap OK.</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Add complaint</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success popup */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.popupOverlay}
          onPress={() => setShowSuccessModal(false)}
        >
          <View style={styles.popupCard} onStartShouldSetResponder={() => true}>
            <Ionicons name="checkmark-circle" size={56} color={BuyerColors.primaryGreen} />
            <Text style={styles.popupTitle}>Complaint added successfully</Text>
            <Text style={styles.popupSubtitle}>An admin will review and get back to you.</Text>
            <TouchableOpacity
              style={[styles.popupBtn, styles.popupBtnSecondary]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/buyer/(tabs)/complaints" as any);
              }}
            >
              <Text style={styles.popupBtnTextSecondary}>View complaints</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, styles.popupBtnPrimary]}
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/buyer/(tabs)/orders" as any);
              }}
            >
              <Text style={styles.popupBtnTextPrimary}>View orders</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Existing complaint popup */}
      <Modal visible={showExistingComplaintModal} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          style={styles.popupOverlay}
          onPress={() => setShowExistingComplaintModal(false)}
        >
          <View style={styles.popupCard} onStartShouldSetResponder={() => true}>
            <Ionicons name="information-circle" size={56} color={BuyerColors.primaryGreen} />
            <Text style={styles.popupTitle}>There is an existing complaint</Text>
            <Text style={styles.popupSubtitle}>A complaint has already been raised for this order.</Text>
            <TouchableOpacity
              style={[styles.popupBtn, styles.popupBtnPrimary]}
              onPress={() => {
                setShowExistingComplaintModal(false);
                if (existingComplaintId) {
                  router.push({
                    pathname: "/buyer/complaint/[id]" as any,
                    params: { id: existingComplaintId },
                  });
                }
                setExistingComplaintId(null);
              }}
            >
              <Text style={styles.popupBtnTextPrimary}>View complaint</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.popupBtn, styles.popupBtnSecondary]}
              onPress={() => {
                setShowExistingComplaintModal(false);
                setExistingComplaintId(null);
              }}
            >
              <Text style={styles.popupBtnTextSecondary}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: BuyerColors.textGray },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { fontSize: 14, color: BuyerColors.textGray, fontWeight: "500" },
  value: { fontSize: 14, color: "#111827", fontWeight: "600" },
  reasonInput: {
    borderWidth: 1,
    borderColor: BuyerColors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    color: "#111827",
  },
  thumbScroll: { marginBottom: 12 },
  thumbWrap: { marginRight: 12, alignItems: "center", position: "relative" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  removeThumb: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbLabel: { marginTop: 4, fontSize: 11, color: BuyerColors.textGray },
  addImagesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: BuyerColors.primaryGreen,
    borderStyle: "dashed",
    gap: 10,
  },
  addImagesBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: BuyerColors.primaryGreen,
  },
  hint: { marginTop: 8, fontSize: 13, color: BuyerColors.textGray },
  submitBtn: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  popupCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 280,
    maxWidth: "100%",
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    textAlign: "center",
  },
  popupSubtitle: {
    fontSize: 14,
    color: BuyerColors.textGray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  popupBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "stretch",
    marginTop: 10,
  },
  popupBtnPrimary: {
    backgroundColor: BuyerColors.primaryGreen,
  },
  popupBtnSecondary: {
    backgroundColor: "#F3F4F6",
  },
  popupBtnTextPrimary: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  popupBtnTextSecondary: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
});
