import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { FarmerInfo, PlacedOrder } from "@/types";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// --- Helpers ---
const getFruitMeta = (fruit: string) => {
  const f = fruit?.toLowerCase() || "";
  if (f.includes("banana")) return { emoji: "🍌", bg: "#FEF9C3", text: "#CA8A04" };
  if (f.includes("mango")) return { emoji: "🥭", bg: "#FFEDD5", text: "#EA580C" };
  if (f.includes("pineapple")) return { emoji: "🍍", bg: "#FEF08A", text: "#A16207" };
  return { emoji: "📦", bg: "#F3F4F6", text: "#6B7280" };
};

/** Humanized "time since" for complaint window messaging (e.g. "2 days passed", "5 hours passed") */
function getTimePassedSince(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  if (ms < 0) return "just now";
  const mins = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days > 0) return `${days} day${days === 1 ? "" : "s"} passed`;
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"} passed`;
  if (mins > 0) return `${mins} min${mins === 1 ? "" : "s"} passed`;
  return "just now";
}

const COMPLAINT_WINDOW_MS = 24 * 60 * 60 * 1000;

const getStatusStyles = (status: string) => {
  switch (status) {
    case "AWAITING_PAYMENT":
    case "UNPAID":
      return { bg: "#FEF2F2", text: "#EF4444", label: "AWAITING PAYMENT" };
    case "AUTHORIZED_PAYMENT":
      return { bg: "#FEF2F2", text: "#F59E0B", label: "AUTHORIZED" };
    case "OPEN":
    case "PENDING_BUYER":
    case "PENDING_FARMER":
      return { bg: "#FFF7ED", text: "#F97316", label: "PENDING" };
    case "MATCHED":
      return { bg: "#EEF2FF", text: "#6366F1", label: "MATCHED" };
    case "PAID_PENDING_DELIVERY":
    case "IN_TRANSIT":
      return { bg: "#EFF6FF", text: "#3B82F6", label: "IN TRANSIT" };
    case "PACKING":
    case "READY_FOR_PICKUP":
      return { bg: "#EFF6FF", text: "#3B82F6", label: status.replace(/_/g, " ").toUpperCase() };
    case "DELIVERED":
    case "COMPLETED":
      return { bg: "#F0FDF4", text: "#22C55E", label: "COMPLETED" };
    case "CANCELLED":
      return { bg: "#F3F4F6", text: "#6B7280", label: "CANCELLED" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280", label: status?.replace(/_/g, " ").toUpperCase() || "UNKNOWN" };
  }
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<PlacedOrder | any>(null);
  const [farmer, setFarmer] = useState<FarmerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (params.orderId) fetchOrderDetails();
  }, [params.orderId]);

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setFetchError(null);
      if (!params.orderId) throw new Error("No orderId provided");

      // Fetching directly from Orders API so it catches the exact Postman response format
      const all: any = await api.get(`/api/farmer/orders`);
      const arr: any[] = Array.isArray(all) ? all : (all?.orders ?? all ?? []);
      const found = arr.find((o) => String(o.id) === String(params.orderId));
      if (!found) throw new Error("Order not found");

      setOrder(found);

      if (found.farmer) {
        const userData = found.farmer.user || found.farmer.users || {};
        setFarmer({
          id: found.farmer.id,
          name: userData?.name || userData?.full_name || "Unknown",
          phone: userData?.phone || "",
          rating: undefined,
          location: found.farmerPickup?.location || found.farmer.location || undefined,
        });
      } else {
        setFarmer(null);
      }

      if (found.product_images?.length > 0) {
        setProductImages(Array.isArray(found.product_images) ? found.product_images : [found.product_images]);
      } else {
        setProductImages([]);
      }
    } catch (error: any) {
      setFetchError(error?.message || "Failed to load order details");
      setOrder(null);
      setProductImages([]);
      setFarmer(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Order Summary" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Order Summary" showBackButton />
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
          <Text style={styles.errorText}>{fetchError ? "Failed to load order" : "Order not found"}</Text>
          {fetchError && <Text style={styles.errorDetail}>{fetchError}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyles(order.status);
  const fruitMeta = getFruitMeta(order.fruit_type);
  
  // Calculate pricing specifically for Farmer
  const uPrice = order.pricing?.unitPrice || order.unitPrice || (order.farmer_share_amount ? (order.farmer_share_amount / order.quantity) : null);
  const basePrice = order.farmer_share_amount || order.pricing?.grossEarning || order.basePrice || 0;
  const serviceCharge = order.platform_fee_amount || order.pricing?.platformFee || order.serviceCharge || 0;
  
  // Total Net Amount to Farmer (Base Price - Platform Fees)
  const finalNetEarning = order.pricing?.farmerEarning || (basePrice - serviceCharge);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header title="Order Summary" showBackButton />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BuyerColors.primaryGreen]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Status & ID Section --- */}
        <View style={styles.section}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.orderIdLabel}>ORDER ID</Text>
              <Text style={styles.orderIdValue}>#{order.id.substring(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg, borderWidth: 1, borderColor: statusStyle.text + '30' }]}> 
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>
          
          <View style={styles.dateGrid}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Placed On</Text>
              <Text style={styles.dateValue}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Accepted On</Text>
              <Text style={styles.dateValue}>{formatDate(order.updated_at || order.created_at)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.solidSeparator} />

        {/* --- Product Details Section --- */}
        <View style={styles.section}>
          <View style={styles.accordionHeader}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Ionicons name="chevron-up" size={20} color="#6B7280" />
          </View>

          <View style={styles.productRow}>  
            <TouchableOpacity
              style={styles.imageWrapper}
              onPress={() => {
                if (productImages.length > 0) {
                  setSelectedImageIndex(0);
                  setImageViewerVisible(true);
                }
              }}
              disabled={productImages.length === 0}
            >
              {productImages.length > 0 ? (
                <>
                  <Image source={{ uri: productImages[0] }} style={styles.productImage} />
                  {productImages.length > 1 && (
                    <View style={styles.imageBadge}>
                      <Text style={styles.imageBadgeText}>+{productImages.length - 1}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: fruitMeta.bg }]}>
                  <Text style={styles.avatarEmoji}>{fruitMeta.emoji}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {order.fruit_type} <Text style={styles.productVariant}>• {order.variant || "All"}</Text>
              </Text>

              <View style={styles.chipContainer}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{order.quantity} kg</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>Grade {order.grade}</Text>
                </View>
              </View>

              <Text style={styles.harvestText}>
                Est. Harvest: <Text style={{ fontWeight: "700", color: "#374151" }}>
                  {formatDate(order.required_date || order.created_at)}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.solidSeparator} />

        {/* --- Location Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.logisticsContainer}>
            {farmer && (
              <View style={styles.logisticsRow}>
                <View style={styles.iconColumn}>
                  <Ionicons name="storefront" size={20} color="#6B7280" />
                  <View style={styles.verticalDottedLine} />
                </View>
                <View style={styles.addressBlock}>
                  <Text style={styles.addressLabel}>Pickup Location</Text>
                  <Text style={styles.addressValue}>{farmer.location ?? "—"}</Text>
                </View>
              </View>
            )}

            <View style={[styles.logisticsRow, { marginTop: farmer ? 0 : 4 }]}> 
              <View style={styles.iconColumn}>
                <Ionicons name="location" size={20} color={BuyerColors.primaryGreen} />
              </View>
              <View style={styles.addressBlock}>
                <Text style={styles.addressLabel}>Delivery Address</Text>
                <Text style={styles.addressValue}>{order.delivery_location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.solidSeparator} />

        {/* --- Payment Summary Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.receiptItems}>
            
            {uPrice ? (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Unit Price</Text>
                <Text style={styles.receiptValue}>Rs. {formatCurrency(uPrice.toString())}</Text>
              </View>
            ) : null}

            {basePrice ? (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Base Price ({order.quantity}kg)</Text>
                <Text style={styles.receiptValue}>Rs. {formatCurrency(basePrice.toString())}</Text>
              </View>
            ) : null}

            {serviceCharge ? (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Service Charge</Text>
                <Text style={styles.receiptValue}>- Rs. {formatCurrency(serviceCharge.toString())}</Text>
              </View>
            ) : null}

            {/* Completely excluded Transport/Delivery fee */}

            <View style={styles.dashedReceiptSeparator} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Total Earnings</Text>
              <Text style={styles.receiptTotalValue}>Rs. {formatCurrency(finalNetEarning.toString())}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Image viewer modal */}
      <Modal visible={imageViewerVisible} transparent={true} animationType="fade" onRequestClose={() => setImageViewerVisible(false)}>
        <View style={styles.modalBg}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setImageViewerVisible(false)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
          {productImages[selectedImageIndex] ? (
            <Image source={{ uri: productImages[selectedImageIndex] }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Perfected UI Styles matching Screenshot ──────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  mainContainer: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 40 },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorText: { marginTop: 12, fontSize: 18, fontWeight: "bold", color: "#6B7280" },
  errorDetail: { marginTop: 8, fontSize: 13, color: "#EF4444", textAlign: "center", paddingHorizontal: 32 },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: "#111827", marginBottom: 16, letterSpacing: -0.2 },

  solidSeparator: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 24, marginHorizontal: 20 },

  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  orderIdLabel: { fontSize: 11, color: "#6B7280", fontWeight: "700", letterSpacing: 0.8, marginBottom: 4 },
  orderIdValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  paymentRefValue: { fontSize: 14, fontWeight: "700", color: "#16A34A", letterSpacing: 0.2 },
  
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },

  dateGrid: { flexDirection: "row", gap: 40 },
  dateItem: {},
  dateLabel: { fontSize: 12, color: "#6B7280", fontWeight: "600", marginBottom: 6 },
  dateValue: { fontSize: 14, fontWeight: "700", color: "#111827" },

  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4, marginBottom: 12 },

  productRow: { flexDirection: "row", alignItems: "center" },
  imageWrapper: { width: 85, height: 85, borderRadius: 12, overflow: "hidden", backgroundColor: "#F9FAFB" },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageBadge: { position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  imageBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  avatarFallback: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  avatarEmoji: { fontSize: 36 },

  productInfo: { flex: 1, marginLeft: 16 },
  productName: { fontSize: 17, fontWeight: "800", color: "#111827", marginBottom: 6 },
  productVariant: { fontSize: 15, fontWeight: "600", color: "#6B7280" },
  chipContainer: { flexDirection: "row", gap: 8, marginBottom: 10 },
  chip: { backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 12, fontWeight: "700", color: "#4B5563" },
  harvestText: { fontSize: 12, color: "#6B7280", fontWeight: "500" },

  logisticsContainer: {},
  logisticsRow: { flexDirection: "row" },
  iconColumn: { alignItems: "center", width: 24, marginRight: 16 },
  verticalDottedLine: { flex: 1, width: 1.5, backgroundColor: "transparent", borderStyle: "dashed", borderWidth: 1, borderColor: "#D1D5DB", marginVertical: 4 },
  addressBlock: { flex: 1, paddingBottom: 16, justifyContent: "flex-start", paddingTop: 2 },
  addressLabel: { fontSize: 12, color: "#6B7280", fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  addressValue: { fontSize: 15, color: "#111827", fontWeight: "600", lineHeight: 22 },

  receiptItems: { gap: 12, marginBottom: 16 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between" },
  receiptLabel: { fontSize: 14, color: "#4B5563", fontWeight: "500" },
  receiptValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
  dashedReceiptSeparator: { height: 1, borderTopWidth: 1, borderStyle: "dashed", borderColor: "#D1D5DB", marginVertical: 8 },
  receiptTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  receiptTotalLabel: { fontSize: 16, fontWeight: "800", color: "#111827" },
  receiptTotalValue: { fontSize: 18, fontWeight: "900", color: BuyerColors.primaryGreen },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  modalClose: { position: "absolute", top: 50, right: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  fullImage: { width: Dimensions.get("window").width, height: Dimensions.get("window").height - 120 },
});