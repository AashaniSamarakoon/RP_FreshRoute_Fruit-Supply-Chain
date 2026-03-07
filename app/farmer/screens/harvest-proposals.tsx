import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    CheckCircle,
    MapPin,
    ShieldCheck,
    XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { BuyerColors } from "../../../constants/theme";

const PRIMARY_GREEN = BuyerColors.primaryGreen;
const DANGER_RED = "#BE123C";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

interface ProposalOrder {
  buyer: { id: string; user: { name: string; email: string } };
  grade: string;
  variant: string;
  quantity: number;
  fruit_type: string;
  required_date: string;
  delivery_location: string;
}

interface Proposal {
  id: string;
  order_id: string;
  stock_id: string;
  quantity_proposed: number;
  status: "PENDING_FARMER" | "ACCEPTED" | "REJECTED";
  expires_at: string;
  created_at: string;
  order: ProposalOrder;
}

export default function HarvestProposalsScreen() {
  const router = useRouter();
  const {
    harvestId,
    fruitType,
    variant,
    grade,
    quantity,
    harvestDate,
  } = useLocalSearchParams<{
    harvestId: string;
    fruitType: string;
    variant: string;
    grade: string;
    quantity: string;
    harvestDate: string;
  }>();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const setProcessing = (id: string, on: boolean) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get("/api/farmer/proposals");
      const all: Proposal[] = res?.proposals ?? [];
      setProposals(all.filter((p) => p.stock_id === harvestId));
    } catch {
      setProposals([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [harvestId]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const acceptProposal = async (id: string) => {
    setProcessing(id, true);
    try {
      await api.post(`/api/farmer/proposals/${id}/accept`, {});
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "ACCEPTED" as const } : p)),
      );
      Alert.alert("Success", "Proposal accepted successfully!");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to accept proposal");
    } finally {
      setProcessing(id, false);
    }
  };

  const rejectProposal = async (id: string) => {
    setProcessing(id, true);
    try {
      await api.post(`/api/farmer/proposals/${id}/reject`, {});
      setProposals((prev) => prev.filter((p) => p.id !== id));
      Alert.alert("Success", "Proposal declined.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to reject proposal");
    } finally {
      setProcessing(id, false);
    }
  };

  const navigateToBuyerProfile = (proposal: Proposal) => {
    router.push({
      pathname: `/farmer/screens/buyer-trust-profile/${proposal.order.buyer.id}` as any,
      params: {
        buyerName: proposal.order.buyer.user.name,
        buyerLocation: proposal.order.delivery_location || "Location not specified",
        trustScore: "Not rated",
      },
    });
  };

  const renderProposal = ({ item }: { item: Proposal }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.card}>
        {/* Buyer info row */}
        <TouchableOpacity
          style={styles.buyerRow}
          activeOpacity={0.7}
          onPress={() => navigateToBuyerProfile(item)}
        >
          <View style={styles.buyerAvatar}>
            <Ionicons name="person" size={18} color={PRIMARY_GREEN} />
          </View>
          <View style={styles.buyerInfo}>
            <View style={styles.buyerNameRow}>
              <Text style={styles.buyerName}>{item.order.buyer.user.name}</Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={10} color="#fff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text style={styles.buyerEmail}>{item.order.buyer.user.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={PRIMARY_GREEN} />
        </TouchableOpacity>

        {/* Details grid */}
        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Qty Requested</Text>
            <Text style={styles.gridValue}>{item.quantity_proposed} kg</Text>
          </View>
          <View style={styles.gridDivider} />
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Delivery By</Text>
            <Text style={styles.gridValue}>
              {formatDate(item.order.required_date)}
            </Text>
          </View>
          <View style={styles.gridDivider} />
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Location</Text>
            <View style={styles.locationRow}>
              <MapPin size={11} color="#6B7280" />
              <Text style={styles.gridValue} numberOfLines={1}>
                {item.order.delivery_location || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {item.status === "ACCEPTED" ? (
          <View style={styles.acceptedBadge}>
            <CheckCircle size={15} color={PRIMARY_GREEN} />
            <Text style={styles.acceptedBadgeText}>Proposal Accepted</Text>
          </View>
        ) : item.status === "PENDING_FARMER" ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => acceptProposal(item.id)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => rejectProposal(item.id)}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <XCircle size={14} color="#fff" />
                  <Text style={styles.actionBtnText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.rejectedBadge}>
            <Text style={styles.rejectedBadgeText}>Proposal Rejected</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header
        title={`${fruitType} Proposals`}
        onBack={() => router.back()}
      />

      {/* Harvest summary pill */}
      <View style={styles.harvestSummary}>
        <Text style={styles.harvestSummaryText}>
          {variant} · Grade {grade} · {quantity} kg
        </Text>
        {harvestDate ? (
          <Text style={styles.harvestSummaryDate}>
            Harvest: {formatDate(harvestDate)}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.centerView}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Loading proposals...</Text>
        </View>
      ) : (
        <FlatList
          data={proposals}
          keyExtractor={(item) => item.id}
          renderItem={renderProposal}
          contentContainerStyle={
            proposals.length === 0 ? styles.emptyContainer : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_GREEN]}
              tintColor={PRIMARY_GREEN}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerView}>
              <View style={styles.emptyCircle}>
                <Ionicons name="receipt-outline" size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Proposals Yet</Text>
              <Text style={styles.emptyMessage}>
                Buyers will be matched to this harvest automatically. You'll receive a notification when a proposal arrives.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  listContent: { padding: 16, paddingBottom: 60, gap: 14 },
  emptyContainer: { flexGrow: 1 },

  harvestSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  harvestSummaryText: { fontSize: 14, fontWeight: "600", color: "#374151" },
  harvestSummaryDate: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  centerView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: { fontSize: 15, color: "#6B7280", marginTop: 12, fontWeight: "500" },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 21 },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  // Buyer row
  buyerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  buyerInfo: { flex: 1 },
  buyerNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  buyerName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  buyerEmail: { fontSize: 12, color: "#9CA3AF" },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: { fontSize: 10, color: "#fff", fontWeight: "600" },

  // Details grid
  grid: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  gridItem: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  gridLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  gridValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  gridDivider: { width: 1, backgroundColor: "#E5E7EB" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },

  // Action buttons
  actions: { flexDirection: "row", gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
  },
  acceptBtn: { backgroundColor: PRIMARY_GREEN },
  rejectBtn: { backgroundColor: DANGER_RED },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Status badges
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 20,
    gap: 6,
  },
  acceptedBadgeText: { color: PRIMARY_GREEN, fontSize: 14, fontWeight: "700" },
  rejectedBadge: {
    paddingVertical: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 20,
    alignItems: "center",
  },
  rejectedBadgeText: { color: DANGER_RED, fontSize: 14, fontWeight: "700" },
});
