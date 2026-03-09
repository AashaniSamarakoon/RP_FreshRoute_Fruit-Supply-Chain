import {
    AlertCircle,
    CheckCircle,
    Clock,
    DollarSign,
    LucideIcon,
    Package,
    Truck,
    XCircle,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StatusBadgeProps {
  status: string;
  size?: "small" | "medium" | "large";
  showIcon?: boolean;
}

interface StatusConfig {
  bg: string;
  color: string;
  icon: LucideIcon;
  label: string;
}

const statusColors: Record<string, StatusConfig> = {
  OPEN: {
    bg: "#FFF3E0",
    color: "#F57C00",
    icon: Clock,
    label: "Open",
  },
  MATCHED: {
    bg: "#E3F2FD",
    color: "#1976D2",
    icon: CheckCircle,
    label: "Matched",
  },
  PENDING_BUYER: {
    bg: "#FFF3E0",
    color: "#F57C00",
    icon: AlertCircle,
    label: "Pending Your Approval",
  },
  PENDING_FARMER: {
    bg: "#FFF3E0",
    color: "#F57C00",
    icon: Clock,
    label: "Pending Farmer Approval",
  },
  AWAITING_PAYMENT: {
    bg: "#F3E5F5",
    color: "#7B1FA2",
    icon: DollarSign,
    label: "Awaiting Payment",
  },
  AUTHORIZED_PAYMENT: {
    bg: "#E0F2F1",
    color: "#00897B",
    icon: Package,
    label: "Paid - Pending Delivery",
  },
  PICKED_UP: {
    bg: "#E8EAF6",
    color: "#3F51B5",
    icon: Truck,
    label: "In Transit",
  },
  DELIVERED: {
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: CheckCircle,
    label: "Delivered",
  },
  COMPLETED: {
    bg: "#E8F5E9",
    color: "#2E7D32",
    icon: CheckCircle,
    label: "Completed",
  },
  CANCELLED: {
    bg: "#FFEBEE",
    color: "#C62828",
    icon: XCircle,
    label: "Cancelled",
  },
};

export default function StatusBadge({
  status,
  size = "medium",
  showIcon = true,
}: StatusBadgeProps) {
  const config = statusColors[status] || {
    bg: "#F5F5F5",
    color: "#757575",
    icon: Package,
    label: status,
  };

  const Icon = config.icon;

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      text: styles.smallText,
      iconSize: 14,
    },
    medium: {
      container: styles.mediumContainer,
      text: styles.mediumText,
      iconSize: 16,
    },
    large: {
      container: styles.largeContainer,
      text: styles.largeText,
      iconSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        currentSize.container,
        { backgroundColor: config.bg },
      ]}
      accessibilityLabel={`Order status: ${config.label}`}
      accessibilityRole="text"
    >
      {showIcon && <Icon size={currentSize.iconSize} color={config.color} />}
      <Text style={[currentSize.text, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  smallContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  mediumContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  largeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  smallText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  mediumText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  largeText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
