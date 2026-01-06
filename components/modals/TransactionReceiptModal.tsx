import { BuyerColors } from "@/constants/theme";
import {
  Box,
  CircleCheckBig,
  Clock,
  Copy,
  FileText,
} from "lucide-react-native";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface TransactionItem {
  id: string;
  txId: string;
  date: string;
  item: string;
  quantity: string;
  amount: string;
  status: string;
  blockNumber: string;
  smartContract: string;
}

interface TransactionReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
}

export default function TransactionReceiptModal({
  visible,
  onClose,
  transaction,
}: TransactionReceiptModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { padding: 0 }]}>
          {transaction && (
            <View>
              {/* Receipt Header */}
              <View style={styles.receiptHeader}>
                <View style={styles.iconCircle}>
                  <CircleCheckBig size={32} color="white" />
                </View>
                <Text style={styles.receiptTitle}>Transaction Committed</Text>
                <Text style={styles.receiptSubtitle}>Recorded on Ledger</Text>
              </View>

              <View style={{ padding: 24 }}>
                {/* Asset Details */}
                <View style={styles.detailRow}>
                  <View>
                    <Text style={styles.detailLabel}>Item</Text>
                    <Text style={styles.detailValue}>{transaction.item}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>
                      {transaction.quantity}
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 16 }]}>
                  <View>
                    <Text style={styles.detailLabel}>Total Amount</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        { color: BuyerColors.primaryGreen, fontSize: 20 },
                      ]}
                    >
                      {transaction.amount}
                    </Text>
                  </View>
                </View>

                <View style={styles.dashedLine} />

                {/* Technical Blockchain Proof */}
                <Text
                  style={[
                    styles.detailLabel,
                    { marginBottom: 12, color: BuyerColors.primaryGreen },
                  ]}
                >
                  BLOCKCHAIN PROOF
                </Text>

                <View style={styles.techRow}>
                  <Box size={14} color="#666" />
                  <Text style={styles.techKey}>Block Height:</Text>
                  <Text style={styles.techValue}>
                    {transaction.blockNumber}
                  </Text>
                </View>

                <View style={styles.techRow}>
                  <FileText size={14} color="#666" />
                  <Text style={styles.techKey}>Smart Contract:</Text>
                  <Text style={styles.techValue}>
                    {transaction.smartContract}
                  </Text>
                </View>

                <View style={styles.techRow}>
                  <Clock size={14} color="#666" />
                  <Text style={styles.techKey}>Timestamp:</Text>
                  <Text style={styles.techValue}>{transaction.date}</Text>
                </View>

                <Text
                  style={[
                    styles.detailLabel,
                    { marginTop: 16, marginBottom: 6 },
                  ]}
                >
                  TRANSACTION HASH (ID)
                </Text>
                <View style={styles.hashBox}>
                  <Text
                    style={styles.hashText}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {transaction.txId}
                  </Text>
                  <Copy size={14} color="#999" />
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeReceiptButton}
                onPress={onClose}
              >
                <Text style={styles.closeReceiptText}>Close Receipt</Text>
              </TouchableOpacity>
            </View>
          )}
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
  receiptHeader: {
    backgroundColor: BuyerColors.primaryGreen,
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
  receiptTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  receiptSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 17,
    color: "#333",
    fontWeight: "600",
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderStyle: "dashed",
    borderRadius: 1,
    marginVertical: 20,
  },
  techRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  techKey: {
    fontSize: 14,
    color: "#666",
    width: 120,
  },
  techValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  hashBox: {
    backgroundColor: "#f4f4f4",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hashText: {
    fontSize: 12,
    fontFamily: "Courier",
    color: "#555",
    flex: 1,
    marginRight: 8,
  },
  closeReceiptButton: {
    padding: 18,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  closeReceiptText: {
    color: "#555",
    fontWeight: "600",
    fontSize: 15,
  },
});
