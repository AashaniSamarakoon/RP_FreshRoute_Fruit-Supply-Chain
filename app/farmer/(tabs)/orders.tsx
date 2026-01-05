import { useRouter } from "expo-router";
import { CheckCircle, Eye, ShoppingCart, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const DANGER_RED = "#d32f2f";

interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  product: string;
  quantity: string;
  unit: string;
  price: number;
  totalAmount: number;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  deliveryDate: string;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: "ORD001",
    buyerId: "buyer001",
    buyerName: "Fresh Mart",
    buyerPhone: "+94 11 234 5678",
    product: "Banana - Grade A",
    quantity: "500",
    unit: "kg",
    price: 250,
    totalAmount: 125000,
    status: "pending",
    createdAt: "2024-01-15",
    deliveryDate: "2024-01-18",
  },
  {
    id: "ORD002",
    buyerId: "buyer002",
    buyerName: "Metro Supermarket",
    buyerPhone: "+94 11 345 6789",
    product: "Papaya - Grade B",
    quantity: "300",
    unit: "kg",
    price: 200,
    totalAmount: 60000,
    status: "pending",
    createdAt: "2024-01-14",
    deliveryDate: "2024-01-17",
  },
  {
    id: "ORD003",
    buyerId: "buyer003",
    buyerName: "City Markets",
    buyerPhone: "+94 11 456 7890",
    product: "Mangoes - Premium",
    quantity: "250",
    unit: "kg",
    price: 350,
    totalAmount: 87500,
    status: "pending",
    createdAt: "2024-01-13",
    deliveryDate: "2024-01-16",
  },
];

export default function OrdersTab() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);

  const handleAcceptOrder = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: "accepted" } : order
      )
    );
  };

  const handleRejectOrder = (orderId: string) => {
    setOrders((prevOrders) =>
      prevOrders.filter((order) => order.id !== orderId)
    );
  };

  const handleViewProfile = (buyerId: string) => {
    router.push(`/farmer/screens/buyer-trust-profile/${buyerId}` as any);
  };

  const pendingOrders = orders.filter((order) => order.status === "pending");
  const acceptedOrders = orders.filter((order) => order.status === "accepted");

  const OrderCard = ({ order }: { order: Order }) => (
    <View style={styles.orderCard}>
      <TouchableOpacity
        style={styles.orderHeader}
        onPress={() => handleViewProfile(order.buyerId)}
      >
        <View style={styles.buyerInfo}>
          <ShoppingCart size={24} color={PRIMARY_GREEN} />
          <View style={styles.buyerDetails}>
            <Text style={styles.buyerName}>{order.buyerName}</Text>
            <Text style={styles.orderId}>Order #{order.id}</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Product</Text>
          <Text style={styles.value}>{order.product}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Quantity</Text>
          <Text style={styles.value}>
            {order.quantity} {order.unit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Total Amount</Text>
          <Text style={[styles.value, styles.amountText]}>
            Rs. {order.totalAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Delivery Date</Text>
          <Text style={styles.value}>{order.deliveryDate}</Text>
        </View>
      </View>

      {order.status === "pending" && (
        <View>
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => handleViewProfile(order.buyerId)}
          >
            <Eye size={16} color={PRIMARY_GREEN} />
            <Text style={styles.viewProfileText}>View Buyer Profile</Text>
          </TouchableOpacity>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={() => handleAcceptOrder(order.id)}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.rejectButton]}
              onPress={() => handleRejectOrder(order.id)}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {order.status === "accepted" && (
        <View style={styles.acceptedBadge}>
          <CheckCircle size={18} color={PRIMARY_GREEN} />
          <Text style={styles.acceptedText}>Order Accepted</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {pendingOrders.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>
              Pending Orders ({pendingOrders.length})
            </Text>
            <FlatList
              data={pendingOrders}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => <OrderCard order={item} />}
            />
          </View>
        )}

        {acceptedOrders.length > 0 && (
          <View style={styles.acceptedSection}>
            <Text style={styles.sectionTitle}>
              Accepted Orders ({acceptedOrders.length})
            </Text>
            <FlatList
              data={acceptedOrders}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => <OrderCard order={item} />}
            />
          </View>
        )}

        {orders.length === 0 && (
          <View style={styles.emptyState}>
            <ShoppingCart size={48} color={LIGHT_GRAY} />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubText}>
              Orders from buyers will appear here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 12,
  },
  acceptedSection: {
    marginTop: 20,
  },
  orderCard: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_GREEN,
  },
  orderHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  buyerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buyerDetails: {
    marginLeft: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  orderId: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  orderDetails: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  value: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  amountText: {
    color: PRIMARY_GREEN,
    fontSize: 14,
  },
  viewProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: PRIMARY_GREEN,
    gap: 6,
  },
  viewProfileText: {
    color: PRIMARY_GREEN,
    fontSize: 14,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: PRIMARY_GREEN,
  },
  rejectButton: {
    backgroundColor: DANGER_RED,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#f0f8f5",
    borderRadius: 8,
    gap: 6,
  },
  acceptedText: {
    color: PRIMARY_GREEN,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
});
