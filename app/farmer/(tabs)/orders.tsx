import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Sprout,
  XCircle
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { PillTabBar } from "../../../components/ui/PillTabBar";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY_GREEN = "#2E7D32"; 
const DANGER_RED = "#DC2626";

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
  image_url?: string[] | string;
}

interface ProposalOrder {
  buyer: { id: string; user: { first_name: string; last_name: string; email: string }; user_id: string; company_name: string };
  grade: string;
  variant: string;
  quantity: number;
  fruit_type: string;
  required_date: string;
  delivery_location: string;
  status?: string; // Maps to the global order status (e.g. AWAITING_PAYMENT, AUTHORIZED_PAYMENT)
}

interface Proposal {
  id: string;
  order_id: string;
  stock_id: string;
  quantity_proposed: number;
  status: "PENDING_FARMER" | "PENDING_BUYER" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";
  expires_at: string;
  created_at: string;
  order: ProposalOrder;
  pricing?: {
    unitPrice: number;
    grossEarning: number;
    platformFee: number;
    farmerEarning: number;
    priceSource: string;
  };
}

type TabKey = "harvests" | "pending" | "payment_due" | "processing" | "completed" | "rejected";

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
  RESERVED: { label: "Reserved", color: "#0F766E", bg: "#CCFBF1" },
  MATCHED:  { label: "Matched",  color: "#166534", bg: "#BBF7D0" },
};
const DEFAULT_STATUS = HARVEST_STATUS.OPEN;

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "harvests",    label: "My Harvests" },
  { key: "pending",     label: "Pending" },
  { key: "payment_due", label: "Payment Due" },
  { key: "processing",  label: "Processing" },
  { key: "completed",   label: "Completed" },
  { key: "rejected",    label: "Rejected" },
];

const getProposalTabKey = (p: Proposal): TabKey | null => {
  if (p.status === "PENDING_FARMER" || p.status === "PENDING_BUYER") return "pending";
  if (p.status === "REJECTED" || p.status === "CANCELLED" || p.status === "EXPIRED") return "rejected";
  if (p.status === "ACCEPTED") {
    const os = p.order?.status;
    if (os === "AWAITING_PAYMENT") return "payment_due";
    if (os === "COMPLETED" || os === "DELIVERED") return "completed";
    return "processing"; // Fallback for AUTHORIZED_PAYMENT, PACKING, IN_TRANSIT, etc.
  }
  return null;
};

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
      // Instead of deleting, we now update the status so it moves to the "Rejected" tab
      setProposals((prev) => 
        prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" as const } : p))
      );
      Alert.alert("Declined", "Proposal moved to Rejected.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to reject proposal");
    } finally {
      setProcessing(id, false);
    }
  }, []);

  const setProcessing = (id: string, on: boolean) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

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

// ─── HarvestCard ──────────────────────────────────────────────────────────────

const HarvestCard = React.memo(({
  harvest,
  proposals,
  onPress,
  onImagePress,
}: {
  harvest: Harvest;
  proposals: Proposal[];
  onPress: () => void;
  onImagePress: (imageUrls: string[]) => void;
}) => {
  const fruit = getFruitMeta(harvest.fruit_type);
  const statusMeta = HARVEST_STATUS[harvest.status] ?? DEFAULT_STATUS;
  const pendingCount = useMemo(
    () => proposals.filter((p) => p.status === "PENDING_FARMER").length,
    [proposals],
  );

  const images = Array.isArray(harvest.image_url) 
    ? harvest.image_url 
    : (harvest.image_url ? [harvest.image_url] : []);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {pendingCount > 0 && (
        <View style={styles.cardCountBadge}>
          <Text style={styles.cardCountBadgeText}>{pendingCount}</Text>
        </View>
      )}
      
      <View style={styles.cardStretchContainer}> 
        <TouchableOpacity 
          style={styles.imageWrapper} 
          activeOpacity={0.8}
          onPress={() => images.length > 0 && onImagePress(images)}
          disabled={images.length === 0}
        >
          {images.length > 0 ? (
            <>
              <Image source={{ uri: images[0] }} style={styles.productImage} />
              {images.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <ImageIcon size={10} color="#fff" style={{ marginRight: 2 }} />
                  <Text style={styles.imageCountText}>+{images.length - 1}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: fruit.bg }]}>
              <Text style={styles.avatarEmoji}>{fruit.emoji}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.cardRightColumn}>
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

          <View style={styles.chevronPadding}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
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
}) => {
  const buyerName = proposal.order?.buyer?.company_name || proposal.order?.buyer?.user?.first_name || "Verified Buyer";

  return (
    <View style={styles.card}>
      {/* --- Card Header (CRM Style) --- */}
      <TouchableOpacity
        style={styles.proposalHeader}
        activeOpacity={0.7}
        onPress={onViewProfile}
      >
        <View style={styles.headerLeft}>
          <View style={styles.buyerAvatar}>
            <Text style={styles.buyerAvatarText}>
              {buyerName.charAt(0).toUpperCase()}
            </Text>
            <View style={styles.verifiedBadgeDot}>
              <ShieldCheck size={10} color="#FFFFFF" />
            </View>
          </View>
          
          <View style={styles.buyerInfo}>
            <Text style={styles.buyerName}>{buyerName}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {proposal.order?.delivery_location || "Location not specified"}
              </Text>
            </View>
          </View>
        </View>
        <ChevronRight size={20} color="#D1D5DB" />
      </TouchableOpacity>

      <View style={styles.solidDivider} />

      {/* --- Card Body & Tags --- */}
      <View style={styles.productInfo}>
        <Text style={styles.orderTitleText}>
          {proposal.order?.variant} {proposal.order?.fruit_type} • Grade {proposal.order?.grade}
        </Text>

        <View style={styles.tagRow}>
          <View style={styles.yieldTag}>
            <PackageOpen size={12} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.yieldTagText}>
              {proposal.quantity_proposed} kg
            </Text>
          </View>

          <View style={styles.dateTag}>
            <Calendar size={12} color="#4B5563" style={{ marginRight: 4 }} />
            <Text style={styles.dateTagText}>
              {formatDate(proposal.order?.required_date || new Date().toISOString())}
            </Text>
          </View>
        </View>

        {/* --- Minimalist Farmer Pricing Box --- */}
        <View style={styles.invoiceBox}>
          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.invoiceTotalLabel}>Net Earnings</Text>
              <Text style={styles.invoiceSubLabel}>
                Net of platform fees
              </Text>
            </View>
            <Text style={styles.invoiceTotalValue}>
              Rs. {(proposal.pricing?.farmerEarning || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      {/* --- Actions & Status --- */}
      <View style={styles.cardFooter}>
        {proposal.status === "ACCEPTED" ? (
          proposal.order?.status === "AWAITING_PAYMENT" ? (
            <View style={[styles.statusWarning, { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }]}>
              <Ionicons name="wallet" size={16} color="#E11D48" />
              <Text style={[styles.statusWarningText, { color: "#BE123C" }]}>Awaiting Buyer Payment</Text>
            </View>
          ) : proposal.order?.status === "COMPLETED" || proposal.order?.status === "DELIVERED" ? (
            <View style={styles.statusSuccess}>
              <CheckCircle2 size={16} color={PRIMARY_GREEN} />
              <Text style={styles.statusSuccessText}>Order Completed</Text>
            </View>
          ) : (
            <View style={[styles.statusWarning, { backgroundColor: "#F0FDFA", borderColor: "#CCFBF1" }]}>
              <Ionicons name="cube" size={16} color="#0D9488" />
              <Text style={[styles.statusWarningText, { color: "#0F766E" }]}>Processing Delivery</Text>
            </View>
          )
        ) : proposal.status === "PENDING_FARMER" ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={onReject}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? (
                <ActivityIndicator size="small" color={DANGER_RED} />
              ) : (
                <Text style={styles.rejectBtnText}>Decline</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={onAccept}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#fff" />
                  <Text style={styles.acceptBtnText}>Accept Deal</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : proposal.status === "EXPIRED" ? (
          <View style={styles.statusExpired}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.statusExpiredText}>Proposal Expired</Text>
          </View>
        ) : proposal.status === "CANCELLED" ? (
          <View style={styles.statusExpired}>
            <XCircle size={16} color="#6B7280" />
            <Text style={styles.statusExpiredText}>Proposal Cancelled</Text>
          </View>
        ) : (
          <View style={styles.statusError}>
            <XCircle size={16} color={DANGER_RED} />
            <Text style={styles.statusErrorText}>Proposal Declined</Text>
          </View>
        )}
      </View>
    </View>
  );
});

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
  
  // Gallery Modal State
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [matchedModalVisible, setMatchedModalVisible] = useState(false);
  const [matchedProposals, setMatchedProposals] = useState<Proposal[]>([]);
  const [selectedHarvest, setSelectedHarvest] = useState<Harvest | null>(null);

  const handleImagePress = useCallback((imageUrls: string[]) => {
    setCurrentImages(imageUrls);
    setCurrentImageIndex(0);
    setImageModalVisible(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Automatically count tabs dynamically based on the proposal status logic
  const tabCount = useMemo(() => {
    const counts: Record<TabKey, number> = {
      harvests: harvests.length,
      pending: 0,
      payment_due: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
    };
    proposals.forEach((p) => {
      const tab = getProposalTabKey(p);
      if (tab && tab !== "harvests") {
        counts[tab] += 1;
      }
    });
    return counts;
  }, [harvests, proposals]);

  // Only render tabs that have a count > 0 (or the core My Harvests tab)
  const tabData = useMemo(() => {
    return TAB_CONFIG.map((t) => ({
      ...t,
      count: tabCount[t.key],
    })).filter((t) => t.key === "harvests" || t.count > 0);
  }, [tabCount]);

  // Smart Fallback: If the user empties a tab (like declining the last pending item),
  // they are automatically navigated back to the My Harvests tab so they don't get stuck on an empty screen.
  useEffect(() => {
    if (!tabData.some((t) => t.key === activeTab)) {
      setActiveTab("harvests");
    }
  }, [tabData, activeTab]);

  const proposalsByStock = useMemo(() => {
    const map: Record<string, Proposal[]> = {};
    proposals.forEach((p) => { (map[p.stock_id] ??= []).push(p); });
    return map;
  }, [proposals]);

  const handleViewProfile = useCallback((proposal: Proposal) => {
    router.push({
      pathname: `/farmer/screens/buyer-trust-profile/${proposal.order?.buyer?.id}` as any,
      params: {
        buyerName: proposal.order?.buyer?.company_name || "Buyer",
        buyerLocation: proposal.order?.delivery_location || "Location not specified",
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

  const openMatchedModal = useCallback((harvest: Harvest) => {
    setSelectedHarvest(harvest);
    setMatchedProposals(proposalsByStock[harvest.id] ?? []);
    setMatchedModalVisible(true);
  }, [proposalsByStock]);

  const renderHarvest = useCallback(
    ({ item }: { item: Harvest }) => (
      <HarvestCard
        harvest={item}
        proposals={proposalsByStock[item.id] ?? []}
        onPress={() => {
          if (item.status === 'MATCHED') openMatchedModal(item);
          else handleHarvestPress(item);
        }}
        onImagePress={handleImagePress}
      />
    ),
    [proposalsByStock, handleHarvestPress, handleImagePress, openMatchedModal],
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

    // Filter proposals based on active new tab
    const filteredProposals = proposals.filter((p) => getProposalTabKey(p) === activeTab);

    return (
      <FlatList<Proposal>
        data={filteredProposals}
        keyExtractor={(item) => item.id}
        renderItem={renderProposal}
        contentContainerStyle={filteredProposals.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
        ListEmptyComponent={
          <EmptyState
            icon={<Ionicons name="receipt-outline" size={36} color="#9CA3AF" />}
            title="No proposals found"
            subtitle="You don't have any proposals matching this status."
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

      {/* Swipeable Image Gallery Modal */}
      <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)} statusBarTranslucent>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setImageModalVisible(false)} activeOpacity={0.7}>
            <Text style={styles.imageModalCloseText}>✕</Text>
          </TouchableOpacity>
          {currentImages.length > 1 && (
            <Text style={styles.imageModalCounter}>{currentImageIndex + 1} / {currentImages.length}</Text>
          )}
          <FlatList
            data={currentImages} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            initialScrollIndex={currentImageIndex}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(index);
            }}
            keyExtractor={(uri, i) => `${uri}-${i}`}
            renderItem={({ item: uri }) => (
              <View style={styles.imageModalPage}>
                <Image source={{ uri }} style={styles.imageModalFull} resizeMode="contain" />
              </View>
            )}
          />
        </View>
      </Modal>
      {/* Matched Harvests Modal — shows summary for farmers when a harvest is MATCHED */}
      <Modal
        visible={matchedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMatchedModalVisible(false)}
        statusBarTranslucent
      >
        <View style={[styles.imageModalOverlay, { justifyContent: 'flex-end', paddingBottom: 24 }] }>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Matched Orders</Text>
              <TouchableOpacity onPress={() => setMatchedModalVisible(false)}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#6B7280' }}>Close</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              {matchedProposals.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#6B7280' }}>No matched proposals found for this harvest.</Text>
                </View>
              ) : (
                matchedProposals.map((p) => (
                  <View key={p.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{p.order?.fruit_type} • {p.order?.variant}</Text>
                    <Text style={{ marginTop: 6, color: '#6B7280' }}>{p.quantity_proposed} kg • {p.order?.delivery_location}</Text>
                    <Text style={{ marginTop: 6, color: '#111827', fontWeight: '700' }}>{p.pricing?.farmerEarning ? `Net: Rs. ${p.pricing.farmerEarning.toFixed(2)}` : ''}</Text>
                    <View style={{ marginTop: 10, flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => { setMatchedModalVisible(false); handleViewProfile(p); }} style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: PRIMARY_GREEN, borderRadius: 10 }}>
                        <Text style={{ color: '#fff', fontWeight: '700' }}>View Buyer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
    overflow: "hidden", // Crucial for flush image left border radius
  },

  // ── NEW: Flush Image Container for HarvestCard ────────────────────────────
  cardStretchContainer: {
    flexDirection: "row",
    alignItems: "stretch", // Forces image column to match text column height
  },
  imageWrapper: {
    width: 100, // Wide enough to look balanced
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: 'center'
  },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageCountBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  imageCountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  avatarFallback: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
  avatarEmoji: { fontSize: 32 },

  // Right column of HarvestCard
  cardRightColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 16,
  },
  cardBody: { flex: 1 },
  chevronPadding: { paddingRight: 16 },

  // ── Proposal specific CRM Header ──
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  buyerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    position: "relative",
  },
  buyerAvatarText: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_GREEN,
  },
  verifiedBadgeDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  buyerInfo: { flex: 1, paddingRight: 8 },
  buyerName: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  solidDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },

  // --- CARD BODY & TAGS ---
  productInfo: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  yieldTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  yieldTagText: { 
    fontSize: 13, 
    fontWeight: "700", 
    color: "#059669" 
  },
  dateTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dateTagText: { 
    fontSize: 13, 
    fontWeight: "600", 
    color: "#4B5563" 
  },
  orderTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  // --- INVOICE PRICING BOX ---
  invoiceBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 14,
  },
  invoiceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceTotalLabel: { 
    fontSize: 13, 
    color: "#4B5563", 
    fontWeight: "700" 
  },
  invoiceSubLabel: { 
    fontSize: 11, 
    color: "#9CA3AF", 
    fontWeight: "500", 
    marginTop: 2 
  },
  invoiceTotalValue: { 
    fontSize: 18, 
    color: PRIMARY_GREEN, 
    fontWeight: "900" 
  },

  // --- ACTIONS & STATUS ---
  cardFooter: { marginTop: 2, paddingHorizontal: 16, paddingBottom: 14 },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  acceptBtn: { 
    backgroundColor: PRIMARY_GREEN,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  acceptBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  rejectBtn: { 
    backgroundColor: "#FFFFFF", 
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectBtnText: { color: DANGER_RED, fontSize: 14, fontWeight: "700" },

  // Status Badges
  statusSuccess: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 10,
    gap: 8,
  },
  statusSuccessText: { color: PRIMARY_GREEN, fontSize: 14, fontWeight: "700" },
  statusWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 10,
    gap: 8,
  },
  statusWarningText: { fontSize: 14, fontWeight: "700" },
  statusError: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    gap: 8,
  },
  statusErrorText: { color: DANGER_RED, fontSize: 14, fontWeight: "700" },
  statusExpired: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    gap: 8,
  },
  statusExpiredText: { color: "#6B7280", fontSize: 14, fontWeight: "700" },

  // ── Title row / metrics ───────────────────────────────────────────────────
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  cardSubtitle: { fontSize: 13, color: "#6B7280", fontWeight: "500", marginTop: 3, marginBottom: 8 },
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
    borderColor: "#FFFFFF",
    elevation: 4,
  },
  cardCountBadgeText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF" },

  // ── Gallery Modal styles ──────────────────────────────────────────────────
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.95)",
    justifyContent: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 52,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalCloseText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  imageModalCounter: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    zIndex: 10,
  },
  imageModalPage: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalFull: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
});