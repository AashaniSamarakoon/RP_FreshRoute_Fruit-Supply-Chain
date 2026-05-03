import { BuyerColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AgreementModalProps {
  visible: boolean;
  onCancel: () => void;
  onApprove: () => void;
  forecastPrice?: number | null;
  requiredDate?: string;
  fruitName?: string;
  variant?: string;
  quantity?: number;
}

export default function AgreementModal({
  visible,
  onCancel,
  onApprove,
  forecastPrice,
  requiredDate,
  fruitName = "Product",
  variant = "",
  quantity = 0,
}: AgreementModalProps) {
  
  // Format dates and names cleanly
  const formattedDate = requiredDate
    ? new Date(requiredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "the agreed date";

  // Creates the "Banana_Ambul" format for the DB
  const combinedDbName = variant ? `${fruitName} (${variant})` : fruitName;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Contract Terms</Text>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.introText}>
              You are reviewing a formal proposal to supply <Text style={styles.highlight}>{quantity} kg</Text> of <Text style={styles.highlight}>{fruitName} {variant ? `(${variant})` : ""}</Text>.
            </Text>

            <View style={styles.divider} />

            {/* Forecast Section */}
            <View style={styles.sectionRow}>
              <Ionicons name="trending-up-outline" size={24} color={BuyerColors.primaryGreen} style={styles.sectionIcon} />
              <View style={styles.sectionTextContent}>
                <Text style={styles.sectionTitle}>Market Forecast</Text>
                <Text style={styles.sectionDesc}>
                  Based on market intelligence, the projected price for <Text style={styles.boldText}>{combinedDbName}</Text> on <Text style={styles.boldText}>{formattedDate}</Text> is estimated at <Text style={styles.boldText}>Rs. {forecastPrice ? forecastPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '---'} / kg</Text>.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Policy Section */}
            <View style={styles.sectionRow}>
              <Ionicons name="shield-checkmark-outline" size={24} color={BuyerColors.primaryGreen} style={styles.sectionIcon} />
              <View style={styles.sectionTextContent}>
                <Text style={styles.sectionTitle}>Earnings & Payment Policy</Text>
                <Text style={styles.sectionDesc}>
                  Your final payout will be determined by the official <Text style={styles.boldText}>FreshRoute Market Price</Text> active on the exact day the buyer completes their payment. If the payment is not made today, it will be processed on <Text style={styles.boldText}>{formattedDate}</Text>, and your earnings will reflect the market price of that specific day. The forecasted price above is an estimate and subject to standard market fluctuations.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.legalText}>
              By clicking{" "}
              <Text style={styles.boldText}>
                {'"'}Agree & Accept{'"'}
              </Text>
              , you provide your digital signature committing to this supply
              agreement. Failure to fulfill this commitment may impact your
              platform trust rating.
            </Text>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={onApprove}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.approveBtnText}>Agree & Accept</Text>
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
    maxHeight: "90%",
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },
  closeBtn: {
    padding: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
  },
  scrollContent: {
    marginBottom: 10,
  },
  introText: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
  },
  highlight: {
    fontWeight: "800",
    color: "#111827",
  },
  boldText: {
    fontWeight: "700",
    color: "#111827",
  },
  
  // --- Clean, Box-less Sections with Dividers ---
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 20, 
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingRight: 8,
  },
  sectionIcon: {
    marginTop: 2,
    marginRight: 16,
  },
  sectionTextContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sectionDesc: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },

  legalText: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 16,
    textAlign: "justify",
  },

  // --- Actions ---
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
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
  approveBtn: {
    flex: 2,
    flexDirection: "row",
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  approveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
