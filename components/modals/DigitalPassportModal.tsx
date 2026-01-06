import { BuyerColors } from "@/constants/theme";
import { CircleCheckBig, ShieldCheck, X } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PassportData {
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
}

interface DigitalPassportModalProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  passportData: PassportData | null;
}

export default function DigitalPassportModal({
  visible,
  onClose,
  loading,
  passportData,
}: DigitalPassportModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <ShieldCheck size={22} color={BuyerColors.primaryGreen} />
              <Text style={styles.modalTitle}>Digital Passport</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size="large"
                color={BuyerColors.primaryGreen}
              />
              <Text style={styles.loadingText}>
                Verifying Blockchain Identity...
              </Text>
            </View>
          ) : (
            passportData && (
              <View style={styles.passportDetails}>
                <Text style={styles.passportLabel}>Serial Number</Text>
                <Text style={styles.passportValueMono}>
                  {passportData.serialNumber}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.passportValueMono}>
                  {passportData.fingerprint}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.passportLabel}>Issued By (CA)</Text>
                <Text style={styles.passportValue}>{passportData.issuer}</Text>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passportLabel}>Valid From</Text>
                    <Text style={styles.passportValue}>
                      {passportData.validFrom}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passportLabel}>Valid To</Text>
                    <Text
                      style={[
                        styles.passportValue,
                        {
                          color: BuyerColors.primaryGreen,
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {passportData.validTo}
                    </Text>
                  </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.verifiedFooter}>
                  <CircleCheckBig size={16} color="white" />
                  <Text style={styles.verifiedFooterText}>
                    Cryptographically Verified
                  </Text>
                </View>
              </View>
            )
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
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#888",
    fontSize: 14,
  },
  passportDetails: {
    gap: 12,
  },
  passportLabel: {
    fontSize: 12,
    color: "#888",
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  passportValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  passportValueMono: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Courier",
    fontWeight: "600",
    backgroundColor: "#f4f4f4",
    padding: 8,
    borderRadius: 6,
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  verifiedFooter: {
    marginTop: 12,
    backgroundColor: BuyerColors.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  verifiedFooterText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
