import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { PillTabBar } from "../../../components/ui/PillTabBar";
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
  farmerPickup?: {
    latitude: number;
    longitude: number;
    location: string;
  };
}

type TabKey = "all" | "pending" | "payment_due" | "in_delivery";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "payment_due", label: "Payment Due" },
  { key: "in_delivery", label: "In Delivery" },
];

const TAB_STATUS_MAP: Record<TabKey, string[]> = {
  all: [],
  pending: ["OPEN", "PENDING_FARMER", "PENDING_BUYER", "MATCHED"],
  payment_due: ["AWAITING_PAYMENT", "UNPAID"],
  in_delivery: [
    "PAID_PENDING_DELIVERY",
    "IN_TRANSIT",
    "DELIVERED",
    "COMPLETED",
  ],
};

// Simplified fruit meta for a cleaner look
const getFruitMeta = (fruit: string) => {
  const f = (fruit || "").toLowerCase();
  if (f.includes("banana")) return { emoji: "🍌", bg: "#FEF3C7" };
  if (f.includes("mango")) return { emoji: "🥭", bg: "#FFEDD5" };
  if (f.includes("pineapple")) return { emoji: "🍍", bg: "#FEF08A" };
  if (f.includes("papaya")) return { emoji: "🥥", bg: "#FFEDD5" };
  return { emoji: "📦", bg: "#F3F4F6" };
};

// 🎨 NEW: Earthy, Professional Agri-Palette (No Blues!)
const STATUS_META: Record<
  string,
  { label: string; color: string; bg: string; icon: any }
> = {
  OPEN: {
    label: "Open",
    color: "#B45309",
    bg: "#FEF3C7",
    icon: "time-outline",
  }, // Warm Amber
  PENDING_FARMER: {
    label: "Awaiting Farmer",
    color: "#9A3412",
    bg: "#FFEDD5",
    icon: "hourglass-outline",
  }, // Soft Orange
  PENDING_BUYER: {
    label: "Review Proposals",
    color: "#047857",
    bg: "#D1FAE5",
    icon: "document-text-outline",
  }, // Emerald
  MATCHED: {
    label: "Matched",
    color: "#0F766E",
    bg: "#CCFBF1",
    icon: "link-outline",
  }, // Deep Teal
  AWAITING_PAYMENT: {
    label: "Payment Due",
    color: "#BE123C",
    bg: "#FFE4E6",
    icon: "wallet-outline",
  }, // Rose/Crimson
  UNPAID: {
    label: "Payment Due",
    color: "#BE123C",
    bg: "#FFE4E6",
    icon: "wallet-outline",
  }, // Rose/Crimson
  PAID_PENDING_DELIVERY: {
    label: "Dispatching",
    color: "#0F766E",
    bg: "#CCFBF1",
    icon: "cube-outline",
  }, // Deep Teal
  IN_TRANSIT: {
    label: "In Transit",
    color: "#047857",
    bg: "#D1FAE5",
    icon: "bus-outline",
  }, // Emerald
  DELIVERED: {
    label: "Delivered",
    color: "#15803D",
    bg: "#DCFCE7",
    icon: "checkmark-circle-outline",
  }, // Forest Green
  COMPLETED: {
    label: "Completed",
    color: "#166534",
    bg: "#BBF7D0",
    icon: "shield-checkmark-outline",
  }, // Dark Green
  CANCELLED: {
    label: "Cancelled",
    color: "#4B5563",
    bg: "#F3F4F6",
    icon: "close-circle-outline",
  }, // Neutral Gray
};

const MATCHING_PHASE = ["OPEN", "PENDING_BUYER", "PENDING_FARMER"];

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const body: any = await api.get(`/api/buyer/place-order`);
      const list: PlacedOrder[] = (body.orders || []).map((o: any) => {
        const raw = o.totalPrice ?? o.total_price ?? null;
        return { ...o, totalPrice: raw != null ? String(raw) : null };
      });
      setOrders(list);
    } catch {
      if (!silent) setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchOrders();
    }, []),
  );

  const filteredOrders = useMemo(() => {
    if (activeTab === "all") return orders;
    return orders.filter((o) => TAB_STATUS_MAP[activeTab].includes(o.status));
  }, [orders, activeTab]);

  const tabCount = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: orders.length,
      pending: 0,
      payment_due: 0,
      in_delivery: 0,
    };
    orders.forEach((o) => {
      (Object.keys(TAB_STATUS_MAP) as TabKey[]).forEach((key) => {
        if (key !== "all" && TAB_STATUS_MAP[key].includes(o.status))
          counts[key]++;
      });
    });
    return counts;
  }, [orders]);

  const formatDate = (s: string) => {
    if (!s) return "—";
    return new Date(s).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "—";
    return Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handlePress = (item: PlacedOrder) => {
    if (MATCHING_PHASE.includes(item.status)) {
      router.push({
        pathname: "/buyer/screens/MatchedStocksScreen" as any,
        params: { orderId: item.id },
      });
    } else {
      const params: any = { orderId: item.id };
      if (item.farmerPickup)
        params.farmerPickup = JSON.stringify(item.farmerPickup);
      router.push({
        pathname: "/buyer/screens/OrderDetailScreen" as any,
        params,
      });
    }
  };

  const renderCard = ({ item }: { item: PlacedOrder }) => {
    const fruit = getFruitMeta(item.fruit_type);
    const meta = STATUS_META[item.status] ?? {
      label: item.status.replace(/_/g, " "),
      color: "#4B5563",
      bg: "#F3F4F6",
      icon: "ellipse-outline",
    };

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => handlePress(item)}
      >
        <View style={styles.cardBody}>
          {/* Header Row: Order ID & Status */}
          <View style={styles.cardTopRow}>
            <Text style={styles.orderId}>
              Order #{item.id.substring(0, 8).toUpperCase()}
            </Text>

            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Ionicons name={meta.icon as any} size={12} color={meta.color} />
              <Text style={[styles.statusLabel, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>

          {/* Main Info Row: Product & Price */}
          <View style={styles.mainInfoRow}>
            <View style={styles.productBlock}>
              <View style={[styles.fruitIcon, { backgroundColor: fruit.bg }]}>
                <Text style={styles.fruitEmoji}>{fruit.emoji}</Text>
              </View>
              <View>
                <Text style={styles.fruitName} numberOfLines={1}>
                  {item.fruit_type}
                </Text>
                <Text style={styles.variantSuffix}>{item.variant}</Text>
              </View>
            </View>

            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Total Amount</Text>
              <Text style={styles.priceValue}>
                Rs. {formatCurrency(item.totalPrice)}
              </Text>
            </View>
          </View>

          {/* Sub Metrics (Chips) */}
          <View style={styles.metricsRow}>
            <View style={styles.metricChip}>
              <Ionicons name="scale-outline" size={14} color="#6B7280" />
              <Text style={styles.metricText}>{item.quantity} kg</Text>
            </View>
            <View style={styles.metricChip}>
              <Ionicons name="star-outline" size={14} color="#6B7280" />
              <Text style={styles.metricText}>Grade {item.grade}</Text>
            </View>
            <View style={styles.metricChip}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.metricText}>
                {formatDate(item.required_date)}
              </Text>
            </View>
          </View>

          {/* 🎨 NEW: Earthy/Nature Contextual Action Banners */}
          {item.status === "AWAITING_PAYMENT" && (
            <View
              style={[
                styles.ctaBanner,
                { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" },
              ]}
            >
              <View style={styles.ctaBannerContent}>
                <Ionicons name="alert-circle" size={16} color="#E11D48" />
                <Text style={[styles.ctaText, { color: "#BE123C" }]}>
                  Payment required to finalize order
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#E11D48" />
            </View>
          )}

          {item.status === "PENDING_BUYER" && (
            <View
              style={[
                styles.ctaBanner,
                { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" },
              ]}
            >
              <View style={styles.ctaBannerContent}>
                <Ionicons name="people" size={16} color="#D97706" />
                <Text style={[styles.ctaText, { color: "#B45309" }]}>
                  New farmer proposals available
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#D97706" />
            </View>
          )}

          {(item.status === "PAID_PENDING_DELIVERY" ||
            item.status === "IN_TRANSIT") && (
            <View
              style={[
                styles.ctaBanner,
                { backgroundColor: "#F0FDFA", borderColor: "#CCFBF1" },
              ]}
            >
              <View style={styles.ctaBannerContent}>
                <Ionicons name="location" size={16} color="#0D9488" />
                <Text style={[styles.ctaText, { color: "#0F766E" }]}>
                  Track your live delivery
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={16} color="#0D9488" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="My Orders"
        showNotification
        onNotificationPress={() => {}}
      />

      <PillTabBar
        tabs={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          count: tabCount[t.key],
        }))}
        activeKey={activeTab}
        onPress={setActiveTab}
      />

      {loading && !refreshing ? (
        <View style={styles.stateView}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.stateText}>Loading your orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={
            filteredOrders.length === 0
              ? styles.emptyListContainer
              : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BuyerColors.primaryGreen]}
              tintColor={BuyerColors.primaryGreen}
            />
          }
          ListEmptyComponent={
            <View style={styles.stateView}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "all"
                  ? "When you place a wholesale order, it will appear here."
                  : "You don't have any orders matching this status."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const GREEN = BuyerColors.primaryGreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  // ── List ─────────────────────────────────────────────────────────────────────
  listContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },

  // ── Card (Enterprise Style) ──────────────────────────────────────────────────
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  cardBody: {
    padding: 16,
  },

  // Header Row
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Main Info (Product + Price)
  mainInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  productBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  fruitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fruitEmoji: {
    fontSize: 22,
  },
  fruitName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  variantSuffix: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  priceBlock: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "900",
    color: GREEN,
  },

  // Metrics (Chips instead of dividers)
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  metricText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },

  // Contextual CTA Banner
  ctaBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  ctaBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // ── Empty / Loading States ───────────────────────────────────────────────────
  stateView: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stateText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
});
