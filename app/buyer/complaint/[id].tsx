import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderDetail = {
  id: string;
  fruit_type: string;
  variant?: string;
  quantity: number;
  grade: string;
  created_at: string;
  farmer_accepted_at: string | null;
  unitPrice?: number | null;
  totalPrice?: number | null;
  total_amount?: number | null;
};

/** Backend: comment_thread[] with { id?, role, description, timestamp } */
type CommentItem = {
  id?: string;
  role: "user" | "admin";
  description: string;
  timestamp: string;
};

type ComplaintDetail = {
  id: string;
  order_id: string;
  status: string;
  user_complaint: string;
  comments?: string;
  created_at: string;
  updated_at?: string;
  images?: string[];
  image_verification_status?: string;
  comment_thread?: CommentItem[];
};

const IMAGE_VERIFICATION_META: Record<
  string,
  { label: string; color: string; icon: "checkmark-circle" | "close-circle" | "time" }
> = {
  reviewed: { label: "Reviewed", color: "#166534", icon: "checkmark-circle" },
  verified: { label: "Reviewed", color: "#166534", icon: "checkmark-circle" },
  failed: { label: "Failed", color: "#DC2626", icon: "close-circle" },
  pending: { label: "Pending verification", color: "#B45309", icon: "time" },
};

const STATUS_LABELS: Record<string, string> = {
  in_review: "In Review",
  admin_reviewed: "Admin Reviewed",
  reviewed: "Admin Reviewed",
  resolved: "Resolved",
};

const STATUS_PILL_STYLE: Record<string, { bg: string; color: string }> = {
  in_review: { bg: "#FEF3C7", color: "#B45309" },
  admin_reviewed: { bg: "#CCFBF1", color: "#0F766E" },
  reviewed: { bg: "#CCFBF1", color: "#0F766E" },
  resolved: { bg: "#BBF7D0", color: "#166534" },
};

function normalizeStatus(s: string): string {
  return (s ?? "").toLowerCase().replace(/\s+/g, "_");
}

export default function ComplaintDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const complaintId = params.id ?? "";

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return null;
    try {
      const { complaint: raw, images: imageUris } =
        await api.getComplaintDetail(complaintId);
      const c = raw as Record<string, unknown>;
      const rawThread = c?.comment_thread;
      const thread: CommentItem[] = Array.isArray(rawThread)
        ? (rawThread as any[]).map((t: any) => ({
            id: t.id,
            role: (t.role ?? "user") as "user" | "admin",
            description: t.description ?? t.comment ?? "",
            timestamp: t.timestamp ?? t.added_at ?? "",
          }))
        : [];
      setComplaint({
        id: (c?.id != null ? String(c.id) : "") as string,
        order_id: (c?.order_id != null ? String(c.order_id) : "") as string,
        status: (c?.status != null ? String(c.status) : "in_review") as string,
        user_complaint: (c?.user_complaint ?? c?.reason ?? "") as string,
        comments: c?.comments != null ? String(c.comments) : undefined,
        created_at: (c?.created_at != null ? String(c.created_at) : "") as string,
        updated_at: c?.updated_at != null ? String(c.updated_at) : undefined,
        images: imageUris ?? [],
        image_verification_status:
          (c?.image_verification_status ?? c?.image_verification ?? "pending") as string,
        comment_thread: thread,
      });
      return c?.order_id != null ? String(c.order_id) : null;
    } catch (e) {
      setError("Failed to load complaint.");
      return null;
    }
  }, [complaintId]);

  const fetchOrder = useCallback(
    async (orderId: string) => {
      if (!orderId) return;
      try {
        const data: any = await api.get(
          `/api/buyer/place-order/details/${orderId}`,
        );
        const o = data?.order ?? data;
        const total =
          data?.total_price ??
          data?.totalPrice ??
          o?.total_price ??
          o?.totalPrice ??
          o?.total_amount;
        setOrder({
          id: o.id,
          fruit_type: o.fruit_type,
          variant: o.variant,
          quantity: o.quantity,
          grade: o.grade,
          created_at: o.created_at,
          farmer_accepted_at: o.farmer_accepted_at ?? null,
          unitPrice: o.unit_price ?? o.unitPrice,
          totalPrice: total != null ? Number(total) : null,
          total_amount: total != null ? Number(total) : null,
        });
      } catch (_) {
        setOrder(null);
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const orderId = await fetchComplaint();
      if (cancelled) return;
      if (orderId) await fetchOrder(orderId);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [complaintId, fetchComplaint, fetchOrder]);

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !complaintId || !complaint) return;
    setSubmittingComment(true);
    try {
      const res: any = await api.post(
        `/api/buyer/complaints/${complaintId}/comment`,
        { comment: trimmed },
      );
      setNewComment("");
      const added = res?.comment;
      if (added && complaint) {
        const newItem: CommentItem = {
          id: added.id,
          role: (added.role ?? "user") as "user" | "admin",
          description: added.description ?? added.comment ?? trimmed,
          timestamp: added.timestamp ?? new Date().toISOString(),
        };
        setComplaint({
          ...complaint,
          comment_thread: [...(complaint.comment_thread ?? []), newItem],
        });
      } else {
        await fetchComplaint();
      }
    } catch (_) {
      setError("Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading && !complaint) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Header title="Complaint details" showBackButton />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !complaint) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
        <Header title="Complaint details" showBackButton />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? "Complaint not found."}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const verificationStatus = (
    complaint.image_verification_status ?? "pending"
  ).toLowerCase();
  const verificationMeta =
    IMAGE_VERIFICATION_META[verificationStatus] ??
    IMAGE_VERIFICATION_META.pending;
  const verificationTag = verificationMeta.label;
  const verificationColor = verificationMeta.color;
  const verificationIcon = verificationMeta.icon;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Header title="Complaint details" showBackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Complaint status */}
        <View style={styles.section}>
          <View style={styles.statusRow}>
            <Text style={styles.sectionTitle}>Status</Text>
            {(() => {
              const statusKey = normalizeStatus(complaint.status ?? "");
              const pillStyle = STATUS_PILL_STYLE[statusKey] ?? {
                bg: "#F3F4F6",
                color: "#4B5563",
              };
              return (
                <View
                  style={[styles.statusPill, { backgroundColor: pillStyle.bg }]}
                >
                  <Text
                    style={[styles.statusPillText, { color: pillStyle.color }]}
                  >
                    {STATUS_LABELS[statusKey] ?? complaint.status ?? "—"}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Order details */}
        {order && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Fruit</Text>
              <Text style={styles.value}>
                {order.fruit_type}
                {order.variant ? ` • ${order.variant}` : ""}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Quantity</Text>
              <Text style={styles.value}>{order.quantity} kg</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Grade</Text>
              <Text style={styles.value}>Grade {order.grade}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.label}>Placed on</Text>
              <Text style={styles.value}>{formatDate(order.created_at)}</Text>
            </View>
            {order.farmer_accepted_at && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Accepted on</Text>
                <Text style={styles.value}>
                  {formatDate(order.farmer_accepted_at)}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.label}>Payment</Text>
              <Text style={styles.value}>
                Rs.{" "}
                {order.totalPrice != null
                  ? formatCurrency(order.totalPrice)
                  : order.total_amount != null
                    ? formatCurrency(order.total_amount)
                    : "N/A"}
              </Text>
            </View>
          </View>
        )}

        {/* Your complaint */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your complaint</Text>
          <Text style={styles.complaintBody}>
            {complaint.user_complaint || "—"}
          </Text>
          <Text style={styles.dateText}>
            Raised on {formatDate(complaint.created_at)}
          </Text>
        </View>

        {/* Proof images */}
        {complaint.images && complaint.images.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Proof images</Text>
              <View
                style={[
                  styles.verificationTag,
                  { backgroundColor: verificationColor + "20" },
                ]}
              >
                <Ionicons
                  name={verificationIcon}
                  size={14}
                  color={verificationColor}
                />
                <Text
                  style={[styles.verificationTagText, { color: verificationColor }]}
                >
                  {verificationTag}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbScroll}
            >
              {complaint.images.map((uri: string, index: number) => (
                <View key={index} style={styles.thumbWrap}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <Text style={styles.thumbLabel}>{index + 1}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Comments: list on top, add section at bottom */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments</Text>
          {complaint.comment_thread && complaint.comment_thread.length > 0 ? (
            <View style={styles.commentList}>
              {complaint.comment_thread.map((item, index) => (
                <View
                  key={item.id ?? `c-${index}`}
                  style={styles.commentCard}
                >
                  <View style={styles.commentHeader}>
                    <View
                      style={[
                        styles.rolePill,
                        {
                          backgroundColor:
                            item.role === "admin" ? "#DBEAFE" : "#D1FAE5",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.rolePillText,
                          {
                            color:
                              item.role === "admin" ? "#1D4ED8" : "#047857",
                          },
                        ]}
                      >
                        {item.role === "admin" ? "Admin" : "User"}
                      </Text>
                    </View>
                    {item.timestamp ? (
                      <Text style={styles.commentDate}>
                        {formatDateTime(item.timestamp)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.commentText}>{item.description}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noComments}>No comments yet.</Text>
          )}

          <Text style={styles.addCommentLabel}>Add comment</Text>
          {normalizeStatus(complaint.status ?? "") === "resolved" && (
            <Text style={styles.commentDisabledHint}>
              Commenting is disabled for resolved complaints.
            </Text>
          )}
          <View style={styles.addCommentRow}>
            <TextInput
              style={[
                styles.commentInput,
                normalizeStatus(complaint.status ?? "") === "resolved" &&
                  styles.commentInputDisabled,
              ]}
              placeholder={
                normalizeStatus(complaint.status ?? "") === "resolved"
                  ? "Resolved — commenting closed"
                  : "Add a comment..."
              }
              placeholderTextColor={BuyerColors.textGray}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              editable={
                !submittingComment &&
                normalizeStatus(complaint.status ?? "") !== "resolved"
              }
            />
            <TouchableOpacity
              style={[
                styles.addCommentBtn,
                (!newComment.trim() || submittingComment ||
                  normalizeStatus(complaint.status ?? "") === "resolved") &&
                  styles.addCommentBtnDisabled,
              ]}
              onPress={handleAddComment}
              disabled={
                !newComment.trim() ||
                submittingComment ||
                normalizeStatus(complaint.status ?? "") === "resolved"
              }
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.addCommentBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 24 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: BuyerColors.textGray },
  errorText: { fontSize: 16, color: "#DC2626" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  verificationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verificationTagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  label: { fontSize: 14, color: BuyerColors.textGray, fontWeight: "500" },
  value: { fontSize: 14, color: "#111827", fontWeight: "600" },
  complaintBody: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginBottom: 8,
  },
  dateText: { fontSize: 13, color: "#9CA3AF" },
  thumbScroll: { marginBottom: 0 },
  thumbWrap: { marginRight: 12, alignItems: "center" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  thumbLabel: { marginTop: 4, fontSize: 11, color: BuyerColors.textGray },
  commentCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: "600",
  },
  commentDate: { fontSize: 11, color: "#9CA3AF" },
  commentText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  noComments: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginBottom: 12,
  },
  commentList: {
    marginBottom: 20,
  },
  addCommentLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  commentDisabledHint: {
    fontSize: 13,
    color: BuyerColors.textGray,
    marginBottom: 8,
    fontStyle: "italic",
  },
  addCommentRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BuyerColors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    minHeight: 44,
    maxHeight: 100,
  },
  commentInputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
  },
  addCommentBtn: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  addCommentBtnDisabled: {
    opacity: 0.6,
  },
  addCommentBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
