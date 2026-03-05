import { BuyerColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface PreapprovalConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fruitType: string;
  quantity: number;
  /** AI-forecasted price shown as an estimate only. Actual charge = market price on deliveryDate. */
  estimatedUnitPrice?: number | null;
  deliveryDate?: string | null;
  loading?: boolean;
}

export default function PreapprovalConsentModal({
  visible,
  onClose,
  onConfirm,
  fruitType,
  quantity,
  estimatedUnitPrice,
  deliveryDate,
  loading = false,
}: PreapprovalConsentModalProps) {
  const estimatedTotal =
    estimatedUnitPrice != null ? estimatedUnitPrice * quantity : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Icon */}
          <View style={styles.iconRow}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="calendar-outline"
                size={28}
                color={BuyerColors.primaryGreen}
              />
            </View>
          </View>

          <Text style={styles.title}>Authorize Auto-Payment</Text>
          <Text style={styles.subtitle}>
            We'll automatically charge your card on delivery day — no action
            needed from you.
          </Text>

          {/* Order summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Item</Text>
              <Text style={styles.summaryValue}>
                {fruitType} — {quantity}kg
              </Text>
            </View>
            {deliveryDate ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Charge Date</Text>
                <Text style={styles.summaryValue}>{deliveryDate}</Text>
              </View>
            ) : null}
            {estimatedUnitPrice != null && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Est. Unit Price</Text>
                <Text style={styles.summaryValue}>
                  ~Rs. {estimatedUnitPrice.toLocaleString()}/kg
                </Text>
              </View>
            )}
            {estimatedTotal != null && (
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Est. Total</Text>
                <Text style={styles.totalValue}>
                  ~Rs. {estimatedTotal.toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          {/* Price disclaimer */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              The amount shown is an AI forecast estimate only. Your card will be
              charged the actual market price on{deliveryDate ? ` ${deliveryDate}` : " your requested delivery date"} — the same
              price source used for all orders on that day.
            </Text>
          </View>

          {/* How it works */}
          <View style={styles.infoBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.infoText}>
              PayHere will authorize your card now (Rs. 1 charged and instantly
              refunded). Your card details are securely tokenized — we never
              store your card number.
            </Text>
          </View>

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, loading && styles.btnDisabled]}
            onPress={onConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="card-outline" size={18} color="#fff" />
                <Text style={styles.confirmBtnText}>
                  Authorize Auto-Payment
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  summaryBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    marginTop: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "800",
    color: BuyerColors.primaryGreen,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
    lineHeight: 18,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 25,
    paddingVertical: 15,
    gap: 8,
    marginBottom: 12,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});
