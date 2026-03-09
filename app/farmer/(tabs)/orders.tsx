import api from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { Sprout } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { PillTabBar } from "../../../components/ui/PillTabBar";

import { useModal } from "@/components/modals/ModalProvider";
import AgreementModal from "../../../components/modals/AgreementModal";
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
  // optional image fields that may come from /api/farmer/orders
  product_images?: any;
  productImages?: any;
  image_url?: any;
  images?: any;
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
    
    // Everything else (AUTHORIZED_PAYMENT, READY_FOR_PICKUP) goes to Processing
    return "processing"; 
  }
  
  return null;
};
// ─── Custom hook ──────────────────────────────────────────────────────────────

function useOrdersData() {
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [ordersMapState, setOrdersMapState] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // small utility for toggling the ‘processingIds’ set used by cards and
  // other controls. defined early so callbacks defined below can use it.
  const setProcessing = (id: string, on: boolean) =>
    setProcessingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  // modal helpers are needed by several helper functions defined in
  // this hook (deleteHarvest, acceptProposal, rejectProposal, etc.).
  // extract them immediately after state initialization so they are
  // available to callbacks defined later.
  const { showSuccess, showError } = useModal();

  // ---- client-side editing/deletion helpers ----
  // when the farmer removes a harvest prediction we need to call the
  // backend so that the stock is deleted from the server as well as
  // removing it from local state. the UI previously just removed the
  // item locally which is why the user saw the card disappear but no
  // network request was issued.
  const deleteHarvest = useCallback(async (id: string) => {
    setProcessing(id, true);
    try {
      try {
        // first attempt the namespaced endpoint
        await api.del(`/api/farmer/predictStock/${id}`);
      } catch (innerErr: any) {
        // if server responds 404 we may be running against a version that
        // only exposes the old /predictStock route, so try that as a fallback
        if (innerErr.message && innerErr.message.includes("404")) {
          console.warn("deleteHarvest: fallback to /predictStock because first call returned 404");
          await api.del(`/predictStock/${id}`);
        } else {
          throw innerErr;
        }
      }

      // update local state optimistically
      setHarvests((prev) => prev.filter((h) => h.id !== id));
      showSuccess("Deleted", "Harvest prediction removed.");
    } catch (err: any) {
      console.error("[deleteHarvest] failed", err);
      showError("Error", err?.message ?? "Failed to delete harvest");
    } finally {
      setProcessing(id, false);
    }
  }, [showSuccess, showError]);

  const updateHarvest = useCallback((id: string, updates: Partial<Harvest>) => {
    setHarvests((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  }, []);

  const deleteProposal = useCallback((id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
    setOrdersMapState((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const updateProposal = useCallback(
    (id: string, updates: Partial<Proposal>) => {
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
      // we don't rely on ordersMapState when editing locally; ignore order id
    },
    [],
  );


  const load = useCallback(async (silent = false) => {
    if (!silent) { setLoading(true); setError(null); }
    try {
      let harvestRes: any;
      try {
        harvestRes = await api.get("/api/farmer/estimated-stocks");
      } catch (err: any) {
        console.warn("[DEBUG] estimated-stocks endpoint failed, trying predictStock", err);
        try {
          harvestRes = await api.get("/api/farmer/predictStock");
        } catch (err2: any) {
          if (!silent) setError(err2?.message ?? "Failed to load harvests");
          return;
        }
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
          console.warn("[DEBUG] failed to fetch farmer orders", err);
          ordersRes = null;
        }

        const ordersArr: any[] = Array.isArray(ordersRes)
          ? ordersRes
          : (ordersRes?.orders ?? ordersRes ?? []);
        
        const ordersMap: Record<string, any> = {};
        ordersArr.forEach((o: any) => { if (o && o.id) ordersMap[String(o.id)] = o; });
        setOrdersMapState(ordersMap);

        const rawProposals: Proposal[] = proposalRes?.proposals ?? [];
        
        const mergedProposals = rawProposals.map((p: Proposal) => {
          const orderFromApi = ordersMap[String(p.order_id)];
          // merge fields from API response (status plus any images or other updates)
          const mergedOrder = {
            ...(p.order || {}),
            ...(orderFromApi || {}),
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
              // forward any image fields the API returns
              product_images: o.product_images ?? o.images ?? null,
              image_url: o.image_url ?? null,
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

  // refreshControl will be generated by consumer of hook (OrdersTab)

  const acceptProposal = useCallback(async (id: string) => {
    setProcessing(id, true);
    try {
      await api.post(`/api/farmer/proposals/${id}/accept`, {});
      await load(true); 
      showSuccess("Success", "Proposal accepted! Awaiting buyer payment.");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to accept proposal");
    } finally {
      setProcessing(id, false);
    }
  }, [load, showSuccess, showError]);


  const rejectProposal = useCallback(async (id: string) => {
    setProcessing(id, true);
    try {
      await api.post(`/api/farmer/proposals/${id}/reject`, {});
      setProposals((prev) => 
        prev.map((p) => (p.id === id ? { ...p, status: "REJECTED" as const } : p))
      );
      showSuccess("Declined", "Proposal moved to Rejected.");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to reject proposal");
    } finally {
      setProcessing(id, false);
    }
  }, []);

  // ─── NEW RESTORED: Status Transition APIs ───

  const markReady = useCallback(async (orderId: string) => {
    setProcessing(orderId, true);
    try {
      // hits /ready which moves order to READY_FOR_PICKUP
      const res = await api.patch(`/api/farmer/orders/${orderId}/ready`, {});
      // markReady response
      // optimistic local update to reflect the new status
      setOrdersMapState((prev) => {
        const existing = prev[String(orderId)] || {};
        return {
          ...prev,
          [orderId]: { ...existing, status: "READY_FOR_PICKUP" },
        };
      });
      setHarvests((prev) =>
        prev.map((h) =>
          h.id === String(orderId) ? { ...h, status: "READY_FOR_PICKUP" } : h,
        ),
      );
      await load(true);
    } catch (err: any) {
      showError("Error", err?.message || "Failed to update status");
    } finally {
      setProcessing(orderId, false);
    }
  }, [load]);


  return {
    harvests,
    proposals,
    ordersMap: ordersMapState,
    loading,
    refreshing,
    error,
    processingIds,
    load,
    refresh,
    acceptProposal,
    rejectProposal,
    markReady,    // Restored!
    deleteHarvest,
    updateHarvest,
    deleteProposal,
    updateProposal,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function OrdersTab() {
  const router = useRouter();
  const {
    harvests,
    proposals,
    ordersMap,
    loading,
    refreshing,
    error,
    processingIds,
    load,
    refresh,
    acceptProposal,
    rejectProposal,
    markReady,
    deleteHarvest,
    updateHarvest,
    deleteProposal,
    updateProposal,
  } = useOrdersData();

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={refresh}
      colors={[PRIMARY_GREEN]}
      tintColor={PRIMARY_GREEN}
    />
  );

  const [activeTab, setActiveTab] = useState<TabKey>("harvests");
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // agreement modal state for orders tab
  const [agreementVisible, setAgreementVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [forecastPrice, setForecastPrice] = useState<number | null>(null);

  // helpers for opening/confirming agreements
  const fetchForecastFor = async (prop: Proposal) => {
    let fruitKey = `${prop.order.variant} ${prop.order.fruit_type}`;
    fruitKey = fruitKey.replace(/_/g, "");
    const dateParam = prop.order.required_date.slice(0,10);
    try {
      const res: any = await api.get(`/forecast/fruit?fruit=${encodeURIComponent(fruitKey)}&date=${encodeURIComponent(dateParam||"")}`);
      const priceEntry = Array.isArray(res?.forecast)
        ? res.forecast.find((e: any) => e.date === dateParam && e.target === "price")
        : null;
      setForecastPrice(priceEntry?.forecast_value ?? null);
    } catch (err) {
      setForecastPrice(null);
    }
  };

  const handleAcceptTap = async (prop: Proposal) => {
    setSelectedProposal(prop);
    await fetchForecastFor(prop);
    setAgreementVisible(true);
  };

  const confirmAcceptDeal = () => {
    if (selectedProposal) {
      acceptProposal(selectedProposal.id);
    }
    setAgreementVisible(false);
    setSelectedProposal(null);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const proposalsByStock = useMemo(() => {
    const map: Record<string, Proposal[]> = {};
    proposals.forEach((p) => {
      const sid = String(p.stock_id || "");
      if (!map[sid]) map[sid] = [];
      map[sid].push(p);
    });
    return map;
  }, [proposals]);

  const handleHarvestPress = (h: Harvest) => {
    router.push({
      pathname: "/farmer/screens/harvest-proposals" as any,
      params: {
        harvestId: h.id,
        fruitType: h.fruit_type,
        variant: h.variant,
        grade: h.grade,
        quantity: String(h.quantity),
        harvestDate: h.estimated_harvest_date,
      },
    });
  };

  // === editing modal state ===
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<
    | { type: "harvest" | "proposal"; item: any }
    | null
  >(null);
  const [editFields, setEditFields] = useState<{ fruit_type?: string; quantity?: string }>({});

  // editing helpers must exist before handlers that reference them
  const openEdit = (type: "harvest" | "proposal", item: any) => {
    setEditTarget({ type, item });
    setEditFields({
      fruit_type: item.fruit_type ?? item.order?.fruit_type ?? "",
      quantity: String(item.quantity ?? item.order?.quantity ?? ""),
    });
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (!editTarget) return;
    const { type, item } = editTarget;
    const qty = Number(editFields.quantity || 0);
    if (type === "harvest") {
      updateHarvest(item.id, { fruit_type: editFields.fruit_type, quantity: qty });
    } else {
      updateProposal(item.id, {
        order: {
          ...(item.order || {}),
          fruit_type: editFields.fruit_type,
          quantity: qty,
        },
      });
    }
    setEditModalVisible(false);
    setEditTarget(null);
  };

  const handleHarvestLongPress = (h: Harvest) => {
    Alert.alert("Actions", "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit("harvest", h) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          // double-confirm before removing since it's destructive
          Alert.alert(
            "Confirm delete",
            "Are you sure you want to delete this harvest?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => deleteHarvest(h.id),
              },
            ],
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };


  const handleImagePress = (urls: string[]) => {
    if (urls && urls.length > 0) {
      setCurrentImages(urls);
      setCurrentImageIndex(0);
      setImageModalVisible(true);
    }
  };

  const handleViewProfile = (proposal: Proposal) => {
    router.push({
      pathname: `/farmer/screens/buyer-trust-profile/${proposal.order?.buyer?.id}` as any,
      params: {
        buyerName: proposal.order?.buyer?.company_name || "Buyer",
        buyerLocation: proposal.order?.delivery_location || "Location not specified",
        trustScore: "Not rated",
      },
    });
  };

  // compute how many items each tab currently has so we can hide empty tabs
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = {
      harvests: harvests.length,
      pending: 0,
      payment_due: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
    };
    proposals.forEach((p) => {
      const key = getProposalTabKey(p);
      if (key && key in counts) {
        counts[key as TabKey] = (counts[key as TabKey] || 0) + 1;
      }
    });
    return counts;
  }, [harvests, proposals]);

  const tabData = useMemo(() => {
    return TAB_CONFIG
      .map((t) => ({ ...t, count: tabCounts[t.key] || 0 }))
      .filter((t) => t.count! > 0);
  }, [tabCounts]);

  const renderHarvest = useCallback(
  ({ item }: { item: Harvest }) => {
    const attached = proposalsByStock[item.id] ?? [];
    return (
      <HarvestCard
        harvest={item}
        onPress={() => handleHarvestPress(item)}
        onLongPress={() => handleHarvestLongPress(item)}
        onImagePress={handleImagePress}
      />
    );
  },
  [proposalsByStock, handleHarvestPress, handleImagePress, processingIds, acceptProposal, rejectProposal, handleViewProfile],
);

const renderProposal = useCallback(
  ({ item }: { item: Proposal }) => {
    const tabKey = getProposalTabKey(item);
    const isOrderPhase =
      tabKey === "payment_due" ||
      tabKey === "processing" ||
      tabKey === "completed";

    const handleCardPress = () => {
      if (isOrderPhase && item.order_id) {
        router.push(
          `/farmer/screens/OrderDetailScreen?orderId=${encodeURIComponent(
            String(item.order_id),
          )}`,
        );
      } else {
        const harvestToPass =
          harvests.find((h) => h.id === item.stock_id) || {
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

    // proposals do not support long-press anymore
    const handleLong = () => {
      // no-op
    };

    if (isOrderPhase) {
      const apiOrder = ordersMap[String(item.order_id)] || item.order || {};

      const harvestFromList = harvests.find((h) => h.id === item.stock_id);
      const fallbackHarvest: Harvest = {
        id: String(item.stock_id || apiOrder.harvest_id || ""),
        fruit_type: apiOrder.fruit_type || item.order?.fruit_type || "",
        variant: apiOrder.variant || item.order?.variant || "",
        grade: apiOrder.grade || item.order?.grade || "",
        quantity:
          apiOrder.quantity || item.order?.quantity || item.quantity_proposed,
        estimated_harvest_date:
          apiOrder.harvestDate ||
          apiOrder.required_date ||
          item.order?.required_date ||
          "",
        status: apiOrder.status || item.order?.status || "",
        created_at: apiOrder.created_at || "",
        price_per_kg:
          apiOrder.pricing?.unitPrice || item.pricing?.unitPrice || 0,
      };
      const harvest = harvestFromList || fallbackHarvest;

      const orderImages = parseImageUrls(
        apiOrder.productImages ??
          apiOrder.product_images ??
          apiOrder.image_url ??
          apiOrder.images ??
          null,
      );
      const harvestImages = parseImageUrls(
        harvestFromList?.image_url ?? apiOrder.image_url ?? null,
      );
      const images = orderImages.length > 0 ? orderImages : harvestImages;

      if (images.length > 0) {
        harvest.image_url = images;
      }

      const earning =
        apiOrder.pricing?.farmerEarning ??
        item.pricing?.farmerEarning ??
        apiOrder.farmer_share_amount ??
        null;

      return (
        <HarvestCard
          harvest={harvest}
          onPress={handleCardPress}
          onLongPress={handleLong}
          onImagePress={handleImagePress}
          activeOrderStatus={apiOrder.status || item.order?.status}
          processing={processingIds.has(String(item.order_id))}
          onMarkReady={() => markReady(String(item.order_id))}
          earning={earning}
        />
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

    // for non-order-phase proposals we simply render the card above
    return (
      <ProposalCard
        proposal={item}
        processing={processingIds.has(item.id)}
        onAccept={() => handleAcceptTap(item)}
        onReject={() => rejectProposal(item.id)}
        onViewProfile={() => handleViewProfile(item)}
      />
    );
  },
  [
    processingIds,
    acceptProposal,
    rejectProposal,
    handleViewProfile,
    router,
    harvests,
    handleImagePress,
    handleHarvestPress,
    markReady,
  ],
);

// renderContent handles the overall list display and status states
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
          <View style={styles.stateView}>
            <View style={styles.emptyIconBox}>
              <Sprout size={36} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No harvests yet</Text>
            <Text style={styles.emptySubtitle}>Add an expected harvest to start receiving buyer proposals.</Text>
          </View>
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
        <View style={styles.stateView}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="receipt-outline" size={36} color="#9CA3AF" />
          </View>
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySubtitle}>You don't have any orders matching this status.</Text>
        </View>
      }
    />
  );
};

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Orders" showNotification onNotificationPress={() => router.push("/farmer/screens/notifications" as any)} />
      <PillTabBar tabs={tabData} activeKey={activeTab} onPress={setActiveTab} />
      {renderContent()}

      {/* Render the Agreement Modal */}
      {selectedProposal && (
        <AgreementModal
          visible={agreementVisible}
          onCancel={() => setAgreementVisible(false)}
          onApprove={confirmAcceptDeal}
          forecastPrice={forecastPrice} // Pass the fetched price
          quantity={selectedProposal.quantity_proposed}
          fruitName={selectedProposal.order?.fruit_type}
          variant={selectedProposal.order?.variant}
          requiredDate={selectedProposal.order?.required_date}
        />
      )}

      {/* edit dialog for harvests/orders */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Edit {editTarget?.type === "harvest" ? "Harvest" : "Order"}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editFields.fruit_type}
              onChangeText={(t) => setEditFields((f) => ({ ...f, fruit_type: t }))}
              placeholder="Fruit type"
            />
            <TextInput
              style={styles.modalInput}
              value={editFields.quantity}
              onChangeText={(t) => setEditFields((f) => ({ ...f, quantity: t }))}
              placeholder="Quantity"
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={saveEdit}>
                <Text>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

  // ---- edit dialog styles ----
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: PRIMARY_GREEN,
  },
});
