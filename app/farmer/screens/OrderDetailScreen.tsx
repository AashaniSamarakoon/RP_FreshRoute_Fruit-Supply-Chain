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
  return { emoji: "📦", bg: "#F3F4F6", text: "#6B7280" };
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "AWAITING_PAYMENT":
    case "UNPAID":
      return { bg: "#FEF2F2", text: "#EF4444", label: "Awaiting Payment" };
    case "AUTHORIZED_PAYMENT":
      return { bg: "#FEF2F2", text: "#F59E0B", label: "Authorized" };
    case "OPEN":
    case "PENDING_BUYER":
    case "PENDING_FARMER":
      return { bg: "#FFF7ED", text: "#F97316", label: "Pending" };
    case "MATCHED":
      return { bg: "#EEF2FF", text: "#6366F1", label: "Matched" };
    case "PAID_PENDING_DELIVERY":
    case "IN_TRANSIT":
      return { bg: "#EFF6FF", text: "#3B82F6", label: "In Transit" };
    case "PACKING":
    case "READY_FOR_PICKUP":
      return { bg: "#EFF6FF", text: "#3B82F6", label: status.replace(/_/g, " ") };
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
  const params = useLocalSearchParams<{
    orderId: string;
    farmerPickup?: string;
  }>();
  const router = useRouter();
  // flag indicates we’re rendering for a farmer; used to switch API paths &
  // disable buyer-only UI (payments, preapproval, etc.)
  const isFarmerScreen = true;
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [farmer, setFarmer] = useState<FarmerInfo | null>(null);
  const [transporter, setTransporter] = useState<TransporterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [harvestDate, setHarvestDate] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── accordion + proof-of-harvest state ──
  // Start expanded; collapse automatically once the order is paid and in-transit
  const [productDetailExpanded, setProductDetailExpanded] = useState(true);
  const [farmerCoords, setFarmerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [harvestProofImages, setHarvestProofImages] = useState<string[]>([]);
  const [proofViewerVisible, setProofViewerVisible] = useState(false);
  const [proofViewerIndex, setProofViewerIndex] = useState(0);


  useEffect(() => {
    if (params.orderId) fetchOrderDetails();
  }, [params.orderId]);

  // Collapse product details accordion once the order moves to IN_TRANSIT or beyond
  useEffect(() => {
    if (!order?.status) return;
    const trackableStatuses = [
      "PAID_PENDING_DELIVERY",
      "IN_TRANSIT",
      "DELIVERED",
      "COMPLETED",
    ];
    if (trackableStatuses.includes(order.status)) {
      setProductDetailExpanded(false);
    } else {
      setProductDetailExpanded(true);
    }
  }, [order?.status]);


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

      // parse farmerPickup param for both roles (farmers pass this too)
      let data: any;
      let passedFarmerPickup: any = null;
      if ((params as any).farmerPickup) {
        try {
          passedFarmerPickup = JSON.parse((params as any).farmerPickup);
          console.log(
            "Using farmerPickup from navigation params:",
            passedFarmerPickup,
          );
        } catch (e) {
          console.warn("Failed to parse farmerPickup from params:", e);
        }
      }
      // always use farmer endpoint in this screen
      const all: any = await api.get(`/api/farmer/orders`);
      const arr: any[] = Array.isArray(all) ? all : (all?.orders ?? all ?? []);
      const found = arr.find((o) => String(o.id) === String(params.orderId));
      if (!found) throw new Error("Order not found");
      data = { order: found };

      console.log("Order details response:", data);
      const orderData = data.order || {};
      const merged: any = { ...orderData };

      const camelToSnake: Record<string, string> = {
        unitPrice: "unit_price",
        basePrice: "base_price",
        serviceCharge: "service_charge",
        deliveryFee: "delivery_fee",
        totalPrice: "total_price",
        deliveryType: "delivery_type",
      };

      Object.entries(camelToSnake).forEach(([camel, snake]) => {
        const val =
          data[camel] ?? data[snake] ?? orderData[camel] ?? orderData[snake];
        if (val !== undefined && val !== null) merged[camel] = val;
      });
      setOrder(merged || null);

      if (data.farmer) {
        const userData = data.farmer.user || data.farmer.users || {};
        // Use passed farmerPickup if available, otherwise from API
        const pickup = passedFarmerPickup ?? data.farmerPickup ?? {};
        setFarmer({
          id: data.farmer.id,
          name: userData?.name || userData?.full_name || "Unknown",
          phone: userData?.phone || "",
          rating: undefined,
          location: pickup.location || data.farmer.location || undefined,
        });
        // Prefer farmerPickup coords, fall back to farmer-level coords
        const lat = pickup.latitude ?? data.farmer.latitude;
        const lng = pickup.longitude ?? data.farmer.longitude;
        if (lat && lng) {
          setFarmerCoords({
            latitude: Number(lat),
            longitude: Number(lng),
          });
        }
      }

      if (data.productImages?.length > 0) {
        setProductImages(
          Array.isArray(data.productImages)
            ? data.productImages
            : [data.productImages],
        );
      } else if (orderData?.product_images) {
        setProductImages(
          Array.isArray(orderData.product_images)
            ? orderData.product_images
            : [orderData.product_images],
        );
      } else {
        setProductImages([]);
      }

      setHarvestDate(
        data.harvestDate ||
        orderData?.harvest_date ||
        orderData?.estimated_harvest_date ||
        null,
      );

      // Harvest proof images
      const rawProof =
        orderData.harvest_proof_images ??
        orderData.proof_images ??
        orderData.grading_images ??
        null;
      setHarvestProofImages(
        Array.isArray(rawProof) ? rawProof : rawProof ? [rawProof] : [],
      );

    } catch (error: any) {
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




  // no live-tracking for farmers
  const isOrderTrackable = false;

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

  const primaryAction = null; // no primary action on farmer screen
  const statusStyle = getStatusStyles(order.status);
  const fruitMeta = getFruitMeta(order.fruit_type);

  // display a meaningful payment reference; ignore a literal "0" coming from DB
  const displayPaymentRef = (() => {
    if (!order) return null;
    const v = order.payhere_payment_id;
    if (v && v !== "0") return v;
    return null;
  })();

  // --- Actual map coordinates (fall back to Colombo area if DB has none) ---

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header title="Order Summary" showBackButton />

      <View style={styles.mainContainer}>
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
              {displayPaymentRef ? (
                <View>
                  <Text style={styles.orderIdLabel}>PAYMENT REF</Text>
                  <Text style={styles.paymentRefValue}>{displayPaymentRef}</Text>
                </View>
              ) : null}
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

          <View style={styles.solidSeparator} />

          {/* Section: Product Detail — collapsible accordion */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setProductDetailExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Product Details
              </Text>
              <Ionicons
                name={productDetailExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {productDetailExpanded && (
              <View style={[styles.productRow, { marginTop: 16 }]}>
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
            )}
          </View>

          <View style={styles.solidSeparator} />

          {/* Section: Proof of Harvest — visible from IN_TRANSIT onwards */}
          {isOrderTrackable && (
            <>
              <View style={styles.section}>
                <View style={styles.accordionHeader}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                    Proof of Harvest
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color="#16A34A"
                    />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                {harvestProofImages.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.proofImagesRow}
                  >
                    {harvestProofImages.map((uri, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.proofThumb}
                        activeOpacity={0.8}
                        onPress={() => {
                          setProofViewerIndex(idx);
                          setProofViewerVisible(true);
                        }}
                      >
                        <Image source={{ uri }} style={styles.proofThumbImg} />
                        {idx === 0 && (
                          <View style={styles.proofVerifiedPin}>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#16A34A"
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.proofEmptyState}>
                    <Ionicons name="images-outline" size={36} color="#D1D5DB" />
                    <Text style={styles.proofEmptyText}>
                      Harvest proof images will appear here
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.solidSeparator} />
            </>
          )}

          {/* Section: Logistics */}
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
                    <Text style={styles.addressValue}>
                      {farmer.location ?? "—"}
                    </Text>
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
                <Text style={styles.receiptLabel}>Unit Price</Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(order.unitPrice)}
                </Text>
              </View>
            )}
            {(() => {
              const basePrice =
                order.basePrice ??
                (order.unitPrice != null
                  ? order.unitPrice * order.quantity
                  : null);
              return basePrice != null ? (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>
                    Base Price ({order.quantity}kg)
                  </Text>
                  <Text style={styles.receiptValue}>
                    Rs. {formatCurrency(basePrice)}
                  </Text>
                </View>
              ) : null;
            })()}
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
                <Text
                  style={styles.receiptValue}
                >{`Rs. ${formatCurrency(order.deliveryFee)}`}</Text>
              </View>
            )}

            <View style={styles.dashedReceiptSeparator} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Total Amount</Text>
              <Text style={styles.receiptTotalValue}>
                Rs.{" "}
                {order.totalPrice ? formatCurrency(order.totalPrice) : "N/A"}
              </Text>
            </View>
          </View>

          {/* Action Buttons - Now Full Width */}
        </View>
      </View>


      {/* Product Image Viewer Modal */}
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

      {/* Proof of Harvest Image Viewer Modal */}
      <Modal
        visible={proofViewerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setProofViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {/* Verified overlay badge */}
          <View style={styles.proofModalBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.proofModalBadgeText}>Harvest Verified</Text>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width,
              );
              setProofViewerIndex(idx);
            }}
          >
            {harvestProofImages.map((uri, index) => (
              <View key={index} style={styles.fullImageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          {harvestProofImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {proofViewerIndex + 1} / {harvestProofImages.length}
              </Text>
            </View>
          )}
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

  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  solidSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
    marginHorizontal: 20,
  },

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
  paymentRefValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#16A34A",
    letterSpacing: 0.2,
  },
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

  fixedBottomPanel: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "bold", color: "#ffffff" },
  primaryBtnScheduled: {
    backgroundColor: "#166534",
    opacity: 0.9,
  },
  primaryBtnScheduledText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },

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

  // --- Accordion Header ---
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  // --- Proof of Harvest ---
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  proofImagesRow: {
    gap: 10,
    paddingVertical: 16,
  },
  proofThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  proofThumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  proofVerifiedPin: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 1,
  },
  proofEmptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  proofEmptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
  proofModalBadge: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240,253,244,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  proofModalBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },

  // --- Mini Map (Track Your Order) ---
  miniMapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  miniMapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: "flex-end",
  },
  miniMapTrackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  miniMapTrackText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
