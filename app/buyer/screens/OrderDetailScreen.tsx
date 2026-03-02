import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { FarmerInfo, PlacedOrder, TransporterInfo } from "@/types";
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
  if (f.includes("banana"))
    return { emoji: "🍌", bg: "#FEF9C3", text: "#CA8A04" };
  if (f.includes("mango"))
    return { emoji: "🥭", bg: "#FFEDD5", text: "#EA580C" };
  if (f.includes("pineapple"))
    return { emoji: "🍍", bg: "#FEF08A", text: "#A16207" };
  if (f.includes("papaya"))
    return { emoji: "🥥", bg: "#FFEDD5", text: "#EA580C" };
  return { emoji: "📦", bg: "#F3F4F6", text: "#6B7280" };
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "AWAITING_PAYMENT":
    case "UNPAID":
      return { bg: "#FEF2F2", text: "#EF4444", label: "Awaiting Payment" };
    case "OPEN":
    case "PENDING_BUYER":
    case "PENDING_FARMER":
      return { bg: "#FFF7ED", text: "#F97316", label: "Pending" };
    case "MATCHED":
      return { bg: "#EEF2FF", text: "#6366F1", label: "Matched" };
    case "PAID_PENDING_DELIVERY":
    case "IN_TRANSIT":
      return { bg: "#EFF6FF", text: "#3B82F6", label: "In Transit" };
    case "DELIVERED":
    case "COMPLETED":
      return { bg: "#F0FDF4", text: "#22C55E", label: "Completed" };
    case "CANCELLED":
      return { bg: "#F3F4F6", text: "#6B7280", label: "Cancelled" };
    default:
      return {
        bg: "#F3F4F6",
        text: "#6B7280",
        label: status?.replace(/_/g, " ") || "Unknown",
      };
  }
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [farmer, setFarmer] = useState<FarmerInfo | null>(null);
  const [transporter, setTransporter] = useState<TransporterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bankDetailsVisible, setBankDetailsVisible] = useState(false);
  const [harvestDate, setHarvestDate] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (params.orderId) fetchOrderDetails();
  }, [params.orderId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (params.orderId && !loading) fetchOrderDetails(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [params.orderId, loading]);

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setFetchError(null);
      if (!params.orderId) throw new Error("No orderId provided");

      let data: any = await api.get(
        `/api/buyer/place-order/details/${params.orderId}`,
      );
      console.log("[OrderDetail] raw response:", JSON.stringify(data, null, 2));

      const orderData = data.order || {};
      const merged: any = { ...orderData };

      // Backend may return pricing fields at top-level (camelCase or snake_case)
      // or nested inside data.order. Check all variants so nothing is missed.
      const camelToSnake: Record<string, string> = {
        unitPrice: "unit_price",
        basePrice: "base_price",
        serviceCharge: "service_charge",
        deliveryFee: "delivery_fee",
        totalPrice: "total_price",
        deliveryType: "delivery_type",
      };
      Object.entries(camelToSnake).forEach(([camel, snake]) => {
        // priority: top-level camelCase → top-level snake_case → order.camelCase → order.snake_case
        const val =
          data[camel] ?? data[snake] ?? orderData[camel] ?? orderData[snake];
        if (val !== undefined && val !== null) merged[camel] = val;
      });
      setOrder(merged || null);

      if (data.farmer) {
        const userData = data.farmer.user || data.farmer.users || {};
        setFarmer({
          id: data.farmer.id,
          name: userData?.name || userData?.full_name || "Unknown",
          phone: userData?.phone || "",
          rating: undefined,
          location: data.farmer.location || undefined,
        });
      }

      if (orderData?.product_images) {
        setProductImages(
          Array.isArray(orderData.product_images)
            ? orderData.product_images
            : [orderData.product_images],
        );
      } else {
        setProductImages([]);
      }

      setHarvestDate(
        orderData?.harvest_date || orderData?.estimated_harvest_date || null,
      );
    } catch (error: any) {
      console.error("[OrderDetail] fetch error:", error?.message || error);
      setFetchError(error?.message || "Failed to load order details");
      setOrder(null);
      setProductImages([]);
      setFarmer(null);
      setTransporter(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const getPrimaryAction = () => {
    if (!order) return null;
    switch (order.status) {
      case "AWAITING_PAYMENT":
        return {
          label: "Upload Payment Slip",
          icon: "cloud-upload-outline",
          onPress: () =>
            router.push({
              pathname: "/buyer/upload-payment" as any,
              params: { orderId: order.id },
            }),
        };
      case "IN_TRANSIT":
        return {
          label: "Track Delivery",
          icon: "navigate-circle-outline",
          onPress: () =>
            router.push({
              pathname: "/buyer/track-delivery" as any,
              params: { orderId: order.id },
            }),
        };
      case "DELIVERED":
        return {
          label: "Confirm Receipt",
          icon: "checkmark-done-circle-outline",
          onPress: () => {},
        };
      default:
        return null;
    }
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
          <Text style={styles.errorText}>
            {fetchError ? "Failed to load order" : "Order not found"}
          </Text>
          {fetchError && <Text style={styles.errorDetail}>{fetchError}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const primaryAction = getPrimaryAction();
  const statusStyle = getStatusStyles(order.status);
  const fruitMeta = getFruitMeta(order.fruit_type);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header title="Order Summary" showBackButton />

      <View style={styles.mainContainer}>
        {/* --- SCROLLABLE CONTENT --- */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BuyerColors.primaryGreen]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Order Status & ID */}
          <View style={styles.section}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.orderIdLabel}>ORDER ID</Text>
                <Text style={styles.orderIdValue}>
                  #{order.id.substring(0, 8).toUpperCase()}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>

            <View style={styles.dateGrid}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Placed On</Text>
                <Text style={styles.dateValue}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
              {order.farmer_accepted_at && (
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Accepted On</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(order.farmer_accepted_at)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Solid Separator */}
          <View style={styles.solidSeparator} />

          {/* Section: Product Detail */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Details</Text>
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
                    <Image
                      source={{ uri: productImages[0] }}
                      style={styles.productImage}
                    />
                    {productImages.length > 1 && (
                      <View style={styles.imageBadge}>
                        <Text style={styles.imageBadgeText}>
                          +{productImages.length - 1}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      { backgroundColor: fruitMeta.bg },
                    ]}
                  >
                    <Text style={styles.avatarEmoji}>{fruitMeta.emoji}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {order.fruit_type}{" "}
                  <Text style={styles.productVariant}>• {order.variant}</Text>
                </Text>

                <View style={styles.chipContainer}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{order.quantity} kg</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>Grade {order.grade}</Text>
                  </View>
                </View>

                {harvestDate && (
                  <Text style={styles.harvestText}>
                    Est. Harvest:{" "}
                    <Text style={{ fontWeight: "600", color: "#374151" }}>
                      {formatDate(harvestDate)}
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Solid Separator */}
          <View style={styles.solidSeparator} />

          {/* Section: Logistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>

            <View style={styles.logisticsContainer}>
              {farmer && order.status === "AWAITING_PAYMENT" && (
                <View style={styles.logisticsRow}>
                  <View style={styles.iconColumn}>
                    <Ionicons name="storefront" size={20} color="#6B7280" />
                    <View style={styles.verticalDottedLine} />
                  </View>
                  <View style={styles.addressBlock}>
                    <Text style={styles.addressLabel}>Pickup Location</Text>
                    <Text style={styles.addressValue}>{farmer.location}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.logisticsRow, { marginTop: 4 }]}>
                <View style={styles.iconColumn}>
                  <Ionicons
                    name="location"
                    size={20}
                    color={BuyerColors.primaryGreen}
                  />
                </View>
                <View style={styles.addressBlock}>
                  <Text style={styles.addressLabel}>Delivery Address</Text>
                  <Text style={styles.addressValue}>
                    {order.delivery_location}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* --- FIXED BOTTOM SECTION --- */}
        <View style={styles.fixedBottomPanel}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>

          <View style={styles.receiptItems}>
            {order.unitPrice != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>
                  Unit Price ({order.quantity}kg)
                </Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(order.unitPrice)}
                </Text>
              </View>
            )}
            {order.basePrice != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Base Price</Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(order.basePrice)}
                </Text>
              </View>
            )}
            {order.serviceCharge != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Service Charge</Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(order.serviceCharge)}
                </Text>
              </View>
            )}
            {order.deliveryFee != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Fee</Text>
                <Text style={styles.receiptValue}>
                  {`Rs. ${formatCurrency(order.deliveryFee)}`}
                </Text>
              </View>
            )}

            {/* The ONLY dashed line, strictly for the payment total separator */}
            <View style={styles.dashedReceiptSeparator} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Total Amount</Text>
              <Text style={styles.receiptTotalValue}>
                Rs.{" "}
                {order.totalPrice ? formatCurrency(order.totalPrice) : "N/A"}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {primaryAction && (
            <View style={styles.actionContainer}>
              {order.status === "AWAITING_PAYMENT" && (
                <TouchableOpacity
                  onPress={() => setBankDetailsVisible(true)}
                  style={styles.secondaryBtn}
                >
                  <Ionicons name="business-outline" size={18} color="#4B5563" />
                  <Text style={styles.secondaryBtnText}>Bank Details</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={primaryAction.onPress}
              >
                <Ionicons
                  name={primaryAction.icon as any}
                  size={20}
                  color="#fff"
                />
                <Text style={styles.primaryBtnText}>{primaryAction.label}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* --- Modals --- */}
      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width,
              );
              setSelectedImageIndex(idx);
            }}
          >
            {productImages.map((uri, index) => (
              <View key={index} style={styles.fullImageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          {productImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedImageIndex + 1} / {productImages.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        visible={bankDetailsVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.bottomSheetBg}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Bank Transfer Details</Text>
              <TouchableOpacity
                onPress={() => setBankDetailsVisible(false)}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetContent}>
              <View style={styles.bankWarning}>
                <Ionicons name="information-circle" size={20} color="#CA8A04" />
                <Text style={styles.bankWarningText}>
                  Use Order{" "}
                  <Text style={{ fontWeight: "bold" }}>
                    #{order?.id.substring(0, 8).toUpperCase()}
                  </Text>{" "}
                  as the reference.
                </Text>
              </View>

              <View style={styles.bankCard}>
                <Text style={styles.bankName}>Commercial Bank of Ceylon</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Name:</Text>
                  <Text style={styles.bankVal}>FreshRoute Pvt Ltd</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account:</Text>
                  <Text style={styles.bankVal}>1234567890</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Branch:</Text>
                  <Text style={styles.bankVal}>Colombo Main (001)</Text>
                </View>
              </View>

              <View style={styles.bankCard}>
                <Text style={styles.bankName}>Sampath Bank PLC</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Name:</Text>
                  <Text style={styles.bankVal}>FreshRoute Pvt Ltd</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account:</Text>
                  <Text style={styles.bankVal}>5647382910</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Branch:</Text>
                  <Text style={styles.bankVal}>Galle Road (125)</Text>
                </View>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  mainContainer: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 24 },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B7280",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 32,
  },

  // Sections
  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  // Solid Separator for general sections
  solidSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB", // Solid light gray line
    marginVertical: 24,
    marginHorizontal: 20,
  },

  // Status & Top Data
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderIdValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },

  dateGrid: { flexDirection: "row", gap: 32 },
  dateItem: {},
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  dateValue: { fontSize: 14, fontWeight: "700", color: "#374151" },

  // Product Row
  productRow: { flexDirection: "row", alignItems: "center" },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 36 },

  productInfo: { flex: 1, marginLeft: 16 },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  productVariant: { fontSize: 15, fontWeight: "500", color: "#6B7280" },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  harvestText: { fontSize: 13, color: "#6B7280" },

  // Logistics
  logisticsContainer: {},
  logisticsRow: { flexDirection: "row" },
  iconColumn: { alignItems: "center", width: 24, marginRight: 16 },
  verticalDottedLine: {
    flex: 1,
    width: 2,
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginVertical: 4,
  },
  addressBlock: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  addressLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    lineHeight: 22,
  },

  // --- Fixed Bottom Panel Styles ---
  fixedBottomPanel: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 20,
    // Add shadow to emphasize it sits above the scroll view
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },

  receiptItems: { gap: 10, marginBottom: 16 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between" },
  receiptLabel: { fontSize: 14, color: "#4B5563" },
  receiptValue: { fontSize: 14, color: "#111827", fontWeight: "500" },

  // The strictly requested dashed separator for the payment total
  dashedReceiptSeparator: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    marginVertical: 6,
  },

  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: BuyerColors.primaryGreen,
  },

  actionContainer: { flexDirection: "row", gap: 12 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "700", color: "#4B5563" },
  primaryBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "bold", color: "#ffffff" },

  // --- Modals (Unchanged) ---
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "100%", height: "100%" },
  imageCounter: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  bottomSheetBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sheetTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  sheetClose: {
    width: 32,
    height: 32,
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetContent: { padding: 20 },

  bankWarning: {
    flexDirection: "row",
    backgroundColor: "#FEF9C3",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
    gap: 8,
  },
  bankWarningText: { flex: 1, fontSize: 13, color: "#854D0E" },

  bankCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bankName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  bankRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bankLabel: { fontSize: 13, color: "#6B7280" },
  bankVal: { fontSize: 13, color: "#111827", fontWeight: "600" },
});
