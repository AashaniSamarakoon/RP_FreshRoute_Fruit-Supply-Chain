import Header from "@/components/Header";
import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import TransactionReceiptModal from "@/components/modals/TransactionReceiptModal";
import { BuyerColors } from "@/constants/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, MapPin, ShieldCheck, Wallet } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

// --- INTERFACES ---
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

interface PassportData {
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
}

export default function TrustProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false); // New State
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null); // New State

  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);

  // --- ACTIONS ---
  const handleViewPassport = async () => {
    setLoading(true);
    setModalVisible(true);

    try {
      const API_URL = "http://192.168.1.4:3000";
      const response = await fetch(
        `${API_URL}/api/trust/test-identity/${id || "user_123"}`
      );
      const data = await response.json();

      if (data.success) {
        setPassportData(data.digitalPassport);
      } else {
        throw new Error("ID not found");
      }
    } catch (error) {
      console.log("Backend unreachable, switching to Demo Mode.");
      setTimeout(() => {
        setPassportData({
          serialNumber: "65FB229D9B2D6EAED82A1D563FE4D3BBA3529952",
          issuer: "FreshRoute CA (Hyperledger Fabric)",
          subject: "CN=Lakshan Farms, OU=Farmer, O=FreshRoute, C=LK",
          validFrom: "Jan 01, 2026",
          validTo: "Jan 01, 2027",
          fingerprint:
            "27:AF:E2:F9:8B:DB:D9:09:7D:FB:D3:9B:3E:F1:15:62:34:80:FA:C1",
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  // Handle Transaction Click
  const handleTransactionClick = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setReceiptModalVisible(true);
  };

  // --- MOCK DATA (UPDATED WITH RECEIPT DETAILS) ---
  const farmerProfile = {
    name: "Lakshan Farms",
    location: "Awissawella",
    verified: true,
    trustScore: 100,
    onTimeDelivery: 98,
    qualityGrade: 92,
    successfulOrders: 10,
    image: "https://via.placeholder.com/80",
    transactions: [
      {
        id: "1",
        txId: "50ca8296-64c7-47f4-8946-d8f082d07f7c",
        date: "Aug 24, 2024 • 10:30 AM",
        item: "Ambul Banana (Grade A)",
        quantity: "500kg",
        amount: "Rs. 125,000",
        status: "COMMITTED",
        blockNumber: "#1042",
        smartContract: "OrderContract:v1",
      },
      {
        id: "2",
        txId: "1868d481327a8-449b4847-8965-2f5od8d73...",
        date: "Jun 12, 2024 • 02:15 PM",
        item: "TJC Mango",
        quantity: "200kg",
        amount: "Rs. 80,000",
        status: "COMMITTED",
        blockNumber: "#988",
        smartContract: "OrderContract:v1",
      },
      {
        id: "3",
        txId: "1868d88289169-449b4827-ae03-3f29d90ec...",
        date: "Jun 01, 2024 • 09:00 AM",
        item: "Papaya (Red Lady)",
        quantity: "150kg",
        amount: "Rs. 45,000",
        status: "DELIVERED",
        blockNumber: "#950",
        smartContract: "OrderContract:v1",
      },
      {
        id: "4",
        txId: "1868d88289169-449b4827-ae03-3f29d90ec...",
        date: "Jun 01, 2024 • 08:45 AM",
        item: "Pineapple (Mauritius)",
        quantity: "300kg",
        amount: "Rs. 110,000",
        status: "DELIVERED",
        blockNumber: "#948",
        smartContract: "OrderContract:v1",
      },
      {
        id: "5",
        txId: "1868d88289169-449b4827-ae03-3f29d90ec...",
        date: "Jun 01, 2024 • 08:45 AM",
        item: "Pineapple (Mauritius)",
        quantity: "300kg",
        amount: "Rs. 110,000",
        status: "DELIVERED",
        blockNumber: "#948",
        smartContract: "OrderContract:v1",
      },
    ] as TransactionItem[],
  };

  const needleRotation = (farmerProfile.trustScore / 100) * 180 - 90;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Farmer Trust Profile" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Farmer Info Card */}
        <View style={styles.farmerCard}>
          <View style={styles.farmerCardLeft}>
            <View style={styles.farmerNameRow}>
              <Text style={styles.farmerName}>{farmerProfile.name}</Text>
              {farmerProfile.verified && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color={BuyerColors.primaryGreen} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <MapPin size={16} color={BuyerColors.textGray} />
              <Text style={styles.locationText}>{farmerProfile.location}</Text>
            </View>

            {/* View Digital ID Button */}
            <TouchableOpacity
              style={styles.passportButton}
              onPress={handleViewPassport}
            >
              <Text style={styles.passportButtonText}>View Digital ID</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: farmerProfile.image }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Trust Score Card */}
        <View style={styles.trustScoreCard}>
          <View style={styles.trustScoreLeft}>
            <Text style={styles.trustScoreLabel}>Trust Score</Text>
            <Text style={styles.trustScoreValue}>
              {farmerProfile.trustScore}%
            </Text>
          </View>
          <View style={styles.gaugeContainer}>
            <Svg width={120} height={70} viewBox="0 0 120 70">
              <Path
                d="M 10 60 A 45 45 0 0 1 110 60"
                fill="none"
                stroke={BuyerColors.primaryGreen}
                strokeWidth="16"
                strokeLinecap="round"
              />
              <Path
                d="M 10 60 A 45 45 0 0 1 110 60"
                fill="none"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <Path
                d={`M 10 60 A 45 45 0 0 1 ${
                  10 + 100 * (farmerProfile.trustScore / 100)
                } 60`}
                fill="none"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <G transform={`rotate(${needleRotation} 60 60)`}>
                <Path
                  d="M 54 60 Q 58 35 60 10 Q 62 35 66 60 Q 60 67 54 60"
                  fill="#ffffff"
                  stroke={BuyerColors.primaryGreen}
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              </G>
            </Svg>
          </View>
        </View>

        {/* Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>On-time Delivery</Text>
            <Text style={styles.metricValue}>
              {farmerProfile.onTimeDelivery}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Quality Grade A</Text>
            <Text style={styles.metricValue}>
              {farmerProfile.qualityGrade}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Successful Orders</Text>
            <Text style={styles.metricValue}>
              {farmerProfile.successfulOrders}
            </Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={styles.transactionsTitle}>
            Recent Blockchain Verified Transactions
          </Text>

          <View style={styles.transactionsContainer}>
            {farmerProfile.transactions.map((tx, index) => (
              <View key={tx.id}>
                <TouchableOpacity
                  style={styles.transactionItem}
                  onPress={() => handleTransactionClick(tx)}
                >
                  <View style={styles.transactionIcon}>
                    <Wallet size={24} color={BuyerColors.primaryGreen} />
                  </View>
                  <View style={styles.transactionContent}>
                    <Text style={styles.transactionId}>
                      {tx.txId.substring(0, 24)}...
                    </Text>
                    <Text style={styles.transactionLabel}>
                      Tap to view Receipt
                    </Text>
                    <Text style={styles.transactionDate}>
                      {tx.date.split("•")[0]}
                    </Text>
                  </View>
                  <ArrowRight size={20} color={BuyerColors.textGray} />
                </TouchableOpacity>
                {index < farmerProfile.transactions.length - 1 && (
                  <View style={styles.transactionDivider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* View All Button */}
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All Transactions</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODAL 1: DIGITAL IDENTITY (Original) --- */}
      <DigitalPassportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loading={loading}
        passportData={passportData}
      />

      {/* --- MODAL 2: TRANSACTION RECEIPT (New) --- */}
      <TransactionReceiptModal
        visible={receiptModalVisible}
        onClose={() => setReceiptModalVisible(false)}
        transaction={selectedTx}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffffff",
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // Farmer Card
  farmerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  farmerCardLeft: {
    flex: 1,
  },

  farmerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  farmerName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BuyerColors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  verifiedText: {
    fontSize: 12,
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },

  locationText: {
    fontSize: 17,
    color: BuyerColors.textGray,
    fontWeight: "500",
  },

  passportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 6,
  },
  passportButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    backgroundColor: "#E0E0E0",
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  // Trust Score Card
  trustScoreCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  trustScoreLeft: {
    flex: 1,
  },

  trustScoreLabel: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 8,
  },

  trustScoreValue: {
    fontSize: 50,
    fontWeight: "800",
    color: "#fff",
  },

  trustScoreRight: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
  },

  gaugeContainer: {
    width: 120,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },

  // Metrics
  metricsContainer: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
  },

  metricCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },

  metricLabel: {
    fontSize: 14,
    color: "#333",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },

  metricValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
  },

  // Transactions
  transactionsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },

  transactionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
  },

  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  transactionsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },

  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },

  transactionDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 62,
  },

  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  transactionContent: {
    flex: 1,
  },

  transactionId: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },

  transactionLabel: {
    fontSize: 11,
    color: BuyerColors.textGray,
    fontWeight: "500",
    marginBottom: 4,
  },

  transactionDate: {
    fontSize: 12,
    color: BuyerColors.textGray,
    fontWeight: "500",
  },

  // View All Button
  viewAllButton: {
    marginHorizontal: 16,
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },

  viewAllButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
