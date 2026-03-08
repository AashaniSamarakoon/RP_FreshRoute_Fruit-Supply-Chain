import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Thermometer } from "lucide-react-native";

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

type CommentItem = {
  id?: string;
  role: "user" | "admin";
  description: string;
  timestamp: string;
};

type ComplaintDetail = {
  id: string;
  order_id: string;
  placed_order_id?: string;
  status: string;
  user_complaint: string;
  comments?: string;
  created_at: string;
  updated_at?: string;
  images?: string[];
  image_verification_status?: string;
  comment_thread?: CommentItem[];
};

type TempAlert = {
  id: string;
  vehicle_id?: string;
  order_id: string;
  alert_type: string;
  message: string;
  value_at_time?: number;
  created_at: string;
  is_read?: boolean;
  placed_order_id?: string;
  optimal_temp_c?: number;
  max_safe_temp_c?: number;
};

const IMAGE_VERIFICATION_META: Record<
  string,
  { label: string; color: string; icon: "checkmark-circle" | "close-circle" | "time" }
> = {
  verified: { label: "Admin verified", color: "#166534", icon: "checkmark-circle" },
  admin_verified: { label: "Admin verified", color: "#166534", icon: "checkmark-circle" },
  failed: { label: "Failed", color: "#DC2626", icon: "close-circle" },
  pending: { label: "Pending verification", color: "#B45309", icon: "time" },
  reviewed: { label: "Admin verified", color: "#166534", icon: "checkmark-circle" },
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

/** Normalize to data URI string; support array of strings or array of { base64 } from API */
function toDataUri(img: unknown): string | null {
  if (typeof img === "string" && img.startsWith("data:")) return img;
  if (typeof img === "string" && img.length > 0) return `data:image/jpeg;base64,${img}`;
  if (img && typeof (img as any).base64 === "string")
    return `data:image/jpeg;base64,${(img as any).base64}`;
  return null;
}

export default function AdminComplaintDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const complaintId = params.id ?? "";

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [tempAlerts, setTempAlerts] = useState<TempAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    visible: boolean;
    image_verification?: string;
    message?: string;
    predicted_grades?: string[];
    received_grade_normalized?: string;
  } | null>(null);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchComplaint = useCallback(async () => {
    if (!complaintId) return null;
    try {
      const { complaint: raw, images: imageUris } =
        await api.getAdminComplaintDetail(complaintId);
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
        placed_order_id:
          c?.placed_order_id != null ? String(c.placed_order_id) : undefined,
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
      return {
        order_id: c?.order_id != null ? String(c.order_id) : null,
        placed_order_id:
          c?.placed_order_id != null ? String(c.placed_order_id) : null,
      };
    } catch (e) {
      setError("Failed to load complaint.");
      return null;
    }
  }, [complaintId]);

  const fetchOrder = useCallback(async (orderId: string) => {
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
  }, []);

  const fetchTemps = useCallback(async (orderId: string) => {
    if (!orderId) return;
    try {
      const data: any = await api.get(`/api/admin/temps/${orderId}`);
      const alerts = data?.alerts ?? [];
      setTempAlerts(Array.isArray(alerts) ? alerts : []);
    } catch (_) {
      setTempAlerts([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const ids = await fetchComplaint();
      if (cancelled || !ids) {
        if (!cancelled) setLoading(false);
        return;
      }
      const orderId = ids.placed_order_id ?? ids.order_id;
      const placedOrderId = ids.placed_order_id ?? ids.order_id;
      if (orderId) await fetchOrder(orderId);
      if (placedOrderId) await fetchTemps(placedOrderId);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [complaintId, fetchComplaint, fetchOrder, fetchTemps]);

  const handleAddComment = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !complaintId || !complaint) return;
    setSubmittingComment(true);
    try {
      await api.patch(`/api/admin/complaints/${complaintId}`, {
        comment: trimmed,
      });
      setNewComment("");
      // Refetch complaint so status (e.g. admin_reviewed) and comment thread are up to date
      await fetchComplaint();
    } catch (_) {
      setError("Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVerify = async () => {
    if (!complaint || !order) {
      Alert.alert(
        "Cannot verify",
        "Order details are required to run verification.",
      );
      return;
    }
    const rawImages = complaint.images ?? [];
    const imageUris = rawImages
      .slice(0, 5)
      .map(toDataUri)
      .filter((uri): uri is string => !!uri && uri.length > 0);
    if (imageUris.length !== 5) {
      Alert.alert(
        "Cannot verify",
        "Exactly 5 proof images are required. Found " + imageUris.length + ".",
      );
      return;
    }
    setVerifying(true);
    try {
      const form = new FormData();
      form.append("complaint_id", complaintId);
      const receivedGrade = `Grade ${order.grade}`.trim() || "Grade A";
      form.append("received_grade", receivedGrade);

      // Same pattern as buyer re-verification: append data URIs directly
      for (let i = 0; i < imageUris.length; i++) {
        form.append("images", {
          uri: imageUris[i],
          name: `image_${i + 1}.jpg`,
          type: "image/jpeg",
        } as any);
      }

      const res: any = await api.postForm("/api/admin/gradings/verify", form);
      setVerifyResult({
        visible: true,
        image_verification: res?.image_verification,
        message: res?.message,
        predicted_grades: res?.predicted_grades ?? [],
        received_grade_normalized: res?.received_grade_normalized,
      });
      setComplaint({
        ...complaint,
        image_verification_status:
          res?.image_verification ?? complaint.image_verification_status,
      });
    } catch (err: any) {
      const msg =
        typeof err?.message === "string"
          ? err.message
          : "Verification failed. Please try again.";
      let body: { message?: string } = {};
      try {
        if (typeof err?.message === "string" && err.message.startsWith("{")) {
          body = JSON.parse(err.message);
        }
      } catch (_) {}
      Alert.alert(
        "Error",
        body?.message ?? msg,
      );
    } finally {
      setVerifying(false);
    }
  };

  const closeVerifyModal = () => {
    setVerifyResult((r) => (r ? { ...r, visible: false } : null));
  };

  const handleResolve = () => {
    Alert.alert(
      "Resolve complaint",
      "Mark this complaint as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            if (!complaintId || !complaint) return;
            setResolving(true);
            try {
              await api.patch(`/api/admin/complaints/${complaintId}/resolve`, {});
              await fetchComplaint();
            } catch (_) {
              Alert.alert("Error", "Failed to resolve complaint.");
            } finally {
              setResolving(false);
            }
          },
        },
      ],
    );
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
  const isAlreadyVerified =
    verificationStatus === "verified" ||
    verificationStatus === "admin_verified" ||
    verificationStatus === "failed"; // show Re-verify when already verified or failed
  const verificationMeta =
    IMAGE_VERIFICATION_META[verificationStatus] ??
    IMAGE_VERIFICATION_META.pending;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Header title="Complaint details" showBackButton />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                  style={[
                    styles.statusPill,
                    { backgroundColor: pillStyle.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: pillStyle.color },
                    ]}
                  >
                    {STATUS_LABELS[statusKey] ?? complaint.status ?? "—"}
                  </Text>
                </View>
              );
            })()}
          </View>
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Complaint</Text>
          <Text style={styles.complaintBody}>
            {complaint.user_complaint || "—"}
          </Text>
          <Text style={styles.dateText}>
            Raised on {formatDate(complaint.created_at)}
          </Text>
        </View>

        {complaint.images && complaint.images.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Proof images</Text>
              <View
                style={[
                  styles.verificationTag,
                  {
                    backgroundColor:
                      (verificationMeta.color ?? "#666") + "20",
                  },
                ]}
              >
                <Ionicons
                  name={verificationMeta.icon}
                  size={14}
                  color={verificationMeta.color}
                />
                <Text
                  style={[
                    styles.verificationTagText,
                    { color: verificationMeta.color },
                  ]}
                >
                  {verificationMeta.label}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbScroll}
            >
              {complaint.images.map((uri: string, index: number) => {
                const displayUri = toDataUri(uri) ?? (typeof uri === "string" ? uri : "");
                if (!displayUri) return null;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.thumbWrap}
                    onPress={() => setPreviewImageUri(displayUri)}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: displayUri }} style={styles.thumb} />
                    <Text style={styles.thumbLabel}>{index + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {order && complaint.images.length >= 5 && (
              <TouchableOpacity
                style={[styles.verifyBtn, verifying && styles.verifyBtnDisabled]}
                onPress={handleVerify}
                disabled={verifying}
              >
                {verifying ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.verifyBtnText}>
                    {isAlreadyVerified ? "Re-verify" : "Verify"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperature anomalies</Text>
          {tempAlerts.length > 0 ? (
            <View style={styles.tempList}>
              {tempAlerts.map((alert) => (
                <View key={alert.id} style={styles.tempCard}>
                  <View style={styles.tempCardHeader}>
                    <Thermometer size={18} color="#B45309" />
                    <Text style={styles.tempAlertType}>{alert.alert_type}</Text>
                  </View>
                  <Text style={styles.tempMessage}>{alert.message}</Text>
                  <View style={styles.tempMeta}>
                    {alert.value_at_time != null && (
                      <Text style={styles.tempMetaText}>
                        Value: {alert.value_at_time}°C
                      </Text>
                    )}
                    {alert.optimal_temp_c != null && (
                      <Text style={styles.tempMetaText}>
                        Optimal: {alert.optimal_temp_c}°C
                      </Text>
                    )}
                    {alert.max_safe_temp_c != null && (
                      <Text style={styles.tempMetaText}>
                        Max safe: {alert.max_safe_temp_c}°C
                      </Text>
                    )}
                  </View>
                  <Text style={styles.tempDate}>
                    {formatDateTime(alert.created_at)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noTemps}>
              No temp anomalies for the order detected.
            </Text>
          )}
        </View>

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

          <Text style={styles.addCommentLabel}>Add comment (Admin)</Text>
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

        {complaint && normalizeStatus(complaint.status) !== "resolved" && (
          <TouchableOpacity
            style={[styles.resolveBtn, resolving && styles.resolveBtnDisabled]}
            onPress={handleResolve}
            disabled={resolving}
          >
            {resolving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.resolveBtnText}>Resolve the complaint</Text>
            )}
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Full-screen image preview */}
      <Modal
        visible={!!previewImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <Image
            source={{ uri: previewImageUri ?? "" }}
            style={styles.imagePreviewImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={[styles.imagePreviewCloseBtn, { top: insets.top + 12 }]}
            onPress={() => setPreviewImageUri(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={28} color="#fff" />
            <Text style={styles.imagePreviewCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={verifyResult?.visible ?? false}
        transparent
        animationType="fade"
        onRequestClose={closeVerifyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verification result</Text>
            {verifyResult?.received_grade_normalized != null && (
              <Text style={styles.modalGrade}>
                Order grade: {verifyResult.received_grade_normalized}
              </Text>
            )}
            {verifyResult?.message != null && (
              <Text
                style={[
                  styles.modalMessage,
                  verifyResult.image_verification === "failed" &&
                    styles.modalMessageFailed,
                ]}
              >
                {verifyResult.message}
              </Text>
            )}
            {verifyResult?.predicted_grades &&
              verifyResult.predicted_grades.length > 0 && (
                <View style={styles.modalGrades}>
                  <Text style={styles.modalGradesLabel}>Predicted per image:</Text>
                  {verifyResult.predicted_grades.map((g, i) => (
                    <Text key={i} style={styles.modalGradeItem}>
                      Image {i + 1}: {g}
                    </Text>
                  ))}
                </View>
              )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.modalThumbsScroll}
            >
              {complaint.images &&
                complaint.images.slice(0, 5).map((uri, i) => (
                  <View key={i} style={styles.modalThumbWrap}>
                    <Image source={{ uri }} style={styles.modalThumb} />
                    <Text style={styles.modalThumbLabel}>{i + 1}</Text>
                  </View>
                ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalOkBtn}
              onPress={closeVerifyModal}
            >
              <Text style={styles.modalOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  thumbScroll: { marginBottom: 12 },
  thumbWrap: { marginRight: 12, alignItems: "center" },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  thumbLabel: { marginTop: 4, fontSize: 11, color: BuyerColors.textGray },
  verifyBtn: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  verifyBtnDisabled: { opacity: 0.7 },
  verifyBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  tempList: { gap: 12 },
  tempCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tempCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tempAlertType: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B45309",
  },
  tempMessage: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  tempMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 6 },
  tempMetaText: { fontSize: 12, color: "#6B7280" },
  tempDate: { fontSize: 11, color: "#9CA3AF" },
  noTemps: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
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
  resolveBtn: {
    backgroundColor: "#166534",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  resolveBtnDisabled: { opacity: 0.7 },
  resolveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewImage: {
    width: "100%",
    height: "100%",
  },
  imagePreviewCloseBtn: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  imagePreviewCloseText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  modalGrade: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: "#166534",
    marginBottom: 12,
  },
  modalMessageFailed: {
    color: "#DC2626",
  },
  modalGrades: { marginBottom: 12 },
  modalGradesLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  modalGradeItem: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  modalThumbsScroll: {
    marginBottom: 8,
  },
  modalThumbWrap: {
    marginRight: 8,
    alignItems: "center",
  },
  modalThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalThumbLabel: { marginTop: 4, fontSize: 11, color: "#6B7280" },
  modalOkBtn: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalOkBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
