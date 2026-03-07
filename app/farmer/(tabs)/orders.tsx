import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  CheckCircle,
  ShieldCheck,
  Sprout,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
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
import { PillTabBar } from "../../../components/ui/PillTabBar";
import { BuyerColors } from "../../../constants/theme";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_GREEN = BuyerColors.primaryGreen;
const DANGER_RED = "#BE123C";

const SHORT_DATE_FMT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const FULL_DATE_FMT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions = SHORT_DATE_FMT) =>
  new Date(iso).toLocaleDateString("en-US", opts);

// ─── Types ────────────────────────────────────────────────────────────────────

interface Harvest {
  id: string;
  fruit_type: string;
  variant: string;
  quantity: number;
  grade: string;
  estimated_harvest_date: string;
  status: string;
  created_at: string;
  price_per_kg: number;
}

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

type TabKey = "harvests" | "proposals";

// ─── Lookup maps ──────────────────────────────────────────────────────────────

type FruitMeta = { emoji: string; bg: string };
const FRUIT_MAP: Array<[string[], FruitMeta]> = [
  [["banana"],    { emoji: "🍌", bg: "#FEF3C7" }],
  [["mango"],     { emoji: "🥭", bg: "#FFEDD5" }],
  [["pineapple"], { emoji: "🍍", bg: "#FEF08A" }],

];
const DEFAULT_FRUIT: FruitMeta = { emoji: "🌿", bg: "#D1FAE5" };
const getFruitMeta = (name: string): FruitMeta => {
  const lc = name.toLowerCase();
  return FRUIT_MAP.find(([keys]) => keys.some((k) => lc.includes(k)))?.[1] ?? DEFAULT_FRUIT;
};

type StatusMeta = { label: string; color: string; bg: string };
const HARVEST_STATUS: Record<string, StatusMeta> = {
  OPEN:     { label: "Open",     color: "#B45309", bg: "#FEF3C7" },
  FRESH:    { label: "Fresh",    color: "#B45309", bg: "#FEF3C7" },
  // RESERVED: { label: "Reserved", color: "#0F766E", bg: "#CCFBF1" },
  MATCHED:  { label: "Matched",  color: "#166534", bg: "#BBF7D0" },
};
const DEFAULT_STATUS = HARVEST_STATUS.OPEN;

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "harvests",  label: "My Harvests" },
  { key: "proposals", label: "All Proposals" },
];

// ─── Custom hook ──────────────────────────────────────────────────────────────

function useOrdersData() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      let harvestRes: any;
      try {
        harvestRes = await api.get("/api/farmer/estimated-stocks");
      } catch (err: any) {
        if (!silent) setError(err?.message ?? "Failed to load harvests");
        return;
      }

      const stocks: Harvest[] = Array.isArray(harvestRes)
        ? harvestRes
        : (harvestRes?.stocks ?? harvestRes?.data ?? []);
      setHarvests(stocks);

      try {
        const proposalRes = await api.get("/api/farmer/proposals");
        console.log("[Orders] proposals response:", JSON.stringify(proposalRes));
        setProposals(proposalRes?.proposals ?? []);
      } catch {
        setProposals([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const setProcessing = (id: string, on: boolean) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const acceptProposal = useCallback(async (id: string) => {
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
  }, []);

  const rejectProposal = useCallback(async (id: string) => {
    setProcessing(id, true);
    try {
      await api.post(`/api/farmer/proposals/${id}/reject`, {});
      setProposals((prev) => prev.filter((p) => p.id !== id));
      Alert.alert("Success", "Proposal declined. Buyer can select another farmer.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to reject proposal");
    } finally {
      setProcessing(id, false);
    }
  }, []);

  return {
    harvests,
    proposals,
    loading,
    refreshing,
    error,
    processingIds,
    load,
    refresh,
    acceptProposal,
    rejectProposal,
  };
}

// ─── Micro-components ────────────────────────────────────────────────────────

const VerifiedBadge = React.memo(() => (
  <View style={styles.verifiedBadge}>
    <ShieldCheck size={10} color="#fff" />
    <Text style={styles.verifiedText}>Verified</Text>
  </View>
));

const MetricChip = React.memo(({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) => (
  <View style={styles.metricChip}>
    <Ionicons name={icon} size={12} color="#6B7280" />
    <Text style={styles.metricText}>{label}</Text>
  </View>
));

const ProposalActionFooter = React.memo(({
  proposal,
  processing,
  onAccept,
  onReject,
  padded = false,
}: {
  proposal: Proposal;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  padded?: boolean;
}) => {
  if (proposal.status === "ACCEPTED") {
    return (
      <View style={[styles.acceptedBadgeRow, padded && styles.footerPadding]}>
        <CheckCircle size={15} color={PRIMARY_GREEN} />
        <Text style={styles.acceptedBadgeText}>Proposal Accepted</Text>
      </View>
    );
  }
  if (proposal.status !== "PENDING_FARMER") return null;
  return (
    <View style={[styles.proposalActions, padded && styles.footerPadding]}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.acceptBtn]}
        onPress={onAccept}
        disabled={processing}
        accessibilityLabel="Accept proposal"
      >
        {processing ? (
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
        onPress={onReject}
        disabled={processing}
        accessibilityLabel="Decline proposal"
      >
        {processing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <XCircle size={14} color="#fff" />
            <Text style={styles.actionBtnText}>Decline</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
});

// ─── ProposalRow (nested inside HarvestCard) ──────────────────────────────────

const ProposalRow = React.memo(({
  proposal,
  processing,
  onAccept,
  onReject,
  onViewProfile,
}: {
  proposal: Proposal;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
}) => (
  <View style={styles.proposalRow}>
    <TouchableOpacity
      style={styles.proposalBuyerRow}
      onPress={onViewProfile}
      activeOpacity={0.7}
    >
      <VerifiedBadge />
      <Text style={styles.proposalBuyerName}>{proposal.order.buyer.user.name}</Text>
      <Ionicons name="chevron-forward" size={14} color={PRIMARY_GREEN} />
    </TouchableOpacity>

    <View style={styles.proposalDetailsGrid}>
      <View style={styles.proposalDetailItem}>
        <Text style={styles.proposalDetailLabel}>Qty Requested</Text>
        <Text style={styles.proposalDetailValue}>{proposal.quantity_proposed} kg</Text>
      </View>
      <View style={styles.proposalDetailDivider} />
      <View style={styles.proposalDetailItem}>
        <Text style={styles.proposalDetailLabel}>Delivery By</Text>
        <Text style={styles.proposalDetailValue}>
          {formatDate(proposal.order.required_date)}
        </Text>
      </View>
      <View style={styles.proposalDetailDivider} />
      <View style={styles.proposalDetailItem}>
        <Text style={styles.proposalDetailLabel}>Location</Text>
        <Text style={styles.proposalDetailValue} numberOfLines={1}>
          {proposal.order.delivery_location || "—"}
        </Text>
      </View>
    </View>

    <ProposalActionFooter
      proposal={proposal}
      processing={processing}
      onAccept={onAccept}
      onReject={onReject}
    />
  </View>
));

// ─── HarvestCard ──────────────────────────────────────────────────────────────

const HarvestCard = React.memo(({
  harvest,
  proposals,
  onPress,
}: {
  harvest: Harvest;
  proposals: Proposal[];
  onPress: () => void;
}) => {
  const fruit = getFruitMeta(harvest.fruit_type);
  const statusMeta = HARVEST_STATUS[harvest.status] ?? DEFAULT_STATUS;
  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_FARMER").length,
    [proposals],
  );

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {pendingCount > 0 && (
        <View style={styles.cardCountBadge}>
          <Text style={styles.cardCountBadgeText}>{pendingCount}</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <View style={[styles.fruitIcon, { backgroundColor: fruit.bg }]}>
          <Text style={styles.fruitEmoji}>{fruit.emoji}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle}>{harvest.fruit_type}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
              <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
                {statusMeta.label}
              </Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>{harvest.variant} · Grade {harvest.grade}</Text>
          <View style={styles.metricsRow}>
            <MetricChip icon="scale-outline" label={`${harvest.quantity} kg`} />
            <MetricChip
              icon="calendar-outline"
              label={formatDate(harvest.estimated_harvest_date, FULL_DATE_FMT)}
            />
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
});

// ─── StandaloneProposalCard ───────────────────────────────────────────────────

const StandaloneProposalCard = React.memo(({
  proposal,
  processing,
  onAccept,
  onReject,
  onViewProfile,
}: {
  proposal: Proposal;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
}) => (
  <View style={styles.card}>
    <TouchableOpacity style={styles.cardHeader} activeOpacity={0.7} onPress={onViewProfile}>
      <View style={[styles.fruitIcon, styles.personIconBg]}>
        <Ionicons name="person" size={20} color={PRIMARY_GREEN} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{proposal.order.buyer.user.name}</Text>
          <VerifiedBadge />
        </View>
        <Text style={styles.cardSubtitle}>
          {proposal.order.fruit_type} · Grade {proposal.order.grade} · {proposal.order.variant}
        </Text>
        <View style={styles.metricsRow}>
          <MetricChip icon="scale-outline" label={`${proposal.quantity_proposed} kg`} />
          <MetricChip icon="calendar-outline" label={formatDate(proposal.order.required_date)} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={PRIMARY_GREEN} />
    </TouchableOpacity>

    <ProposalActionFooter
      proposal={proposal}
      processing={processing}
      onAccept={onAccept}
      onReject={onReject}
      padded
    />
  </View>
));

// ─── EmptyState ───────────────────────────────────────────────────────────────

const EmptyState = React.memo(({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <View style={styles.stateView}>
    <View style={styles.emptyIconBox}>{icon}</View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
));

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OrdersTab() {
  const router = useRouter();
  const {
    harvests, proposals, loading, refreshing, error, processingIds,
    load, refresh, acceptProposal, rejectProposal,
  } = useOrdersData();
  const [activeTab, setActiveTab] = useState<TabKey>("harvests");

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Derived ────────────────────────────────────────────────────────────────

  const proposalsByStock = useMemo(() => {
    const map: Record<string, Proposal[]> = {};
    proposals.forEach((p) => { (map[p.stock_id] ??= []).push(p); });
    return map;
  }, [proposals]);

  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_FARMER").length,
    [proposals],
  );

  const tabData = useMemo(
    () => TAB_CONFIG.map((t) => ({
      ...t,
      count: t.key === "harvests" ? harvests.length : pendingCount,
    })),
    [harvests.length, pendingCount],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────

  const handleViewProfile = useCallback((proposal: Proposal) => {
    router.push({
      pathname: `/farmer/screens/buyer-trust-profile/${proposal.order.buyer.id}` as any,
      params: {
        buyerName: proposal.order.buyer.user.name,
        buyerLocation: proposal.order.delivery_location || "Location not specified",
        trustScore: "Not rated",
      },
    });
  }, [router]);

  const handleHarvestPress = useCallback((harvest: Harvest) => {
    router.push({
      pathname: "/farmer/screens/harvest-proposals" as any,
      params: {
        harvestId: harvest.id,
        fruitType: harvest.fruit_type,
        variant: harvest.variant,
        grade: harvest.grade,
        quantity: String(harvest.quantity),
        harvestDate: harvest.estimated_harvest_date,
      },
    });
  }, [router]);

  // ── Render items ───────────────────────────────────────────────────────────

  const renderHarvest = useCallback(
    ({ item }: { item: Harvest }) => (
      <HarvestCard
        harvest={item}
        proposals={proposalsByStock[item.id] ?? []}
        onPress={() => handleHarvestPress(item)}
      />
    ),
    [proposalsByStock, handleHarvestPress],
  );

  const renderProposal = useCallback(
    ({ item }: { item: Proposal }) => (
      <StandaloneProposalCard
        proposal={item}
        processing={processingIds.has(item.id)}
        onAccept={() => acceptProposal(item.id)}
        onReject={() => rejectProposal(item.id)}
        onViewProfile={() => handleViewProfile(item)}
      />
    ),
    [processingIds, acceptProposal, rejectProposal, handleViewProfile],
  );

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[PRIMARY_GREEN]}
      tintColor={PRIMARY_GREEN}
    />
  );

  // ── Content ────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.stateView}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.stateText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.stateView}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="alert-circle-outline" size={36} color={DANGER_RED} />
          </View>
          <Text style={[styles.emptyTitle, { color: DANGER_RED }]}>Could not load harvests</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === "harvests") {
      return (
        <FlatList<Harvest>
          data={harvests}
          keyExtractor={(item) => item.id}
          renderItem={renderHarvest}
          contentContainerStyle={harvests.length === 0 ? styles.emptyContainer : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListEmptyComponent={
            <EmptyState
              icon={<Sprout size={36} color="#9CA3AF" />}
              title="No harvests yet"
              subtitle="Add an expected harvest to start receiving buyer proposals."
            />
          }
        />
      );
    }

    return (
      <FlatList<Proposal>
        data={proposals}
        keyExtractor={(item) => item.id}
        renderItem={renderProposal}
        contentContainerStyle={proposals.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="receipt-outline" size={36} color="#9CA3AF" />}
            title="No proposals yet"
            subtitle="Buyer proposals will appear here once matched to your harvests."
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Orders" showNotification onNotificationPress={() => router.push("/farmer/screens/notifications" as any)} />
      <PillTabBar tabs={tabData} activeKey={activeTab} onPress={setActiveTab} />
      {renderContent()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  listContent: { padding: 16, paddingBottom: 80, gap: 14 },
  emptyContainer: { flexGrow: 1 },

  // ── Loading / error / empty state ────────────────────────────────────────
  stateView: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  stateText: { fontSize: 15, color: "#6B7280", fontWeight: "500", marginTop: 12 },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 20,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // ── Card shell ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    overflow: "visible",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  cardSubtitle: { fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 3, marginBottom: 8 },

  // ── Fruit icon ────────────────────────────────────────────────────────────
  fruitIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  fruitEmoji: { fontSize: 22 },
  personIconBg: { backgroundColor: "#F3F4F6" },

  // ── Title row / metrics ───────────────────────────────────────────────────
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" },
  metricsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },

  // ── Status pill ───────────────────────────────────────────────────────────
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },

  // ── Metric chip ───────────────────────────────────────────────────────────
  metricChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metricText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },

  // ── Proposal count badge ──────────────────────────────────────────────────
  proposalBadge: { backgroundColor: "#FEF3C7", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  proposalBadgeText: { fontSize: 12, fontWeight: "700", color: "#B45309" },
  // ── Card notification count badge (top-right corner) ─────────────────────
  cardCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#EF4444",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  cardCountBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },
  expandIcon: { paddingTop: 2, flexShrink: 0 },

  // ── Proposals container ───────────────────────────────────────────────────
  proposalsContainer: { borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#FAFAFA" },
  proposalDivider: { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: 16 },
  emptyProposals: { paddingVertical: 18, alignItems: "center" },
  emptyProposalsText: { fontSize: 13, color: "#9CA3AF", fontStyle: "italic" },

  // ── Proposal row ──────────────────────────────────────────────────────────
  proposalRow: { padding: 14 },
  proposalBuyerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  proposalBuyerName: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111827" },
  proposalDetailsGrid: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  proposalDetailItem: { flex: 1, alignItems: "center" },
  proposalDetailLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  proposalDetailValue: { fontSize: 13, fontWeight: "700", color: "#111827" },
  proposalDetailDivider: { width: 1, backgroundColor: "#E5E7EB" },

  // ── Action buttons ────────────────────────────────────────────────────────
  proposalActions: { flexDirection: "row", gap: 10 },
  footerPadding: { paddingHorizontal: 16, paddingBottom: 14 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    elevation: 2,
  },
  acceptBtn: { backgroundColor: PRIMARY_GREEN },
  rejectBtn: { backgroundColor: DANGER_RED },
  actionBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // ── Accepted state ────────────────────────────────────────────────────────
  acceptedBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: BuyerColors.primaryLight,
    borderRadius: 20,
    gap: 6,
    marginTop: 4,
  },
  acceptedBadgeText: { color: PRIMARY_GREEN, fontSize: 14, fontWeight: "700" },

  // ── Verified badge ────────────────────────────────────────────────────────
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
    flexShrink: 0,
  },
  verifiedText: { fontSize: 10, color: "#fff", fontWeight: "600" },
});
