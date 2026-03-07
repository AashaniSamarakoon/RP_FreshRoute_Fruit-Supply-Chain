import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  PackageSearch,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import ErrorModal from "../../../components/modals/ErrorModal";
import SuccessModal from "../../../components/modals/SuccessModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MatchedStock {
  id: string;
  stockId: string;
  orderId: string;
  farmerId: string;
  farmerName: string;
  fruitType: string;
  category: string;
  quantity: number;
  orderQuantity: number;
  availableUnit: string;
  grade: string;
  quality: string;
  farmLocation: string;
  distance: number;
  trustScore: string;
  estimatedHarvestDate?: string;
  imageUrls: string[];
  status: string;
  pricePerKg: number | null;
  pricing: {
    unitPrice: number;
    basePrice: number;
    serviceCharge: number;
    deliveryFee: number;
    estimatedTotal: number;
  } | null;
}

interface OrderGroup {
  orderId: string;
  fruitType: string;
  category: string;
  orderQuantity: number;
  data: MatchedStock[]; 
}

// --- Helpers ---
const getFruitMeta = (fruit: string) => {
  const f = fruit?.toLowerCase() || "";
  if (f.includes("banana")) return { emoji: "🍌", bg: "#FEF9C3", text: "#CA8A04" };
  if (f.includes("mango")) return { emoji: "🥭", bg: "#FFEDD5", text: "#EA580C" };
  if (f.includes("pineapple")) return { emoji: "🍍", bg: "#FEF08A", text: "#A16207" };
  return { emoji: "📦", bg: "#F3F4F6", text: "#6B7280" };
};

export default function MatchedStocksScreen() {
  const router = useRouter();
  const { orderId: orderIdParam } = useLocalSearchParams<{
    orderId?: string;
  }>();
  const isPerOrderMode = !!orderIdParam;

  const [groupedStocks, setGroupedStocks] = useState<OrderGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<MatchedStock | null>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [fetchId, setFetchId] = useState<string | null>(orderIdParam || null);
  const [approvingProposals, setApprovingProposals] = useState<Set<string>>(new Set());

  // Image modal state
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const resolveFetchId = useCallback(async () => {
    if (orderIdParam) {
      setFetchId(orderIdParam);
      return;
    }
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (!userStr) {
        setError("Authentication failed. Please log in again.");
        setLoading(false);
        return;
      }
      const user = JSON.parse(userStr);
      setFetchId(user.id);
    } catch (err) {
      setError("Failed to identify buyer. Please try again.");
      setLoading(false);
    }
  }, [orderIdParam]);

  useFocusEffect(
    useCallback(() => {
      resolveFetchId();
    }, [resolveFetchId]),
  );

  useEffect(() => {
    const fetchMatchedStocks = async () => {
      try {
        setError(null);
        setLoading(true);

        if (!fetchId) return;

        const apiUrl = isPerOrderMode
          ? `/api/buyer/matching/order/${fetchId}`
          : `/api/buyer/matching/${fetchId}`;
        
        let data: any;
        try {
          data = await api.get(apiUrl);
        } catch (err: any) {
          setError(err.message || "Failed to load matched stocks");
          setLoading(false);
          return;
        }

        let matches: any[] = [];
        if (data?.proposals && Array.isArray(data.proposals)) {
          matches = data.proposals;
        } else if (data?.matches && Array.isArray(data.matches)) {
          matches = data.matches;
        } else if (data?.data && Array.isArray(data.data)) {
          matches = data.data;
        } else if (Array.isArray(data)) {
          matches = data;
        }

        if (matches.length === 0) {
          setGroupedStocks([]);
          setLoading(false);
          return;
        }

        // Transform data
        const transformedStocks = matches
          .map((item: any) => {
            const stock = item.stock || {};
            const farmer = stock.farmer || {};
            const order = item.order || {};

            if (!stock?.id || !item.id) return null;

            return {
              id: item.id,
              stockId: stock.id,
              orderId: order.id || "Unknown Order",
              farmerId: farmer?.user?.id || farmer?.id || "",
              farmerName: farmer?.user?.first_name + " " + farmer?.user?.last_name,
              fruitType: order.fruit_type || stock.fruit_type || "Fruit",
              category: order.variant || stock.variant || "Unknown",
              quantity: parseInt(item.quantity_proposed ?? stock.quantity ?? 0, 10),
              orderQuantity: parseInt(order.quantity || 0, 10),
              availableUnit: "kg",
              grade: stock.grade || "A",
              quality: stock.quality || "Premium",
              farmLocation: farmer?.location || "Unknown Location",
              distance: item.distance_km || 0,
              trustScore: farmer?.reputation ? `${farmer.reputation}/5` : "Not rated",
              estimatedHarvestDate: stock.estimated_harvest_date,
              imageUrls: stock.image_url || [],
              status: item.status || "PENDING",
              pricePerKg: stock.price_per_kg != null ? Number(stock.price_per_kg) : null,
              pricing: item.pricing
                ? {
                    unitPrice: Number(item.pricing.unitPrice),
                    basePrice: Number(item.pricing.basePrice),
                    serviceCharge: Number(item.pricing.serviceCharge),
                    deliveryFee: Number(item.pricing.deliveryFee),
                    estimatedTotal: Number(item.pricing.estimatedTotal),
                  }
                : null,
            };
          })
          .filter((item) => item !== null) as MatchedStock[];

        // Group by Order
        const groupedData = transformedStocks.reduce(
          (acc: Record<string, OrderGroup>, curr) => {
            if (!acc[curr.orderId]) {
              acc[curr.orderId] = {
                orderId: curr.orderId,
                fruitType: curr.fruitType,
                category: curr.category,
                orderQuantity: curr.orderQuantity,
                data: [], 
              };
            }
            acc[curr.orderId].data.push(curr);
            return acc;
          },
          {},
        );

        setGroupedStocks(Object.values(groupedData));
        setError(null);
        setLoading(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load matched stocks.");
        setGroupedStocks([]);
        setLoading(false);
      }
    };

    if (fetchId) {
      fetchMatchedStocks();
    }
  }, [fetchId]);

  const navigateToProfile = (item: MatchedStock) => {
    router.push({
      pathname: `/buyer/screens/trust-profile/${item.farmerId}` as any,
      params: {
        farmerName: item.farmerName,
        farmLocation: item.farmLocation,
        trustScore: item.trustScore,
        imageUrls: item.imageUrls?.join(",") || "",
      },
    });
  };

  const handleApproveProposal = async (item: MatchedStock) => {
    try {
      setApprovingProposals((prev) => new Set(prev).add(item.id));
      await api.post(`/api/buyer/matching/approve/${item.id}`, {});

      setGroupedStocks((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          data: group.data.map((stock) =>
            stock.id === item.id ? { ...stock, status: "PENDING_FARMER" } : stock,
          ),
        })),
      );

      setSuccessModalVisible(true);
      setSelectedStock(item);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve proposal");
      setErrorModalVisible(true);
    } finally {
      setApprovingProposals((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // --- PREMIUM UI RENDER ---

  const renderStockCard = ({ item }: { item: MatchedStock }) => {
    const fruitMeta = getFruitMeta(item.fruitType);
    const isApproving = approvingProposals.has(item.id);

    return (
      <View style={styles.stockCard}>
        {/* Card Header (Farmer CRM Style) */}
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          onPress={() => navigateToProfile(item)}
        >
          <View style={styles.headerLeft}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.farmerAvatarText}>
                {item.farmerName ? item.farmerName.charAt(0).toUpperCase() : "F"}
              </Text>
              <View style={styles.verifiedBadgeDot}>
                <ShieldCheck size={10} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.farmerInfo}>
              <Text style={styles.farmerName}>{item.farmerName}</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.farmLocation} • {item.distance.toFixed(1)} km
                </Text>
              </View>
            </View>
          </View>

          <ChevronRight size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <View style={styles.solidDivider} />

        {/* Card Body (Product Details) */}
        <View style={styles.productBody}>
          {/* Image */}
          <TouchableOpacity
            style={styles.imageWrapper}
            activeOpacity={0.8}
            onPress={() => {
              if (item.imageUrls.length > 0) {
                setCurrentImages(item.imageUrls);
                setCurrentImageIndex(0);
                setImageModalVisible(true);
              }
            }}
            disabled={item.imageUrls.length === 0}
          >
            {item.imageUrls.length > 0 ? (
              <>
                <Image source={{ uri: item.imageUrls[0] }} style={styles.productImage} />
                {item.imageUrls.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <ImageIcon size={10} color="#fff" style={{ marginRight: 2 }} />
                    <Text style={styles.imageCountText}>+{item.imageUrls.length - 1}</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: fruitMeta.bg }]}>
                <Text style={styles.avatarEmoji}>{fruitMeta.emoji}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Details */}
          <View style={styles.productInfo}>
            
            {/* Tag Row (Yield, Grade, and Harvest together) */}
            <View style={styles.tagRow}>
              <View style={styles.yieldTag}>
                <Text style={styles.yieldTagText}>
                  Yield: {item.quantity}{item.availableUnit}
                </Text>
              </View>
              
              <View style={styles.gradeTag}>
                <Text style={styles.gradeTagText}>Grade {item.grade}</Text>
              </View>

              {item.estimatedHarvestDate && (
                <View style={styles.harvestTag}>
                  <Calendar size={12} color="#4B5563" style={{ marginRight: 4 }} />
                  <Text style={styles.harvestTagText}>
                    {new Date(item.estimatedHarvestDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                </View>
              )}
            </View>

            {/* Minimalist Total Pricing Box */}
            {item.pricing && (
              <View style={styles.invoiceBox}>
                <View style={styles.invoiceRow}>
                  <View>
                    <Text style={styles.invoiceTotalLabel}>Estimated Total</Text>
                    <Text style={styles.invoiceSubLabel}>Inc. service & delivery</Text>
                  </View>
                  <Text style={styles.invoiceTotalValue}>
                    Rs. {item.pricing.estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            )}

          </View>
        </View>

        {/* Card Footer (Actions) */}
        <View style={styles.cardFooter}>
          {item.status === "PENDING_BUYER" ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleApproveProposal(item)}
              disabled={isApproving}
              activeOpacity={0.8}
            >
              {isApproving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Approve Proposal</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.statusContainer,
                item.status === "PENDING_FARMER" && styles.statusWarning,
                item.status === "ACCEPTED" && styles.statusSuccess,
                item.status === "REJECTED" && styles.statusError,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status === "PENDING_FARMER" && styles.statusWarningText,
                  item.status === "ACCEPTED" && styles.statusSuccessText,
                  item.status === "REJECTED" && styles.statusErrorText,
                ]}
              >
                {item.status === "PENDING_FARMER" ? "Waiting for Farmer Confirmation"
                  : item.status === "ACCEPTED" ? "Deal Accepted"
                  : item.status === "REJECTED" ? "Proposal Rejected"
                  : item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header
        title={
          isPerOrderMode
            ? `Proposals for Order #${(orderIdParam || "").substring(0, 8).toUpperCase()}`
            : "All Matched Deals"
        }
        onBack={() => router.back()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Analyzing market matches...</Text>
        </View>
      ) : groupedStocks.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyCircle}>
            <PackageSearch size={32} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No Proposals Yet</Text>
          <Text style={styles.emptyMessage}>
            Farmers are currently reviewing your orders. We will notify you the
            moment a farmer offers a match.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={groupedStocks}
          keyExtractor={(item) => item.id}
          renderItem={renderStockCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
        />
      )}

      {/* Image Gallery Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)} statusBarTranslucent>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setImageModalVisible(false)} activeOpacity={0.7}>
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          {currentImages.length > 1 && (
            <Text style={styles.imageModalCounter}>{currentImageIndex + 1} / {currentImages.length}</Text>
          )}
          <FlatList
            data={currentImages} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentImageIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            renderItem={({ item: uri }) => (
              <View style={styles.imageModalPage}>
                <Image source={{ uri }} style={styles.imageModalFull} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Success/Error Modals */}
      <SuccessModal
        visible={successModalVisible}
        onClose={() => { setSuccessModalVisible(false); setSelectedStock(null); }}
        title="Proposal Approved"
        message={selectedStock ? `You have approved the proposal from ${selectedStock.farmerName}. Awaiting farmer's final confirmation.` : ""}
        buttonText="Got it"
        onButtonPress={() => { setSuccessModalVisible(false); setSelectedStock(null); }}
      />
      <ErrorModal
        visible={errorModalVisible}
        onClose={() => { setErrorModalVisible(false); setError(null); }}
        title="Error"
        message={error || "An unexpected error occurred"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptyMessage: { fontSize: 15, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  listContent: { paddingTop: 16, paddingBottom: 40 },

  // --- NEW CARD UI ---
  stockCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  // Header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  farmerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    position: "relative",
  },
  farmerAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2E7D32",
  },
  verifiedBadgeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  farmerInfo: { flex: 1, paddingRight: 8 },
  farmerName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  // Divider
  solidDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },

  // Body
  productBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  imageWrapper: {
    width: 96, // Enlarged to perfectly match right-side content height
    height: 96, // Enlarged to perfectly match right-side content height
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageCountBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  imageCountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  avatarFallback: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  avatarEmoji: { fontSize: 32 },

  productInfo: { flex: 1, marginLeft: 16 },
  
  // Tags
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap", // Safely wraps if the phone screen is narrow
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  yieldTag: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  yieldTagText: { fontSize: 12, fontWeight: "700", color: "#059669" },
  gradeTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  gradeTagText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  
  harvestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  harvestTagText: { 
    fontSize: 12, 
    fontWeight: "600", 
    color: "#4B5563" 
  },

  // Minimalist Pricing Box
  invoiceBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 4,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceTotalLabel: { fontSize: 13, color: "#4B5563", fontWeight: "700" },
  invoiceSubLabel: { 
    fontSize: 11, 
    color: "#9CA3AF", 
    fontWeight: "500", 
    marginTop: 2 
  },
  invoiceTotalValue: { fontSize: 18, color: "#2E7D32", fontWeight: "900" },

  // Footer Actions
  cardFooter: { marginTop: 4 },
  primaryButton: {
    backgroundColor: "#2E7D32", // Forest Green
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },

  // Status Indicator States
  statusContainer: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  statusWarning: { backgroundColor: "#FFFBEB", borderColor: "#FEF08A" },
  statusWarningText: { color: "#B45309" },
  statusSuccess: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  statusSuccessText: { color: "#059669" },
  statusError: { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
  statusErrorText: { color: "#DC2626" },

  // Image Modal
  imageModalOverlay: { flex: 1, backgroundColor: "rgba(17,24,39,0.95)", justifyContent: "center" },
  imageModalClose: { position: "absolute", top: 52, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  imageModalCloseText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  imageModalCounter: { position: "absolute", top: 58, left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 14, fontWeight: "600", zIndex: 10 },
  imageModalPage: { width: SCREEN_WIDTH, flex: 1, justifyContent: "center", alignItems: "center" },
  imageModalFull: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.2 },
});