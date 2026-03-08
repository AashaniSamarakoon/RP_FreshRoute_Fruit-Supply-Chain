import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Sprout } from "lucide-react-native";
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

import HarvestCard from "../components/HarvestCard";
import ProposalCard from "../components/ProposalCard";

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
  image_url?: any;
}

interface ProposalOrder {
  buyer: { id: string; user: { first_name: string; last_name: string; email: string }; user_id: string; company_name: string };
  grade: string;
  variant: string;
  quantity: number;
  fruit_type: string;
  required_date: string;
  delivery_location: string;
  status?: string; 
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

// ─── Helper: Safely Parse Image Arrays ────────────────────────────────────────
const parseImageUrls = (rawImage: any): string[] => {
  if (!rawImage) return [];
  try {
    if (typeof rawImage === 'string') {
      if (rawImage.startsWith('[')) {
        return JSON.parse(rawImage);
      }
      return [rawImage];
    }
    if (Array.isArray(rawImage)) {
      return rawImage.flat(Infinity).filter(Boolean);
    }
  } catch (e) {
    console.warn("Failed to parse image URLs", e);
  }
  return [];
};

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

const ORDER_STATUS_META: Record<string, StatusMeta> = {
  AWAITING_PAYMENT: { label: "Payment Due", color: "#BE123C", bg: "#FFE4E6" },
  PACKING: { label: "Packing", color: "#92400E", bg: "#FEF3C7" },
  READY_FOR_PICKUP: { label: "Ready", color: "#065F46", bg: "#D1FAE5" },
  IN_TRANSIT: { label: "In Transit", color: "#1D4ED8", bg: "#DBEAFE" },
  DELIVERED: { label: "Delivered", color: "#166534", bg: "#BBF7D0" },
  COMPLETED: { label: "Completed", color: "#166534", bg: "#BBF7D0" },
  AUTHORIZED_PAYMENT: { label: "Authorized", color: "#B45309", bg: "#FEF3C7" },
  PICKED_UP: { label: "Picked Up", color: "#4F46E5", bg: "#E0E7FF" },
};

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "harvests",    label: "My Harvests" },
  { key: "pending",     label: "Pending" },
  { key: "payment_due", label: "Payment Due" },
  { key: "processing",  label: "Processing" },
  { key: "completed",   label: "Completed" },
  { key: "rejected",    label: "Rejected" },
];

const getProposalTabKey = (p: Proposal): TabKey | null => {
  const os = p.order?.status;

  // 1. Check if rejected/cancelled at either the proposal level OR the active order level
  if (
    p.status === "REJECTED" || 
    p.status === "CANCELLED" || 
    p.status === "EXPIRED" || 
    os === "REJECTED" || 
    os === "CANCELLED"
  ) {
    return "rejected";
  }

  // 2. Pending Proposals
  if (p.status === "PENDING_FARMER" || p.status === "PENDING_BUYER") {
    return "pending";
  }

  // 3. Accepted Deals / Active Orders
  if (p.status === "ACCEPTED") {
    if (os === "AWAITING_PAYMENT") return "payment_due";
    
    // Treat PICKED_UP (and any final states) as "Completed" for the Farmer
    if (os === "PICKED_UP") {
      return "completed";
    }
    
    // Everything else (AUTHORIZED_PAYMENT, PACKING, READY_FOR_PICKUP) goes to Processing
    return "processing"; 
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
      
      const activeStocks = stocks.filter(s => s.status !== "MATCHED");
      setHarvests(activeStocks);

      try {
        const proposalRes = await api.get("/api/farmer/proposals");
        let ordersRes: any = null;
        try {
          ordersRes = await api.get("/api/farmer/orders");
        } catch (err) {
          ordersRes = null;
        }

        const ordersArr: any[] = Array.isArray(ordersRes)
          ? ordersRes
          : (ordersRes?.orders ?? ordersRes ?? []);
        
        const ordersMap: Record<string, any> = {};
        ordersArr.forEach((o: any) => { if (o && o.id) ordersMap[String(o.id)] = o; });

        const rawProposals: Proposal[] = proposalRes?.proposals ?? [];
        
        const mergedProposals = rawProposals.map((p: Proposal) => {
          const orderFromApi = ordersMap[String(p.order_id)];
          const mergedOrder = {
            ...(p.order || {}),
            status: orderFromApi?.status ?? p.order?.status,
          };
          return { ...p, order: mergedOrder } as Proposal;
        });

        const existingProposalOrderIds = new Set(mergedProposals.map(p => String(p.order_id)));
        
        const syntheticProposalsFromOrders = ordersArr
          .filter(o => !existingProposalOrderIds.has(String(o.id)))
          .map((o: any) => ({
            id: `syn_${o.id}`,
            order_id: o.id,
            stock_id: o.harvest_id || "",
            quantity_proposed: o.quantity,
            status: "ACCEPTED", 
            expires_at: o.created_at,
            created_at: o.created_at,
            pricing: o.pricing || null,
            order: {
              buyer: o.buyer || { id: o.buyer_id, user: { first_name: "Buyer", last_name: "", email: "" }, user_id: o.buyer_id, company_name: "Verified Buyer" },
              grade: o.grade,
              variant: o.variant,
              quantity: o.quantity,
              fruit_type: o.fruit_type,
              required_date: o.required_date,
              delivery_location: o.delivery_location,
              status: o.status,
            }
          } as Proposal));

        setProposals([...mergedProposals, ...syntheticProposalsFromOrders]);
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
      await load(true); 
      Alert.alert("Success", "Proposal accepted! Awaiting buyer payment.");
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to accept proposal");
    } finally {
      setProcessing(id, false);
    }
  }, [load]);

  const rejectProposal = useCallback(async (id: string) => {
    setProcessing(id, true);
    try {
      await api.post(`/api/farmer/proposals/${id}/reject`, {});
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

  // ─── NEW RESTORED: Status Transition APIs ───
  const startPacking = useCallback(async (orderId: string) => {
    setProcessing(orderId, true);
    try {
      await api.patch(`/api/farmer/orders/${orderId}/packing`, {});
      await load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update status");
    } finally {
      setProcessing(orderId, false);
    }
  }, [load]);

  const markReady = useCallback(async (orderId: string) => {
    setProcessing(orderId, true);
    try {
      await api.patch(`/api/farmer/orders/${orderId}/ready`, {});
      await load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update status");
    } finally {
      setProcessing(orderId, false);
    }
  }, [load]);

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
    startPacking, // Restored!
    markReady,    // Restored!
  };
}

// ─── ActiveOrderCard (Handles Statuses and Footer Buttons) ────────────────────

const ActiveOrderCard = React.memo(({
  proposal,
  harvest,
  processing,
  onPress,
  onImagePress,
  onStartPacking,
  onMarkReady,
}: {
  proposal: Proposal;
  harvest?: Harvest;
  processing: boolean;
  onPress: () => void;
  onImagePress: (imageUrls: string[]) => void;
  onStartPacking: () => void;
  onMarkReady: () => void;
}) => {
  const fruit_type = proposal.order?.fruit_type || harvest?.fruit_type || "Product";
  const variant = proposal.order?.variant || harvest?.variant || "";
  const grade = proposal.order?.grade || harvest?.grade || "";
  const quantity = proposal.order?.quantity || proposal.quantity_proposed;
  const status = proposal.order?.status || proposal.status;
  const reqDate = proposal.order?.required_date || proposal.created_at;

  const fruit = getFruitMeta(fruit_type);
  const statusMeta = ORDER_STATUS_META[status] || { label: status.replace(/_/g, ' '), color: "#4B5563", bg: "#F3F4F6" };
  
  const images = parseImageUrls(harvest?.image_url);
  const buyerName = proposal.order?.buyer?.company_name || proposal.order?.buyer?.user?.first_name || "Verified Buyer";

  return (
    <View style={styles.card}>
      {/* Top Section navigates to Order Details */}
      <TouchableOpacity style={styles.cardStretchContainer} activeOpacity={0.85} onPress={onPress}> 
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
                  <Ionicons name="image-outline" size={10} color="#fff" style={{ marginRight: 2 }} />
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
              <Text style={styles.cardTitle}>{fruit_type}</Text>
              <View style={[styles.statusPill, { backgroundColor: statusMeta.bg }]}>
                <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{variant} · Grade {grade}</Text>
            <View style={styles.metricsRow}>
              <View style={styles.metricChip}>
                <Ionicons name="scale-outline" size={12} color="#6B7280" />
                <Text style={styles.metricText}>{quantity} kg</Text>
              </View>
              <View style={styles.metricChip}>
                <Ionicons name="calendar-outline" size={12} color="#6B7280" />
                <Text style={styles.metricText}>{formatDate(reqDate, FULL_DATE_FMT)}</Text>
              </View>
            </View>
            
            <View style={styles.buyerInfoRow}>
              <Ionicons name="person-circle-outline" size={14} color="#6B7280" />
              <Text style={styles.buyerInfoText} numberOfLines={1}>{buyerName}</Text>
            </View>
          </View>

          <View style={styles.chevronPadding}>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Conditional Action Buttons at the bottom */}
      {(status === "AUTHORIZED_PAYMENT" || status === "PACKING") && (
        <View style={styles.activeOrderFooter}>
          {status === "AUTHORIZED_PAYMENT" && (
            <TouchableOpacity style={styles.fullWidthBtn} onPress={onStartPacking} disabled={processing}>
              {processing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="cube-outline" size={18} color="#fff" />
                  <Text style={styles.fullWidthBtnText}>Start Packing</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {status === "PACKING" && (
            <TouchableOpacity style={styles.fullWidthBtn} onPress={onMarkReady} disabled={processing}>
              {processing ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={styles.fullWidthBtnText}>Mark Ready for Pickup</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
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
    load, refresh, acceptProposal, rejectProposal, startPacking, markReady
  } = useOrdersData();
  
  const [activeTab, setActiveTab] = useState<TabKey>("harvests");
  
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImagePress = useCallback((imageUrls: string[]) => {
    setCurrentImages(imageUrls);
    setCurrentImageIndex(0);
    setImageModalVisible(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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

  const tabData = useMemo(() => {
    return TAB_CONFIG.map((t) => ({
      ...t,
      count: tabCount[t.key],
    })).filter((t) => t.key === "harvests" || t.count > 0);
  }, [tabCount]);

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

  const renderHarvest = useCallback(
    ({ item }: { item: Harvest }) => {
      return (
        <HarvestCard
          harvest={item}
          proposals={proposalsByStock[item.id] ?? []}
          onPress={() => handleHarvestPress(item)}
          onImagePress={handleImagePress}
        />
      );
    },
    [proposalsByStock, handleHarvestPress, handleImagePress],
  );

const renderProposal = useCallback(
    ({ item }: { item: Proposal }) => {
      const tabKey = getProposalTabKey(item);
      const isOrderPhase = tabKey === "payment_due" || tabKey === "processing" || tabKey === "completed";

      const handleCardPress = () => {
        if (isOrderPhase && item.order_id) {
          router.push(`/buyer/screens/OrderDetailScreen?orderId=${encodeURIComponent(String(item.order_id))}`);
        } else {
          const harvestToPass = harvests.find(h => h.id === item.stock_id) || {
            id: item.stock_id,
            fruit_type: item.order?.fruit_type || "",
            variant: item.order?.variant || "",
            grade: item.order?.grade || "",
            quantity: item.order?.quantity || item.quantity_proposed,
            estimated_harvest_date: item.order?.required_date || "",
          } as Harvest;
          
          handleHarvestPress(harvestToPass);
        }
      };

      if (isOrderPhase) {
         // Using the inline ActiveOrderCard handles Orders flawlessly!
         const harvest = harvests.find(h => h.id === item.stock_id);
         return (
           <ActiveOrderCard
             proposal={item}
             harvest={harvest}
             processing={processingIds.has(String(item.order_id))}
             onPress={handleCardPress}
             onImagePress={handleImagePress}
             onStartPacking={() => startPacking(String(item.order_id))}
             onMarkReady={() => markReady(String(item.order_id))}
           />
         );
      }

      return (
        <TouchableOpacity activeOpacity={0.95} onPress={handleCardPress}>
          <ProposalCard
            proposal={item}
            processing={processingIds.has(item.id)}
            onAccept={() => acceptProposal(item.id)}
            onReject={() => rejectProposal(item.id)}
            onViewProfile={() => handleViewProfile(item)}
          />
        </TouchableOpacity>
      );
    },
    [processingIds, acceptProposal, rejectProposal, handleViewProfile, router, harvests, handleImagePress, handleHarvestPress, startPacking, markReady],
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
            title="No orders found"
            subtitle="You don't have any orders matching this status."
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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  listContent: { padding: 16, paddingBottom: 80, gap: 0 },
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
    overflow: "hidden", 
  },

  // ── Flush Image Container for HarvestCard & ActiveOrderCard ────────────
  cardStretchContainer: {
    flexDirection: "row",
    alignItems: "stretch", 
    minHeight: 130, // Keeps the card nice and tall
  },
  imageWrapper: {
    width: 110,
    backgroundColor: "#F9FAFB",
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    position: "relative",
  },
  productImage: { 
    ...StyleSheet.absoluteFillObject, 
    width: "100%", 
    height: "100%", 
    resizeMode: "cover" 
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  imageCountText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  
  avatarFallback: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  avatarEmoji: { fontSize: 38 },

  // Right column of HarvestCard
  cardRightColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingLeft: 16,
  },
  cardBody: { flex: 1 },
  chevronPadding: { paddingRight: 16 },

  // ── Action Footer for ActiveOrderCard ──
  activeOrderFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  fullWidthBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  fullWidthBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Buyer Info additions to ActiveOrderCard ──
  buyerInfoRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  buyerInfoText: { fontSize: 13, color: "#4B5563", fontWeight: "600", marginLeft: 4, flex: 1 },

  // ── Title row / metrics ───────────────────────────────────────────────────
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  cardSubtitle: { fontSize: 14, color: "#6B7280", fontWeight: "500", marginTop: 4, marginBottom: 10 },
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