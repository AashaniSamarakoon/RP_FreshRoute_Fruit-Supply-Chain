import { BuyerColors } from "@/constants/theme";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react-native";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface OrderNotification {
  id: string;
  buyerName: string;
  productName: string;
  quantity: string;
  unit: string;
  grade: string;
  amount: string;
  status: "pending" | "confirmed" | "rejected";
}

interface OrderNotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notification: OrderNotification | null;
  onAccept?: () => void;
  onReject?: () => void;
}

export default function OrderNotificationModal({
  visible,
  onClose,
  notification,
  onAccept,
  onReject,
}: OrderNotificationModalProps) {
  if (!notification) return null;

  const getStatusColor = () => {
    switch (notification.status) {
      case "confirmed":
        return BuyerColors.primaryGreen;
      case "rejected":
        return "#d32f2f";
      default:
        return "#FFA500";
    }
  };

  const getStatusIcon = () => {
    switch (notification.status) {
      case "confirmed":
        return <CheckCircle2 size={32} color="white" />;
      case "rejected":
        return <AlertCircle size={32} color="white" />;
      default:
        return <Clock size={32} color="white" />;
    }
  };

  const getStatusText = () => {
    switch (notification.status) {
      case "confirmed":
        return "Order Accepted";
      case "rejected":
        return "Order Rejected";
      default:
        return "New Order Received";
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { padding: 0 }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: getStatusColor() }]}>
            <View style={styles.iconCircle}>{getStatusIcon()}</View>
            <Text style={styles.headerTitle}>{getStatusText()}</Text>
            <Text style={styles.headerSubtitle}>
              {notification.buyerName} placed an order
            </Text>
          </View>

          <View style={{ padding: 24 }}>
            {/* Buyer Info */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>From</Text>
              <Text style={styles.infoValue}>{notification.buyerName}</Text>
            </View>

            <View style={styles.divider} />

            {/* Product Details */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Product</Text>
              <Text style={styles.infoValue}>{notification.productName}</Text>
            </View>

            <View style={[styles.detailRow, { marginTop: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Quantity</Text>
                <Text style={styles.infoValue}>
                  {notification.quantity} {notification.unit}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Grade</Text>
                <Text style={styles.infoValue}>{notification.grade}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Amount */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Offered Amount</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: BuyerColors.primaryGreen,
                    fontSize: 18,
                    fontWeight: "700",
                  },
                ]}
              >
                {notification.amount}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {notification.status === "pending" && (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={onReject}
              >
                <Text style={styles.rejectButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={onAccept}
              >
                <Text style={styles.acceptButtonText}>Accept Order</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  header: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },

  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  detailRow: {
    flexDirection: "row",
    gap: 16,
  },

  infoLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 16,
  },

  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  acceptButton: {
    backgroundColor: BuyerColors.primaryGreen,
  },

  acceptButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  rejectButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },

  rejectButtonText: {
    color: "#333",
    fontWeight: "700",
    fontSize: 14,
  },

  closeButton: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 15,
  },
});
