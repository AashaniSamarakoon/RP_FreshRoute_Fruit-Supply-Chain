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
  Image,
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
import { BuyerColors } from "../../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MatchedStock {
  id: string;
  stockId: string;
  orderId: string; // Added to track which order this belongs to
  farmerId: string;
  farmerName: string;
  fruitType: string;
  category: string;
  quantity: number;
  orderQuantity: number; // The amount the buyer requested
  availableUnit: string;
  grade: string;
  quality: string;
  farmLocation: string;
  distance: number;
  trustScore: string;
  estimatedHarvestDate?: string;
  imageUrls: string[];
  status: string;
}

// Data structure required by SectionList
interface OrderGroup {
  orderId: string;
  fruitType: string;
  category: string;
  orderQuantity: number;
  data: MatchedStock[]; // The proposals (matches) for this order
}

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

export default function MatchedStocksScreen() {
  const router = useRouter();
  // orderId param is passed when navigating from a specific order card.
  // When absent (e.g. dashboard "See all"), we fall back to the buyer-wide endpoint.
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
  // In per-order mode this holds the orderId → calls /api/buyer/matching/:orderId
  // In buyer-wide mode this holds the buyerId  → calls /api/buyer/matching/:buyerId
  const [fetchId, setFetchId] = useState<string | null>(orderIdParam || null);
  const [approvingProposals, setApprovingProposals] = useState<Set<string>>(
    new Set(),
  );

  // Image modal state
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const resolveFetchId = useCallback(async () => {
    if (orderIdParam) {
      // Per-order mode: use orderId directly → GET /api/buyer/matching/:orderId
      setFetchId(orderIdParam);
      return;
    }
    // Buyer-wide mode: look up buyer UUID → GET /api/buyer/matching/:buyerId
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

        // Per-order mode:  GET /api/buyer/matching/order/:orderId  (orderId from nav params)
        // Buyer-wide mode: GET /api/buyer/matching/:buyerId         (buyerId from AsyncStorage)
        const apiUrl = isPerOrderMode
          ? `/api/buyer/matching/order/${fetchId}`
          : `/api/buyer/matching/${fetchId}`;
        console.log(
          `[MatchedStocks] ${isPerOrderMode ? "per-order" : "buyer-wide"} fetch:`,
          apiUrl,
        );
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
        } else if (Array.isArray(data)) {
          matches = data;
        }

        if (matches.length === 0) {
          setGroupedStocks([]);
          setLoading(false);
          return;
        }

        // 1. Transform raw data into structured MatchedStock array
        const transformedStocks = matches
          .map((item: any) => {
            const stock = item.stock || {};
            const farmer = stock.farmer || {};
            const order = item.order || {};

            console.log("item", item);
            if (!stock?.id || !item.id) return null;

            return {
              id: item.id,
              stockId: stock.id,
              orderId: order.id || "Unknown Order",
              farmerId: farmer?.user?.id || farmer?.id || "",
              farmerName:
                farmer?.user?.first_name + " " + farmer?.user?.last_name,
              fruitType: order.fruit_type || stock.fruit_type || "Fruit",
              category: order.variant || stock.variant || "Unknown",
              quantity: parseInt(
                item.quantity_proposed ?? stock.quantity ?? 0,
                10,
              ),
              orderQuantity: parseInt(order.quantity || 0, 10),
              availableUnit: "kg",
              grade: stock.grade || "A",
              quality: stock.quality || "Premium",
              farmLocation: farmer?.location || "Unknown Location",
              distance: item.distance_km || 0,
              trustScore: farmer?.reputation
                ? `${farmer.reputation}/5`
                : "Not rated",
              estimatedHarvestDate: stock.estimated_harvest_date,
              imageUrls: stock.image_url || [],
              status: item.status || "PENDING",
            };
          })
          .filter((item) => item !== null) as MatchedStock[];

        // 2. Group the transformed stocks by Order ID
        const groupedData = transformedStocks.reduce(
          (acc: Record<string, OrderGroup>, curr) => {
            if (!acc[curr.orderId]) {
              acc[curr.orderId] = {
                orderId: curr.orderId,
                fruitType: curr.fruitType,
                category: curr.category,
                orderQuantity: curr.orderQuantity,
                data: [], // This holds the proposals for this specific order
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
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load matched stocks.",
        );
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
      pathname: "/buyer/screens/trust-profile/[id]",
      params: {
        id: item.farmerId,
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

      // Update the status inside the deeply nested array
      setGroupedStocks((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          data: group.data.map((stock) =>
            stock.id === item.id
              ? { ...stock, status: "PENDING_FARMER" }
              : stock,
          ),
        })),
      );

      setSuccessModalVisible(true);
      setSelectedStock(item);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve proposal",
      );
      setErrorModalVisible(true);
    } finally {
      setApprovingProposals((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // --- UI Renders ---

  // Renders the Farmer Proposal Card
  const renderStockCard = ({ item }: { item: MatchedStock }) => {
    const fruitMeta = getFruitMeta(item.fruitType);
    const isApproving = approvingProposals.has(item.id);

    return (
      <View style={styles.stockCard}>
        {/* Card Header (Farmer Profile) */}
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          onPress={() => navigateToProfile(item)}
        >
          <View style={styles.farmerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.farmerName}>{item.farmerName}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={12} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.farmLocation}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {item.distance.toFixed(1)} km
              </Text>
            </View>
            <ChevronRight size={20} color="#D1D5DB" />
          </View>
        </TouchableOpacity>

        <View style={styles.dashedDivider} />

        {/* Card Body (Product Details) */}
        <View style={styles.productBody}>
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
                <Image
                  source={{ uri: item.imageUrls[0] }}
                  style={styles.productImage}
                />
                {item.imageUrls.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <ImageIcon
                      size={10}
                      color="#fff"
                      style={{ marginRight: 2 }}
                    />
                    <Text style={styles.imageCountText}>
                      +{item.imageUrls.length - 1}
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
            <View style={styles.chipContainer}>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: "#F0FDF4",
                    borderColor: "#BBF7D0",
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: "#16A34A" }]}>
                  Yield: {item.quantity} {item.availableUnit}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>Grade {item.grade}</Text>
              </View>
            </View>

            {item.estimatedHarvestDate && (
              <View style={styles.harvestRow}>
                <Calendar size={14} color="#6B7280" />
                <Text style={styles.harvestText}>
                  Harvest:{" "}
                  <Text style={{ fontWeight: "700", color: "#374151" }}>
                    {new Date(item.estimatedHarvestDate).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </Text>
                </Text>
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
                {item.status === "PENDING_FARMER"
                  ? "Waiting for Farmer Confirmation"
                  : item.status === "ACCEPTED"
                    ? "Deal Accepted"
                    : item.status === "REJECTED"
                      ? "Proposal Rejected"
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
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
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
          stickySectionHeadersEnabled={true} // Makes the order header stick to the top!
        />
      )}

      {/* Modals remain mostly identical, omitted for brevity but include them! */}
      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        onClose={() => {
          setSuccessModalVisible(false);
          setSelectedStock(null);
        }}
        title="Proposal Approved"
        message={
          selectedStock
            ? `You have approved the proposal from ${selectedStock.farmerName}. Awaiting farmer's final confirmation.`
            : ""
        }
        buttonText="Got it"
        onButtonPress={() => {
          setSuccessModalVisible(false);
          setSelectedStock(null);
        }}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={errorModalVisible}
        onClose={() => {
          setErrorModalVisible(false);
          setError(null);
        }}
        title="Error"
        message={error || "An unexpected error occurred"}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
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
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  listContent: { paddingTop: 16, paddingBottom: 40 },

  // --- Card Structure ---
  stockCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  // Card Header (Farmer Profile)
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  farmerInfo: { flex: 1, marginRight: 12 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  farmerName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 2,
  },
  verifiedText: { fontSize: 11, color: "#16A34A", fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  distanceBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: { fontSize: 12, fontWeight: "700", color: "#4B5563" },

  // Divider
  dashedDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    margin: -1,
    marginBottom: 16,
  },

  // Card Body (Product)
  productBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageCountBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  imageCountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 32 },

  productInfo: { flex: 1, marginLeft: 16, paddingTop: 4 },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: { fontSize: 12, fontWeight: "700", color: "#4B5563" },

  harvestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F9FAFB",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  harvestText: { fontSize: 13, color: "#6B7280" },

  // Card Footer (Actions)
  cardFooter: { marginTop: 4 },
  primaryButton: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#ffffff", fontSize: 15, fontWeight: "bold" },

  // Status Indicator States
  statusContainer: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: { fontSize: 14, fontWeight: "700" },
  statusWarning: { backgroundColor: "#FEF9C3" },
  statusWarningText: { color: "#CA8A04" },
  statusSuccess: { backgroundColor: "#F0FDF4" },
  statusSuccessText: { color: "#16A34A" },
  statusError: { backgroundColor: "#FEF2F2" },
  statusErrorText: { color: "#DC2626" },
});
