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
  requestedDate?: string;
  isPriceLocked: boolean;
  onPayNow: () => void;
  onPayLater?: () => void;
}

export default function PaymentInfoModal({
  visible,
  onClose,
  fruitType,
  variant,
  predictedUnitPrice,
  isFetchingForecast,
  currentUnitPrice,
  requestedDate,
  isPriceLocked,
  onPayNow,
  onPayLater,
}: PaymentInfoModalProps) {
  const formatPrice = (price: number | null) =>
    price != null ? `Rs. ${price.toLocaleString()}` : "N/A";

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
                  {isPriceLocked ? "Locked Unit Price" : "Today Unit Price"}
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
                  {requestedDate ? ` (${requestedDate})` : ""}
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

          {/* Payment Timing Explanation */}
          <View style={styles.explanationBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.explanationText}>
              The displayed price is a forecast based on current market trends
              for your requested delivery date. Actual prices may fluctuate. You
              have the option to secure this rate by paying now or proceed with
              payment upon delivery.
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
                    : "Your price is above the forecasted market price."}
                </Text>
              </View>
            )}

          <View style={styles.divider} />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onPayLater ?? onClose}>
              <Text style={styles.cancelBtnText}>Pay Later</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.payBtn} onPress={onPayNow}>
              <Ionicons name="card-outline" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Pay Now</Text>
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    padding: 4,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  productVariant: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  priceSection: {
    gap: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  priceLabelText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  goodDeal: {
    color: "#22C55E",
  },
  aboveMarket: {
    color: "#F97316",
  },
  insightBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  insightGood: {
    backgroundColor: "#F0FDF4",
  },
  insightWarning: {
    backgroundColor: "#FFF7ED",
  },
  insightText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  insightTextGood: {
    color: "#15803D",
  },
  insightTextWarning: {
    color: "#C2410C",
  },
  explanationBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  explanationText: {
    fontSize: 13,
    color: "#4B5563",
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
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
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
