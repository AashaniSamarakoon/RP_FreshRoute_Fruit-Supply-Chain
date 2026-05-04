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

interface PaymentInfoModalProps {
  visible: boolean;
  onClose: () => void;
  fruitType: string;
  variant: string;
  predictedUnitPrice: number;
  isFetchingForecast: boolean;
  currentUnitPrice: number | null;
  requiredDate?: string;
  isPriceLocked: boolean;
  isSubmitting?: boolean;
  onPayNow: () => void;
}

export default function PaymentInfoModal({
  visible,
  onClose,
  fruitType,
  variant,
  predictedUnitPrice,
  isFetchingForecast,
  currentUnitPrice,
  requiredDate,
  isPriceLocked,
  isSubmitting = false,
  onPayNow,
}: PaymentInfoModalProps) {
  const formatPrice = (price: number | null) =>
    price != null ? `Rs. ${price.toLocaleString()}` : "N/A";

  // Format dates cleanly
  const formattedDate = requiredDate
    ? new Date(requiredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Delivery Day";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Payment Information</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Product */}
          <View style={styles.productRow}>
            <Text style={styles.productName}>{fruitType}</Text>
            <Text style={styles.productVariant}>{variant}</Text>
          </View>

          <View style={styles.divider} />

          {/* Price Rows */}
          <View style={styles.priceSection}>
            {/* Agreed Unit Price */}
            <View style={styles.priceRow}>
              <View style={styles.priceLabel}>
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                <Text style={styles.priceLabelText}>
                  {isPriceLocked ? "Locked Unit Price" : "Today's Est. Unit Price"}
                </Text>
                {isPriceLocked && (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color="#fff" />
                    <Text style={styles.lockedBadgeText}>Locked</Text>
                  </View>
                )}
              </View>
              <Text style={styles.priceValue}>
                {formatPrice(currentUnitPrice)}
              </Text>
            </View>

            {/* Forecasted Market Price */}
            <View style={styles.priceRow}>
              <View style={styles.priceLabel}>
                <Ionicons name="analytics-outline" size={16} color="#6B7280" />
                <Text style={styles.priceLabelText}>
                  Forecasted Market Price
                  {requiredDate ? ` (${requiredDate})` : ""}
                </Text>
              </View>
              {isFetchingForecast ? (
                <ActivityIndicator
                  size="small"
                  color={BuyerColors.primaryGreen}
                />
              ) : (
                <Text
                  style={[
                    styles.priceValue,
                    predictedUnitPrice > 0 &&
                    currentUnitPrice != null &&
                    currentUnitPrice <= predictedUnitPrice
                      ? styles.goodDeal
                      : styles.aboveMarket,
                  ]}
                >
                  {predictedUnitPrice > 0
                    ? `Rs. ${predictedUnitPrice.toLocaleString()}`
                    : "Unavailable"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* --- NEW: Clear Deposit & Tokenization Notice --- */}
          <View style={styles.depositNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
            <View style={styles.depositTextContainer}>
              <Text style={styles.depositNoticeTitle}>Deposit to Secure Order</Text>
              <Text style={styles.depositNoticeText}>
                You will only be charged a deposit today. It will be 50% of the order
                total, capped at Rs. 25 000. Your card will be securely saved to
                automatically process the remaining balance upon successful delivery.
              </Text>
            </View>
          </View>

          {/* Payment Timing Explanation */}
          <View style={styles.explanationBox}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color="#6B7280"
            />
            <Text style={styles.explanationText}>
              The final balance will be calculated using the official <Text style={{fontWeight: '700', color: '#374151'}}>FreshRoute Market Price</Text> active on {formattedDate}. This protects you from overpaying if the market price drops before delivery.
            </Text>
          </View>

          {/* Deal insight */}
          {!isFetchingForecast &&
            predictedUnitPrice > 0 &&
            currentUnitPrice != null && (
              <View
                style={[
                  styles.insightBox,
                  currentUnitPrice <= predictedUnitPrice
                    ? styles.insightGood
                    : styles.insightWarning,
                ]}
              >
                <Ionicons
                  name={
                    currentUnitPrice <= predictedUnitPrice
                      ? "checkmark-circle"
                      : "warning"
                  }
                  size={16}
                  color={
                    currentUnitPrice <= predictedUnitPrice
                      ? "#22C55E"
                      : "#F97316"
                  }
                />
                <Text
                  style={[
                    styles.insightText,
                    currentUnitPrice <= predictedUnitPrice
                      ? styles.insightTextGood
                      : styles.insightTextWarning,
                  ]}
                >
                  {currentUnitPrice <= predictedUnitPrice
                    ? "Great deal! You're paying at or below the forecasted market price."
                    : "Your estimated price is above the forecasted market price."}
                </Text>
              </View>
            )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.payBtn, isSubmitting && styles.payBtnDisabled]}
              onPress={onPayNow}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="card-outline" size={18} color="#fff" />
              )}
              <Text style={styles.payBtnText}>
                {isSubmitting ? "Opening PayHere..." : "Pay Deposit"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    maxHeight: "95%",
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  closeBtn: {
    padding: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  productVariant: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  priceSection: {
    gap: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  priceLabelText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "600",
    flexShrink: 1,
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366F1",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  lockedBadgeText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "700",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginLeft: 8,
  },
  goodDeal: {
    color: "#059669",
  },
  aboveMarket: {
    color: "#F97316",
  },
  insightBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
  },
  insightGood: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  insightWarning: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FFEDD5",
  },
  insightText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
  insightTextGood: {
    color: "#065F46",
  },
  insightTextWarning: {
    color: "#9A3412",
  },
  depositNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  depositTextContainer: {
    flex: 1,
  },
  depositNoticeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 4,
  },
  depositNoticeText: {
    fontSize: 13,
    color: "#065F46",
    lineHeight: 20,
  },
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    marginTop: 4,
  },
  explanationText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  payBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    shadowColor: BuyerColors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  payBtnDisabled: {
    opacity: 0.7,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
});
