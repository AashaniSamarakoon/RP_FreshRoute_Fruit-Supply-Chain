import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
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
  unitPrice: number | null;
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

// 🎨 NEW: Visual Helper for Fruits
const getFruitMeta = (fruit: string) => {
  const f = fruit.toLowerCase();
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
    case "PENDING_BUYER":
      return { bg: "#F0FDF4", text: "#16A34A", label: "Review Proposals" };
    case "OPEN":
      return { bg: "#FFF7ED", text: "#F97316", label: "Seeking Farmers" };
    case "PENDING_FARMER":
      return { bg: "#EFF6FF", text: "#3B82F6", label: "Awaiting Farmer" };
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
        label: status.replace(/_/g, " "),
      };
  }
};

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const categorizeOrders = (orders: PlacedOrder[]) => {
    // Action Required: needs buyer to DO something (pay, or review/approve proposals)
    const actionRequired = orders.filter(
      (o) => o.status === "AWAITING_PAYMENT" || o.status === "PENDING_BUYER",
    );
    const active = orders.filter((o) =>
      [
        "OPEN",
        "MATCHED",
        "PENDING_FARMER",
        "PAID_PENDING_DELIVERY",
        "IN_TRANSIT",
      ].includes(o.status),
    );
    const past = orders.filter((o) =>
      ["DELIVERED", "COMPLETED", "CANCELLED"].includes(o.status),
    );

    const sections = [];
    if (actionRequired.length > 0)
      sections.push({ title: "Action Required", data: actionRequired });
    if (active.length > 0)
      sections.push({ title: "Active Orders", data: active });
    if (past.length > 0) sections.push({ title: "Past Orders", data: past });

    return sections;
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, []),
  );

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const body: any = await api.get(`/api/buyer/place-order`);
      const ordersList: PlacedOrder[] = (body.orders || []).map((o: any) => {
        const totalRaw = o.totalPrice ?? o.total_price ?? null;
        return {
          ...o,
          totalPrice: totalRaw != null ? String(totalRaw) : null,
        };
      });
      setOrders(ordersList);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "N/A";
    return Number(amount).toLocaleString("en-US");
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  // Orders in these statuses are still in the matching/proposal phase.
  // Tapping them should open proposals, not the order detail/payment screen.
  const MATCHING_PHASE_STATUSES = ["OPEN", "PENDING_BUYER", "PENDING_FARMER"];

  const handleOrderPress = (item: PlacedOrder) => {
    if (MATCHING_PHASE_STATUSES.includes(item.status)) {
      // Go to MatchedStocks with the specific orderId so it fetches proposals for this order
      router.push({
        pathname: "/buyer/screens/MatchedStocks" as any,
        params: { orderId: item.id },
      });
    } else {
      // Post-acceptance: show order summary, payment, tracking
      router.push({
        pathname: "/buyer/screens/OrderDetailScreen" as any,
        params: { orderId: item.id },
      });
    }
  };

  const renderOrderCard = ({ item }: { item: PlacedOrder }) => {
    const statusStyle = getStatusStyles(item.status);
    const fruitMeta = getFruitMeta(item.fruit_type);
    const hasPendingProposals = item.status === "PENDING_BUYER";

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.8}
        onPress={() => handleOrderPress(item)}
      >
        {/* Top Section: Fruit Icon & Main Details */}
        <View style={styles.cardTop}>
          {/* Vibrant Fruit Avatar */}
          <View style={[styles.fruitAvatar, { backgroundColor: fruitMeta.bg }]}>
            <Text style={styles.fruitEmoji}>{fruitMeta.emoji}</Text>
          </View>

          <View style={styles.cardHeaderInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.productName}>{item.fruit_type}</Text>
              <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>
            <Text style={styles.variantText}>
              {item.variant} • Order #{item.id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Middle Section: Chips */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Ionicons name="scale" size={14} color="#6B7280" />
            <Text style={styles.chipText}>{item.quantity} kg</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.chipText}>Grade {item.grade}</Text>
          </View>
          {item.payment_status === "PAID" && (
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
              <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
              <Text style={[styles.chipText, { color: "#16A34A" }]}>Paid</Text>
            </View>
          )}
        </View>

        {/* Modern Dashed Divider */}
        <View style={styles.dashedDivider} />

        {/* Bottom Section: Dates and Price */}
        <View style={styles.cardFooter}>
          <View style={styles.footerColumn}>
            <Text style={styles.footerLabel}>Required By</Text>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.footerValue}>
                {formatDate(item.required_date)}
              </Text>
            </View>
          </View>

          <View style={[styles.footerColumn, { alignItems: "flex-end" }]}>
            <Text style={styles.footerLabel}>Total Amount</Text>
            <Text style={styles.priceValue}>
              Rs. {formatCurrency(item.totalPrice)}
            </Text>
          </View>
        </View>

        {/* Action banner for orders waiting for buyer to review proposals */}
        {hasPendingProposals && (
          <View style={styles.proposalBanner}>
            <View style={styles.proposalBannerDot} />
            <Text style={styles.proposalBannerText}>
              Farmer proposals waiting — tap to review
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#16A34A" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Orders"
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
          <Ionicons
            name="receipt-outline"
            size={64}
            color="#E5E7EB"
            style={{ marginBottom: 16 }}
          />
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            When you place an order for wholesale fruits, it will appear here.
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
  container: { flex: 1, backgroundColor: BuyerColors.background }, // Slightly darker background to make white cards pop

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  listContent: { padding: 16, paddingBottom: 40 },

  sectionHeader: { paddingVertical: 12, marginBottom: 4 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    letterSpacing: 0.5,
  },

  orderCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },

  // Top Section Layout
  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },

  fruitAvatar: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  fruitEmoji: { fontSize: 24 },

  cardHeaderInfo: { flex: 1, justifyContent: "center" },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  productName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  variantText: { fontSize: 13, fontWeight: "500", color: "#6B7280" },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Chips Section
  chipRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  chipText: { fontSize: 13, fontWeight: "700", color: "#374151" },

  // Divider
  dashedDivider: {
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    margin: -1,
    marginBottom: 16,
  },

  // Footer Layout
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerColumn: { flex: 1, justifyContent: "center" },

  footerLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  dateRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerValue: { fontSize: 15, fontWeight: "700", color: "#1F2937" },

  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: BuyerColors.primaryGreen,
  },

  // Proposal waiting banner
  proposalBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  proposalBannerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16A34A",
  },
  proposalBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#16A34A",
  },
});
