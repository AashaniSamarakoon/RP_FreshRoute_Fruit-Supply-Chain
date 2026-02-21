import { BACKEND_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { BuyerColors } from "../../../constants/theme";

// supabase queries removed; backend will handle fetching orders

interface PlacedOrder {
  id: string;
  buyer_id: string;
  fruit_type: string;
  variant: string;
  quantity: number;
  grade: "A" | "B" | "C";
  required_date: string;
  delivery_location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  totalPrice: string | null;
  updated_at: string;
  status: string;
  payment_status: string;
  selected_farmer_id: string | null;
  harvest_id: string | null;
  blockchain_status: string | null;
  quality_confirmed_at: string | null;
  delivered_at: string | null;
  delivery_notes: string | null;
}

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Categorize orders into sections
  const categorizeOrders = (orders: PlacedOrder[]) => {
    const awaitingPayment = orders.filter(
      (order) => order.status === "AWAITING_PAYMENT",
    );

    const active = orders.filter(
      (order) =>
        order.status === "OPEN" ||
        order.status === "MATCHED" ||
        order.status === "PENDING_BUYER" ||
        order.status === "PENDING_FARMER" ||
        order.status === "PAID_PENDING_DELIVERY" ||
        order.status === "IN_TRANSIT",
    );

    const past = orders.filter(
      (order) =>
        order.status === "DELIVERED" ||
        order.status === "COMPLETED" ||
        order.status === "CANCELLED",
    );

    const sections = [];

    if (awaitingPayment.length > 0) {
      sections.push({ title: "Awaiting Payments", data: awaitingPayment });
    }

    if (active.length > 0) {
      sections.push({ title: "Active Orders", data: active });
    }

    if (past.length > 0) {
      sections.push({ title: "Past Orders", data: past });
    }

    return sections;
  };

  // Load orders from Supabase
  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, []),
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);

      // hitting backend route that handles buyer lookup via token
      const token = await AsyncStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/api/buyer/place-order`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            }
          : { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        // maybe unauthorized or server error
        setOrders([]);
        return;
      }

      const body = await res.json();
      console.log("orders response body", body);
      // backend may return totalPrice or total_price, normalize and compute if missing
      const ordersList: PlacedOrder[] = (body.orders || []).map((o: any) => {
        // simply propagate backend-provided totalPrice (or total_price) without calculation
        const totalRaw = o.totalPrice ?? o.total_price ?? null;
        return {
          ...o,
          totalPrice: totalRaw != null ? String(totalRaw) : null,
        };
      });
      setOrders(ordersList);
    } catch (error) {
      // Silent error handling
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderOrderCard = ({ item }: { item: PlacedOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/buyer/screens/OrderDetailScreen" as any,
          params: { orderId: item.id },
        })
      }
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.productName}>
            {item.fruit_type} - {item.variant}
          </Text>
          <Text style={styles.orderId}>Order #{item.id.substring(0, 8)}</Text>
          <Text style={styles.orderDate}>
            Placed: {formatDate(item.created_at)}
          </Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>
            {item.totalPrice ? `Rs. ${item.totalPrice}` : "N/A"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Orders"
        showNotification={true}
        onNotificationPress={() => {}}
      />
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.title}>My Orders</Text>
          <Text style={styles.subtitle}>
            Your order history will appear here.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={categorizeOrders(orders)}
          renderItem={renderOrderCard}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
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

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },

  listContent: {
    padding: 16,
    paddingBottom: 20,
  },

  sectionHeader: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    textTransform: "capitalize",
    letterSpacing: 0.5,
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
    marginBottom: 20,
    shadowRadius: 6,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  orderInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },

  orderId: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },

  orderDate: {
    fontSize: 11,
    color: "#999",
  },

  priceContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: 8,
  },

  priceLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },

  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: BuyerColors.primaryGreen,
  },
});
