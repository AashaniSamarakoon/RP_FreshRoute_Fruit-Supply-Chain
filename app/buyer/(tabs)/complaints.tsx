import api from "@/services/api";
import { BuyerColors } from "@/constants/theme";
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

/** Matches GET /api/buyer/complaints list item (no images) */
export interface ComplaintListItem {
  id: string;
  order_id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_complaint: string;
  status: string;
  comments?: string;
  comment_thread?: Array<{ role: string; comment: string; added_at: string }>;
  created_at: string;
  updated_at?: string;
}

type TabKey = "all" | "in_review" | "admin_reviewed" | "resolved";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in_review", label: "In Review" },
  { key: "admin_reviewed", label: "Admin Reviewed" },
  { key: "resolved", label: "Resolved" },
];

const TAB_STATUS_MAP: Record<TabKey, string[]> = {
  all: [],
  in_review: ["in_review"],
  admin_reviewed: ["admin_reviewed", "reviewed"],
  resolved: ["resolved"],
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  in_review: { label: "In Review", color: "#B45309", bg: "#FEF3C7" },
  admin_reviewed: { label: "Admin Reviewed", color: "#0F766E", bg: "#CCFBF1" },
  reviewed: { label: "Admin Reviewed", color: "#0F766E", bg: "#CCFBF1" },
  resolved: { label: "Resolved", color: "#166534", bg: "#BBF7D0" },
};

function formatDate(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function BuyerComplaints() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const fetchComplaints = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data: any = await api.get("/api/buyer/complaints");
      const list: ComplaintListItem[] = Array.isArray(data?.complaints)
        ? data.complaints
        : Array.isArray(data)
          ? data
          : data?.data ?? [];
      setComplaints(list);
    } catch {
      if (!silent) setComplaints([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchComplaints(true);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchComplaints();
    }, []),
  );

  const normalizeStatus = (s: string) =>
    (s ?? "").toLowerCase().replace(/\s+/g, "_");

  const filteredComplaints = useMemo(() => {
    if (activeTab === "all") return complaints;
    return complaints.filter((c) =>
      TAB_STATUS_MAP[activeTab].includes(normalizeStatus(c.status)),
    );
  }, [complaints, activeTab]);

  const tabCount = useMemo(() => {
    const counts: Record<TabKey, number> = {
      all: complaints.length,
      in_review: 0,
      admin_reviewed: 0,
      resolved: 0,
    };
    complaints.forEach((c) => {
      const s = normalizeStatus(c.status);
      if (TAB_STATUS_MAP.in_review.includes(s)) counts.in_review++;
      else if (TAB_STATUS_MAP.admin_reviewed.includes(s)) counts.admin_reviewed++;
      else if (TAB_STATUS_MAP.resolved.includes(s)) counts.resolved++;
    });
    return counts;
  }, [complaints]);

  const handleViewDetails = (item: ComplaintListItem) => {
    router.push({
      pathname: "/buyer/complaint/[id]" as any,
      params: { id: item.id },
    });
  };

  const renderCard = ({ item }: { item: ComplaintListItem }) => {
    const normalized = normalizeStatus(item.status ?? "");
    const meta =
      STATUS_META[item.status] ??
      STATUS_META[normalized] ?? {
        label: (item.status ?? "—").replace(/_/g, " "),
        color: "#4B5563",
        bg: "#F3F4F6",
      };
    const reason = item.user_complaint ?? item.comments ?? "—";
    const shortReason = reason.length > 60 ? reason.slice(0, 60) + "…" : reason;

    return (
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.cardTopRow}>
            <Text style={styles.orderId}>
              Order #{item.order_id?.substring(0, 8) ?? item.id?.substring(0, 8) ?? "—"}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusLabel, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>
          <Text style={styles.reasonText} numberOfLines={2}>
            {shortReason}
          </Text>
          <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewDetailsBtnText}>View details</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Complaints" />

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
          <Text style={styles.stateText}>Loading complaints...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredComplaints}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={
            filteredComplaints.length === 0
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
                <Ionicons name="document-text-outline" size={40} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "all"
                  ? "When you raise a complaint, it will appear here."
                  : "No complaints match this filter."}
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
  listContent: {
    padding: 16,
    paddingBottom: 80,
    gap: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
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
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  statusPill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: BuyerColors.primaryGreen,
  },
  viewDetailsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
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
