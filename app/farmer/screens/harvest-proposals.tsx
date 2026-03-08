import api from "@/services/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Calendar,
    CheckCircle2,
    ChevronRight,
    MapPin,
    PackageOpen,
    PackageSearch,
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
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";

// Aligning with the new Forest Green theme
const PRIMARY_GREEN = "#2E7D32"; 
const DANGER_RED = "#DC2626";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

interface ProposalOrder {
  buyer: { id: string; user: { first_name: string; last_name: string; email: string }; user_id: string; company_name: string };
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
      Alert.alert("Success", "Contract mathematically verified and accepted.");
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
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to decline proposal");
    } finally {
      setProcessing(id, false);
    }
  };

  const navigateToBuyerProfile = (proposal: Proposal) => {
    router.push({
      pathname: `/farmer/screens/buyer-trust-profile/${proposal.order?.buyer?.id}` as any,
      params: {
        buyerName: proposal.order?.buyer?.company_name || "Buyer",
        buyerLocation: proposal.order?.delivery_location || "Location not specified",
        trustScore: "Not rated",
      },
    });
  };

  const renderProposal = ({ item }: { item: Proposal }) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.card}>
        {/* --- Card Header (CRM Style) --- */}
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.7}
          onPress={() => navigateToBuyerProfile(item)}
        >
          <View style={styles.headerLeft}>
            <View style={styles.buyerAvatar}>
              <Text style={styles.buyerAvatarText}>
                {item.order?.buyer?.company_name ? item.order.buyer.company_name.charAt(0).toUpperCase() : "B"}
              </Text>
              <View style={styles.verifiedBadgeDot}>
                <ShieldCheck size={10} color="#FFFFFF" />
              </View>
            </View>
            
            <View style={styles.buyerInfo}>
              <Text style={styles.buyerName}>
                {item.order?.buyer?.company_name || "Verified Buyer"}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.order?.delivery_location || "Location not specified"}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color="#D1D5DB" />
        </TouchableOpacity>

        <View style={styles.solidDivider} />

        {/* --- Card Body & Tags --- */}
        <View style={styles.productInfo}>
          {/* <Text style={styles.orderTitleText}>
            {item.order?.variant || variant} {item.order?.fruit_type || fruitType} • Grade {item.order?.grade || grade}
          </Text> */}
          
          <View style={styles.tagRow}>
            <View style={styles.yieldTag}>
              <PackageOpen size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.yieldTagText}>
                {item.quantity_proposed} kg
              </Text>
            </View>

            <View style={styles.dateTag}>
              <Calendar size={12} color="#4B5563" style={{ marginRight: 4 }} />
              <Text style={styles.dateTagText}>
                {formatDate(item.order?.required_date || new Date().toISOString())}
              </Text>
            </View>
          </View>

          {/* --- Minimalist Farmer Pricing Box --- */}
          <View style={styles.invoiceBox}>
            <View style={styles.invoiceRow}>
              <View>
                <Text style={styles.invoiceTotalLabel}>Net Earnings</Text>
                <Text style={styles.invoiceSubLabel}>
Net of platform fees                </Text>
              </View>
              <Text style={styles.invoiceTotalValue}>
                Rs. {(item.pricing?.farmerEarning || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* --- Actions & Status --- */}
        <View style={styles.cardFooter}>
          {item.status === "ACCEPTED" ? (
            <View style={styles.statusSuccess}>
              <CheckCircle2 size={16} color={PRIMARY_GREEN} />
              <Text style={styles.statusSuccessText}>Deal Locked & Verified</Text>
            </View>
          ) : item.status === "PENDING_FARMER" ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => rejectProposal(item.id)}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={DANGER_RED} />
                ) : (
                  <Text style={styles.rejectBtnText}>Decline</Text>
                )}
              </TouchableOpacity>
              
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
                    <CheckCircle2 size={16} color="#fff" />
                    <Text style={styles.acceptBtnText}>Accept Deal</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : item.status === "EXPIRED" ? (
            <View style={styles.statusExpired}>
              <XCircle size={16} color="#6B7280" />
              <Text style={styles.statusExpiredText}>Proposal Expired</Text>
            </View>
          ) : item.status === "CANCELLED" ? (
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
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header
        title="Active Proposals"
        onBack={() => router.back()}
      />

      {/* --- Sleek Context Banner --- */}
      <View style={styles.contextBanner}>
        <View style={styles.bannerIconBox}>
          <PackageOpen size={20} color={PRIMARY_GREEN} />
        </View>
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle}>{variant} {fruitType}</Text>
          <Text style={styles.bannerSubtitle}>
            Yield: {quantity} kg • Grade {grade}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerView}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Fetching secure contracts...</Text>
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
                <PackageSearch size={32} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Active Proposals</Text>
              <Text style={styles.emptyMessage}>
                Buyers are currently reviewing this harvest. You will receive an alert when a secure contract is offered.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F3F4F6",
  },
  listContent: { padding: 16, paddingBottom: 60 },
  emptyContainer: { flexGrow: 1 },

  // --- CONTEXT BANNER ---
  contextBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    marginRight: 16,
  },
  bannerInfo: { flex: 1 },
  bannerTitle: { fontSize: 16, fontWeight: "800", color: "#111827", marginBottom: 2 },
  bannerSubtitle: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  // --- EMPTY / LOADING STATES ---
  centerView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loadingText: { fontSize: 14, color: PRIMARY_GREEN, marginTop: 12, fontWeight: "600" },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 8 },
  emptyMessage: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 },

  // --- CARD STRUCTURE ---
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },

  // Header (CRM Style)
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  },
  orderTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 10,
    letterSpacing: 0.2,
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
  cardFooter: { marginTop: 2 },
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
});