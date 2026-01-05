import { useFocusEffect } from "expo-router";
import { CheckCircle, Clock, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
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
  status: "waiting" | "confirmed" | "rejected";
  createdAt: string;
}

export default function BuyerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from AsyncStorage or state management
  useFocusEffect(
    React.useCallback(() => {
      // Load orders - for now using stored state
      const storedOrders = global.buyerOrders || [];
      setOrders(storedOrders);
    }, [])
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "waiting":
        return "#FFA500";
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
      case "waiting":
        return <Clock size={20} color={getStatusColor(status)} />;
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
      case "waiting":
        return "Waiting for Confirmation";
      case "confirmed":
        return "Confirmed";
      case "rejected":
        return "Rejected";
      default:
        return "Pending";
    }
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
});
