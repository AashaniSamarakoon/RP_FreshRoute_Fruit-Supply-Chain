import { useRouter } from "expo-router";
import { ChevronRight, MapPin, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../../components/Header";
import SuccessModal from "../../../components/modals/SuccessModal";
import { BuyerColors } from "../../../constants/theme";

// ... [Keep your MatchedStock interface the same] ...
interface MatchedStock {
  id: string;
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
}

export default function MatchedStocksScreen() {
  const router = useRouter();
  const [stocks, setStocks] = useState<MatchedStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [selectedStock, setSelectedStock] = useState<MatchedStock | null>(null);

  // Updated Mock Data with Trust Scores
  const mockMatchedStocks: MatchedStock[] = [
    {
      id: "1",
      farmerName: "Lakshan Farms",
      fruitType: "Banana",
      category: "Premium Cavendish",
      quantity: 900,
      availableUnit: "kg",
      grade: "A",
      quality: "Organic",
      farmLocation: "Awissawella",
      distance: 2.3,
      trustScore: "98% On-time Delivery",
    },
  ];

  useEffect(() => {
    // ... [Keep your existing useEffect] ...
    const timer = setTimeout(() => {
      setStocks(mockMatchedStocks);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const navigateToProfile = (farmerId: string) => {
    // Navigate to the dynamic trust profile route
    router.push({
      pathname: "/buyer/screens/trust-profile/[id]",
      params: { id: farmerId },
    });
  };

  const handleSelectAndConfirm = (item: MatchedStock) => {
    // Create order notification for farmer
    const orderNotification = {
      id: Math.random().toString(36).substr(2, 9),
      buyerName: "Fresh Mart",
      productName: item.category,
      quantity: item.quantity.toString(),
      unit: item.availableUnit,
      grade: item.grade,
      amount: `Rs. ${(item.quantity * 250).toLocaleString()}`,
      status: "pending" as const,
    };

    // Add to buyer's orders with "waiting" status
    const buyerOrder = {
      id: Math.random().toString(36).substr(2, 9),
      farmerName: item.farmerName,
      product: item.category,
      quantity: item.quantity.toString(),
      unit: item.availableUnit,
      amount: `Rs. ${(item.quantity * 250).toLocaleString()}`,
      status: "waiting" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };

    // Store order in global state (in real app use Context/Redux)
    if (!global.buyerOrders) {
      global.buyerOrders = [];
    }
    global.buyerOrders.unshift(buyerOrder);

    // Send order to farmer (in real app via API)
    console.log("Order sent to farmer:", orderNotification);

    setSelectedStock(item);
    setSuccessModalVisible(true);
  };

  const renderStockCard = ({ item }: { item: MatchedStock }) => (
    <View style={styles.stockCard}>
      {/* Header Section - Clickable Profile Button */}
      <TouchableOpacity
        style={styles.cardHeader}
        activeOpacity={0.7}
        onPress={() => navigateToProfile(item.id)}
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

          <Text style={styles.trustSummaryText}>
            {item.trustScore || "High Reliability Score"} • Verified on Ledger
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>{item.distance} km</Text>
          </View>
          <ChevronRight size={16} color={BuyerColors.primaryGreen} />
        </View>
      </TouchableOpacity>

      {/* Product Name */}
      <Text style={styles.productName}>{item.category}</Text>

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
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => handleSelectAndConfirm(item)}
      >
        <Text style={styles.selectButtonText}>Select & Confirm</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Matched Stocks" onBack={() => router.back()} />
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
          // Navigate to Orders tab
          router.push("/buyer/(tabs)/orders");
        }}
        title="Order Sent"
        message={
          selectedStock
            ? `Your order for ${selectedStock.category} has been sent to ${selectedStock.farmerName}. They will review and confirm shortly.`
            : ""
        }
        buttonText="Done"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff", paddingTop: 20 },

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

  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 12,
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
});
