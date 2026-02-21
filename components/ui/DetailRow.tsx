import { ChevronRight, LucideIcon } from "lucide-react-native";
import React, { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BuyerColors } from "../../constants/theme";

interface DetailRowProps {
  label: string;
  value: string | ReactNode;
  bold?: boolean;
  large?: boolean;
  badge?: boolean;
  icon?: LucideIcon;
  onPress?: () => void;
  showDivider?: boolean;
}

export default function DetailRow({
  label,
  value,
  bold = false,
  large = false,
  badge = false,
  icon: Icon,
  onPress,
  showDivider = true,
}: DetailRowProps) {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[
        styles.row,
        !showDivider && styles.noDivider,
        onPress && styles.pressable,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.labelContainer}>
        {Icon && (
          <Icon size={16} color={BuyerColors.textGray} style={styles.icon} />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.valueContainer}>
        {typeof value === "string" ? (
          <Text
            style={[
              styles.value,
              bold && styles.boldValue,
              large && styles.largeValue,
              badge && styles.badgeValue,
            ]}
            numberOfLines={2}
          >
            {value}
          </Text>
        ) : (
          value
        )}

        {onPress && <ChevronRight size={18} color={BuyerColors.textGray} />}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BuyerColors.border,
    gap: 16,
  },
  noDivider: {
    borderBottomWidth: 0,
  },
  pressable: {
    backgroundColor: "transparent",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    color: BuyerColors.textGray,
    fontWeight: "500",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "flex-end",
  },
  value: {
    fontSize: 14,
    color: BuyerColors.textBlack,
    fontWeight: "600",
    textAlign: "right",
  },
  boldValue: {
    fontWeight: "700",
  },
  largeValue: {
    fontSize: 16,
  },
  badgeValue: {
    backgroundColor: BuyerColors.primaryLight,
    color: BuyerColors.primaryGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
});
