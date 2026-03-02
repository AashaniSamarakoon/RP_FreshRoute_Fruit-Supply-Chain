import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useRouter } from "expo-router";
import { CheckCircle, Clock, Package, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { BuyerColors } from "../../../constants/theme";

interface Order {
  id: string;
  farmerName: string;
  product: string;
  quantity: string;
  unit: string;
  amount: string;
  status: "pending" | "collected" | "completed" | "waiting" | "confirmed" | "rejected";
  createdAt: string;
}

// --- TESTING ONLY: set to false to use real orders; delete MOCK_ORDERS block when not needed ---
const USE_MOCK_ORDERS = true;
const MOCK_ORDERS: Order[] = [
  {
    id: "mock-pending-1",
    farmerName: "Farm A",
    product: "Mango",
    quantity: "50",
    unit: "kg",
    amount: "LKR 5,000",
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2567c1ef-34a0-4cfa-8ec5-2be158319013",
    farmerName: "Farm B",
    product: "Mango",
    quantity: "30",
    unit: "kg",
    amount: "LKR 3,200",
    status: "collected",
    createdAt: new Date().toISOString(),
  },
  {
    id: "mock-completed-3",
    farmerName: "Farm C",
    product: "Mango",
    quantity: "20",
    unit: "kg",
    amount: "LKR 2,100",
    status: "completed",
    createdAt: new Date().toISOString(),
  },
];
// --- END TESTING ONLY ---

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      if (USE_MOCK_ORDERS) {
        setOrders(MOCK_ORDERS);
      } else {
        const storedOrders = (global as any).buyerOrders || [];
        setOrders(storedOrders);
      }
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
      case "waiting":
        return "#FFA500";
      case "collected":
        return "#3182ce";
      case "completed":
      case "confirmed":
        return BuyerColors.primaryGreen;
      case "rejected":
        return "#d32f2f";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
      case "waiting":
        return <Clock size={20} color={getStatusColor(status)} />;
      case "collected":
        return <Package size={20} color={getStatusColor(status)} />;
      case "completed":
      case "confirmed":
        return <CheckCircle size={20} color={getStatusColor(status)} />;
      case "rejected":
        return <XCircle size={20} color={getStatusColor(status)} />;
      default:
        return <Clock size={20} color="#666" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "waiting":
        return "Waiting for Confirmation";
      case "collected":
        return "Collected";
      case "completed":
        return "Completed";
      case "confirmed":
        return "Confirmed";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
  };

  const handleViewImages = (orderId: string) => {
    router.push(`/buyer/order-gradings/${orderId}` as any);
  };

  const handleAddComplaint = async (orderId: string) => {
    let buyerId = "";
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        buyerId = user.id ?? user.user_id ?? "";
      }
    } catch (_) {}
    router.push({
      pathname: "/buyer/chat",
      params: { orderId, buyerId },
    } as any);
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.farmerName}>{item.farmerName}</Text>
          <Text style={styles.orderId}>Order #{item.id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          {getStatusIcon(item.status)}
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Product</Text>
          <Text style={styles.detailValue}>{item.product}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>
            {item.quantity} {item.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount</Text>
          <Text style={styles.detailValue}>{item.amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <Text
            style={[styles.detailValue, { color: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      {item.status === "collected" && (
        <TouchableOpacity
          style={styles.cardButton}
          onPress={() => handleViewImages(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardButtonText}>View Images</Text>
        </TouchableOpacity>
      )}
      {item.status === "completed" && (
        <TouchableOpacity
          style={[styles.cardButton, styles.cardButtonComplaint]}
          onPress={() => handleAddComplaint(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.cardButtonText}>Add Complaint</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Orders"
        showNotification={true}
        onNotificationPress={() => {
          // Handle notification press
          console.log("Notifications pressed");
        }}
      />
      {orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            Your order history will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  listContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: BuyerColors?.textBlack || "#000",
    marginBottom: 8,
  },

  subtitle: { fontSize: 16, color: "#666", textAlign: "center" },

  orderCard: {
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

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },

  orderInfo: {
    flex: 1,
  },

  farmerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  orderId: {
    fontSize: 12,
    color: "#666",
  },

  statusBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  orderDetails: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  detailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },

  cardButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: BuyerColors.primaryGreen,
  },
  cardButtonComplaint: {
    backgroundColor: "#3182ce",
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
