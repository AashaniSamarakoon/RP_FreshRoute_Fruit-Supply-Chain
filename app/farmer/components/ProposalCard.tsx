import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const PRIMARY_GREEN = "#2E7D32";
const DANGER_RED = "#DC2626";

export interface ProposalOrder {
  buyer: { id: string; user: { first_name: string; last_name: string; email: string }; user_id: string; company_name: string };
  grade: string;
  variant: string;
  quantity: number;
  fruit_type: string;
  required_date: string;
  delivery_location: string;
  status?: string;
}

export interface Proposal {
  id: string;
  order_id: string;
  stock_id: string;
  quantity_proposed: number;
  status: string;
  expires_at: string;
  created_at: string;
  order: ProposalOrder;
  pricing?: any;
}

interface Props {
  proposal: Proposal;
  processing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onViewProfile: () => void;
}

const ProposalCard: React.FC<Props> = ({ proposal, processing, onAccept, onReject, onViewProfile }) => {
  const buyerName =
    proposal.order?.buyer?.company_name || proposal.order?.buyer?.user?.first_name || "Verified Buyer";

  return (
    <View style={styles.card}>
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
              <Ionicons name="shield-checkmark" size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.buyerInfo}>
            <Text style={styles.buyerName}>{buyerName}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.locationText} numberOfLines={1}>
                {proposal.order?.delivery_location || "Location not specified"}
              </Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </TouchableOpacity>

      <View style={styles.solidDivider} />

      <View style={styles.productInfo}>
        <Text style={styles.orderTitleText}>
          {proposal.order?.variant} {proposal.order?.fruit_type} • Grade {proposal.order?.grade}
        </Text>

        <View style={styles.tagRow}>
          <View style={styles.yieldTag}>
            <Ionicons name="cube-outline" size={12} color="#059669" style={{ marginRight: 4 }} />
            <Text style={styles.yieldTagText}>{proposal.quantity_proposed} kg</Text>
          </View>

          <View style={styles.dateTag}>
            <Ionicons name="calendar-outline" size={12} color="#4B5563" style={{ marginRight: 4 }} />
            <Text style={styles.dateTagText}>
              {new Date(proposal.order?.required_date || new Date().toISOString()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.invoiceBox}>
          <View style={styles.invoiceRow}>
            <View>
              <Text style={styles.invoiceTotalLabel}>Net Earnings</Text>
              <Text style={styles.invoiceSubLabel}>Net of platform fees</Text>
            </View>
            <Text style={styles.invoiceTotalValue}>
              Rs. {((proposal.pricing?.farmerEarning || 0) as number).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        {proposal.status === "PENDING_FARMER" ? (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={onReject}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? (
                <ActivityIndicator size="small" color="#DC2626" />
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
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
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
            <Ionicons name="close-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.statusExpiredText}>Proposal Cancelled</Text>
          </View>
        ) : (
          <View style={styles.statusError}>
            <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.statusErrorText}>Proposal Declined</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
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
  buyerAvatarText: { fontSize: 18, fontWeight: "800", color: PRIMARY_GREEN },
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
  productInfo: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  yieldTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#A7F3D0" },
  yieldTagText: { fontSize: 13, fontWeight: "700", color: "#059669" },
  dateTag: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  dateTagText: { fontSize: 13, fontWeight: "600", color: "#4B5563" },
  orderTitleText: { fontSize: 14, fontWeight: "700", color: "#4B5563", marginBottom: 10, letterSpacing: 0.2 },
  invoiceBox: { backgroundColor: "#F9FAFB", borderRadius: 8, padding: 14, borderWidth: 1, borderColor: "#F3F4F6", marginTop: 14 },
  invoiceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  invoiceTotalLabel: { fontSize: 13, color: "#4B5563", fontWeight: "700" },
  invoiceSubLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "500", marginTop: 2 },
  invoiceTotalValue: { fontSize: 18, color: PRIMARY_GREEN, fontWeight: "900" },
  cardFooter: { marginTop: 2, paddingHorizontal: 16, paddingBottom: 14 },
  actionsRow: { flexDirection: "row", gap: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 10, gap: 8 },
  acceptBtn: { backgroundColor: PRIMARY_GREEN, shadowColor: PRIMARY_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3 },
  acceptBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  rejectBtn: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#FECACA" },
  rejectBtnText: { color: DANGER_RED, fontSize: 14, fontWeight: "700" },
  statusExpired: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, gap: 8 },
  statusExpiredText: { color: "#6B7280", fontSize: 14, fontWeight: "700" },
  statusError: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 10, gap: 8 },
  statusErrorText: { color: DANGER_RED, fontSize: 14, fontWeight: "700" },
});

export default React.memo(ProposalCard);