import { ChevronRight } from "lucide-react-native";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BuyerColors } from "../../../constants/theme";
import { DealData } from "../../../types";

const { width } = Dimensions.get("window");

const DealCard: React.FC<{ deal: DealData }> = ({ deal }) => (
  <View style={styles.dealCard}>
    <View style={styles.dealHeader}>
      <Text style={styles.dealTitle}>{deal.title}</Text>
    </View>
    <View style={styles.priceContainer}>
      <Text style={styles.priceText}>{deal.price}</Text>
      <Text style={styles.unitText}>{deal.unit}</Text>
    </View>
    <View style={styles.dealDetails}>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Farm Location:</Text>
        <Text style={styles.detailValue}>{deal.location}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Grade:</Text>
        <Text style={styles.detailValue}>{deal.grade}</Text>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Quality:</Text>
        <Text style={styles.detailValue}>{deal.quality}</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.linkRow}>
      <Text style={styles.linkText}>View Deals</Text>
      <ChevronRight size={16} color={BuyerColors.primaryGreen} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  dealCard: {
    backgroundColor: BuyerColors.cardWhite,
    width: width * 0.45,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  dealHeader: {
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BuyerColors.textBlack,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  unitText: {
    fontSize: 14,
    fontWeight: "400",
    color: BuyerColors.textGray,
    marginLeft: 4,
  },
  dealDesc: {
    fontSize: 13,
    color: BuyerColors.textGray,
    lineHeight: 18,
    marginBottom: 16,
  },
  dealDetails: {
    marginBottom: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    color: BuyerColors.textGray,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 11,
    color: BuyerColors.textBlack,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
    fontSize: 14,
    marginRight: 4,
  },
});

export default DealCard;
