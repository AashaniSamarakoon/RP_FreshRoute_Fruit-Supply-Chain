import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../../components/Header";
import ErrorModal from "../../../components/modals/ErrorModal";
import SuccessModal from "../../../components/modals/SuccessModal";
import { BACKEND_URL } from "../../../config";
import { BuyerColors } from "../../../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ... [Keep your MatchedStock interface the same] ...
interface MatchedStock {
  id: string; // This will be the proposal id (unique)
  stockId: string; // The actual stock id
  farmerId: string;
  farmerName: string;
  fruitType: string;
  category: string;
  quantity: number;
  availableUnit: string;
  grade: string;
  quality: string;
  farmLocation: string;
  distance: number;
  trustScore?: string;
  estimatedHarvestDate?: string;
  imageUrls: string[];
  status: string; // Proposal status from backend
}

export default function MatchedStocksScreen() {
  const router = useRouter();
  const { orderId: paramOrderId } = useLocalSearchParams();
  const [stocks, setStocks] = useState<MatchedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<MatchedStock | null>(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(
    typeof paramOrderId === "string" ? paramOrderId : null
  );
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Add this state for tracking approval loading
  const [approvingProposals, setApprovingProposals] = useState<Set<string>>(
    new Set()
  );

  // Image modal state
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch open orders if no orderId was passed via params
  const fetchOpenOrders = useCallback(async () => {
    // If orderId already passed from params, skip fetching
    if (typeof paramOrderId === "string" && paramOrderId) {
      setCurrentOrderId(paramOrderId);
      return;
    }

    try {
      setLoadingOrder(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        console.warn("No auth token found");
        setError("Authentication failed. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/buyer/place-order`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      console.log("Orders response:", data);

      // Find the first OPEN order
      if (data.orders && data.orders.length > 0) {
        const openOrder = data.orders.find(
          (order: any) => order.status === "OPEN"
        );
        if (openOrder) {
          setCurrentOrderId(openOrder.id);
        } else {
          // If no OPEN order, use the first one
          setCurrentOrderId(data.orders[0].id);
        }
      } else {
        setError("No orders found. Please place an order first.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders. Please try again.");
      setLoading(false);
    } finally {
      setLoadingOrder(false);
    }
  }, [paramOrderId]);

  // Fetch orders on mount/focus if needed
  useFocusEffect(
    useCallback(() => {
      fetchOpenOrders();
    }, [fetchOpenOrders])
  );

  useEffect(() => {
    console.log("MatchedStocks useEffect, currentOrderId:", currentOrderId);
    const fetchMatchedStocks = async () => {
      try {
        setError(null);
        setLoading(true);

        if (!currentOrderId || typeof currentOrderId !== "string") {
          setError("Invalid order ID. Please go back and try again.");
          setLoading(false);
          return;
        }

        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setError("Authentication failed. Please log in again.");
          setLoading(false);
          return;
        }

        const apiUrl = `${BACKEND_URL}/api/buyer/matching/${currentOrderId}`;
        console.log("Fetching from:", apiUrl);

        const res = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("API response:", res.status, data);

        if (!res.ok) {
          const errorMsg =
            data?.message || `Failed to load matched stocks (${res.status})`;
          setError(errorMsg);
          setLoading(false);
          return;
        }

        let matches: any[] = [];
        if (data?.proposals && Array.isArray(data.proposals)) {
          matches = data.proposals;
        } else if (Array.isArray(data)) {
          matches = data;
        } else {
          setError("No matching stocks found for your order.");
          setStocks([]);
          setLoading(false);
          return;
        }

        if (matches.length === 0) {
          setError("No matching stocks found for your order.");
          setStocks([]);
          setLoading(false);
          return;
        }

        try {
          const transformedStocks = matches
            .map((item: any) => {
              // Extract stock data from the nested stock object
              const stock = item.stock || {};
              const farmer = stock.farmer || {};
              const farmerUser = farmer.user || {};

              const stockId = item.stock_id || stock?.id;
              const farmerId = farmer?.id;
              const proposalId = item.id; // Use proposal id as unique identifier

              if (!stockId || !farmerId || !proposalId) {
                console.warn(
                  "Missing required ids. proposalId:",
                  proposalId,
                  "stockId:",
                  stockId,
                  "farmerId:",
                  farmerId
                );
                return null;
              }

              const quantity = parseInt(
                item.quantity_proposed ?? stock?.quantity ?? 0,
                10
              );
              const distance = parseFloat(farmer?.latitude ?? 0);

              console.log("Farmer data for location:", farmer);

              return {
                id: proposalId, // Use proposal id as the unique key
                stockId: stockId,
                farmerId: farmerId,
                farmerName:
                  farmerUser?.name || `Farmer ${farmerId?.slice(0, 8)}`,
                fruitType: data?.order?.fruit_type || "Fruit",
                category: data?.order?.variant || "Unknown",
                quantity: isNaN(quantity) ? 0 : quantity,
                availableUnit: "kg",
                grade: stock?.grade || "A",
                quality: stock?.quality || "Premium",
                farmLocation:
                  farmer?.location ||
                  farmerUser?.location ||
                  "Unknown Location",
                distance: isNaN(distance) ? 0 : distance,
                trustScore: farmer?.reputation
                  ? `${farmer.reputation}/5`
                  : "Not rated",
                estimatedHarvestDate: stock?.estimated_harvest_date,
                imageUrls: stock?.image_url || [],
                status: item.status || "PENDING", // Add proposal status
              };
            })
            .filter((item: any) => item !== null); // Remove null entries

          console.log("Transformed stocks:", transformedStocks);
          setStocks(transformedStocks);
          setError(null);
        } catch (transformError) {
          console.error("Error transforming stock data:", transformError);
          setError("Error processing matched stocks data.");
          setStocks([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching matched stocks:", error);
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to load matched stocks. Please try again.";
        setError(errorMsg);
        setStocks([]);
        setLoading(false);
      }
    };

    if (currentOrderId && typeof currentOrderId === "string") {
      fetchMatchedStocks();
    }
  }, [currentOrderId]);

  const navigateToProfile = (item: MatchedStock) => {
    // Navigate to the dynamic trust profile route with farmer data
    router.push({
      pathname: "/buyer/screens/trust-profile/[id]",
      params: {
        id: item.farmerId,
        farmerName: item.farmerName,
        farmLocation: item.farmLocation,
        trustScore: item.trustScore || "Not rated",
        imageUrls: item.imageUrls?.join(",") || "",
      },
    });
  };

  const openImageModal = (images: string[]) => {
    if (images.length > 0) {
      setCurrentImages(images);
      setCurrentImageIndex(0);
      setImageModalVisible(true);
    }
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH
    );
    setCurrentImageIndex(slideIndex);
  };

  // Update the handleSelectAndConfirm function to handle approval
  const handleApproveProposal = async (item: MatchedStock) => {
    try {
      setApprovingProposals((prev) => new Set(prev).add(item.id));

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("Authentication failed. Please log in again.");
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/buyer/matching/approve/${item.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to approve proposal"
        );
      }

      // Update local state to reflect the status change
      setStocks((prevStocks) =>
        prevStocks.map((stock) =>
          stock.id === item.id ? { ...stock, status: "PENDING_FARMER" } : stock
        )
      );

      // Show success message
      setSuccessModalVisible(true);
      setSelectedStock(item);
    } catch (err) {
      console.error("Error approving proposal:", err);
      setError(
        err instanceof Error ? err.message : "Failed to approve proposal"
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

  // Update the button press handler
  const handleButtonPress = (item: MatchedStock) => {
    if (item.status === "PENDING_BUYER") {
      handleApproveProposal(item);
    } else if (
      item.status === "PENDING_FARMER" ||
      item.status === "ACCEPTED" ||
      item.status === "REJECTED"
    ) {
      // Do nothing - button is disabled
      return;
    }
  };

  const renderStockCard = ({ item }: { item: MatchedStock }) => (
    <View style={styles.stockCard}>
      {/* Header Section - Clickable Profile Button */}
      <TouchableOpacity
        style={styles.cardHeader}
        activeOpacity={0.7}
        onPress={() => navigateToProfile(item)}
      >
        <View style={styles.farmerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.farmerName}>{item.farmerName}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={10} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={BuyerColors.textGray} />
            <Text style={styles.locationText}>{item.farmLocation}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              {item.distance.toFixed(1)} km
            </Text>
          </View>
          <ChevronRight size={16} color={BuyerColors.primaryGreen} />
        </View>
      </TouchableOpacity>

      {/* Product Name with Image Preview */}
      <View style={styles.productRow}>
        <Text style={styles.productName}>
          {item.fruitType} {item.category}
        </Text>

        {/* Image Preview Button */}
        {item.imageUrls.length > 0 && (
          <TouchableOpacity
            style={styles.imagePreviewButton}
            onPress={() => openImageModal(item.imageUrls)}
          >
            <Image
              source={{ uri: item.imageUrls[0] }}
              style={styles.thumbnailImage}
            />
            <View style={styles.imageCountBadge}>
              <ImageIcon size={10} color="#fff" />
              <Text style={styles.imageCountText}>{item.imageUrls.length}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Stock Details */}
      <View style={styles.stockDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Available</Text>
          <Text style={styles.detailValue}>
            {item.quantity} {item.availableUnit}
          </Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Grade</Text>
          <View style={styles.gradeRow}>
            <Text style={styles.detailValue}>{item.grade}</Text>
            <ShieldCheck
              size={12}
              color={BuyerColors.primaryGreen}
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quality</Text>
          <Text style={styles.detailValue}>{item.quality}</Text>
        </View>
        {item.estimatedHarvestDate && (
          <>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Harvest Date</Text>
              <Text style={styles.detailValue}>
                {new Date(item.estimatedHarvestDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.selectButton,
          item.status === "PENDING_BUYER" && styles.approveButton,
          (item.status === "PENDING_FARMER" ||
            item.status === "ACCEPTED" ||
            item.status === "REJECTED") &&
            styles.disabledButton,
          approvingProposals.has(item.id) && styles.approvingButton,
        ]}
        onPress={() => handleButtonPress(item)}
        disabled={
          item.status === "PENDING_FARMER" ||
          item.status === "ACCEPTED" ||
          item.status === "REJECTED" ||
          approvingProposals.has(item.id)
        }
      >
        {approvingProposals.has(item.id) ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text
            style={[
              styles.selectButtonText,
              item.status === "PENDING_BUYER" && styles.approveButtonText,
              (item.status === "PENDING_FARMER" ||
                item.status === "ACCEPTED" ||
                item.status === "REJECTED") &&
                styles.disabledButtonText,
            ]}
          >
            {item.status === "PENDING_BUYER"
              ? "Approve Deal"
              : item.status === "PENDING_FARMER"
              ? "Pending farmer confirmation"
              : item.status === "ACCEPTED"
              ? "Accepted"
              : item.status === "REJECTED"
              ? "Rejected"
              : "Select"}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Matched Deals" onBack={() => router.back()} />
      {/* ... [Keep the rest of your return logic] ... */}
      <View style={styles.headerInfo}>
        <Text style={styles.headerText}>
          Farmers near you with available stock
        </Text>
        <Text style={styles.countText}>{stocks.length} matches found</Text>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading matched stocks...</Text>
        </View>
      ) : stocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Deals Available</Text>
          <Text style={styles.emptyMessage}>
            No matching harvest found for your order. We will notify you when
            best deals available.
          </Text>
        </View>
      ) : (
        <FlatList
          data={stocks}
          renderItem={renderStockCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
            ? `Your proposal for ${selectedStock.category} from ${selectedStock.farmerName} has been approved. The farmer will review and confirm shortly.`
            : ""
        }
        buttonText="OK"
        onButtonPress={() => {
          // Set pending confirmation state when OK is clicked
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

      {/* Image Gallery Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setImageModalVisible(false)}
          >
            <X size={24} color="#fff" />
          </TouchableOpacity>

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {currentImageIndex + 1} / {currentImages.length}
            </Text>
          </View>

          {/* Swipeable Images */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.imageScrollView}
          >
            {currentImages.map((imageUrl, index) => (
              <View key={index} style={styles.imageSlide}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          {currentImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {currentImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff", paddingTop: 40 },

  headerInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  headerText: {
    fontSize: 13,
    color: BuyerColors.textGray,
    marginBottom: 4,
    fontWeight: "400",
  },

  countText: {
    fontSize: 16,
    fontWeight: "700",
    color: BuyerColors.primaryGreen,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  loadingText: {
    fontSize: 14,
    color: BuyerColors.textGray,
    marginTop: 12,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },

  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#d32f2f",
    textAlign: "center",
  },

  errorMessage: {
    fontSize: 14,
    color: BuyerColors.textGray,
    textAlign: "center",
    lineHeight: 20,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 16,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#666",
    textAlign: "center",
  },

  emptyMessage: {
    fontSize: 14,
    color: BuyerColors.textGray,
    textAlign: "center",
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginTop: 8,
  },

  retryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    textAlign: "center",
  },

  listContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },

  stockCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },

  // Header Section
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },

  farmerInfo: {
    flex: 1,
    marginRight: 8,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },

  farmerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },

  verifiedText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 5,
  },

  locationText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  trustSummaryText: {
    fontSize: 12,
    color: BuyerColors.primaryGreen,
    fontWeight: "500",
  },

  headerRight: {
    alignItems: "flex-end",
    gap: 6,
  },

  distanceBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  distanceText: {
    fontSize: 12,
    fontWeight: "600",
    color: BuyerColors.primaryGreen,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },

  imagePreviewButton: {
    position: "relative",
    marginLeft: 12,
  },

  thumbnailImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },

  imageCountBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: BuyerColors.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },

  imageCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  stockDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },

  detailItem: {
    flex: 1,
    alignItems: "center",
  },

  detailLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 3,
    textTransform: "uppercase",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },

  detailDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
  },

  gradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  harvestDateContainer: {
    backgroundColor: "#F0F8F5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: BuyerColors.primaryGreen,
  },

  harvestDateLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 3,
    textTransform: "uppercase",
  },

  harvestDateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: BuyerColors.primaryGreen,
  },

  selectButton: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 13,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: BuyerColors.primaryGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  selectButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  pendingButton: {
    backgroundColor: "#fef3c7", // Light yellow from badge
  },

  pendingButtonText: {
    color: "#92400e", // Dark yellow/brown from badge
  },

  acceptedButton: {
    backgroundColor: "#d1fae5", // Light green from badge
  },

  acceptedButtonText: {
    color: "#065f46", // Dark green from badge
  },

  rejectedButton: {
    backgroundColor: "#fee2e2", // Light red from badge
  },

  rejectedButtonText: {
    color: "#991b1b", // Dark red from badge
  },

  approveButton: {
    backgroundColor: BuyerColors.primaryGreen,
  },

  approveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  approvingButton: {
    backgroundColor: "#6b7280", // Gray for loading state
  },

  disabledButton: {
    backgroundColor: "#f3f4f6", // Light gray
  },

  disabledButtonText: {
    color: "#6b7280", // Dark gray
  },

  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 10,
    borderRadius: 20,
  },

  imageCounter: {
    position: "absolute",
    top: 55,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  imageScrollView: {
    flex: 1,
  },

  imageSlide: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 12,
  },

  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    gap: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },

  activeDot: {
    backgroundColor: "#fff",
    width: 24,
  },
});
