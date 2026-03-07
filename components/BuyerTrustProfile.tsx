import Header from "@/components/Header";
import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import TransactionReceiptModal from "@/components/modals/TransactionReceiptModal";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Award,
  Box,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
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

interface BuyerProfileData {
  name: string;
  location: string;
  verified: boolean;
  trustScore: number;
  onTimeDelivery: number;
  qualityGrade: number;
  successfulOrders: number;
  image: string;
  transactions: TransactionItem[];
}

interface BuyerTrustProfileProps {
  buyerId: string;
  initialData?: {
    name: string;
    location: string;
    trustScore: string;
  };
}

export default function BuyerTrustProfile({
  buyerId,
  initialData,
}: BuyerTrustProfileProps) {
  const router = useRouter();

  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [profileLoading, setProfileLoading] = useState(!initialData);
  const [profile, setProfile] = useState<BuyerProfileData | null>(null);

  // --- FETCH BUYER PROFILE DATA ---
  useEffect(() => {
    if (initialData) {
      const parsedScore = initialData.trustScore?.includes("/")
        ? parseFloat(initialData.trustScore.split("/")[0]) * 20
        : 85;

      setProfile({
        name: initialData.name,
        location: initialData.location,
        verified: true,
        trustScore: parsedScore,
        onTimeDelivery: 98,
        qualityGrade: 95,
        successfulOrders: 7,
        image: "https://via.placeholder.com/80",
        transactions: [],
      });
      setProfileLoading(false);
      return;
    }

    const fetchBuyerProfile = async () => {
      try {
        setProfileLoading(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          console.warn("No auth token found");
          setProfileLoading(false);
          return;
        }

        const data = await api.get(`/api/trust/buyer-profile/${buyerId}`);
        console.log("Buyer profile data:", data);

        const profileData = data.buyer || data;
        const userData = profileData.user || {};

        setProfile({
          name: userData.name || profileData.name || "Unknown Buyer",
          location:
            profileData.location || userData.location || "Unknown Location",
          verified: profileData.verified ?? true,
          trustScore: profileData.reputation ? profileData.reputation * 20 : 85,
          onTimeDelivery: profileData.onTimeDelivery || 98,
          qualityGrade: profileData.qualityGrade || 95,
          successfulOrders:
            profileData.successfulOrders || profileData.total_orders || 150,
          image:
            userData.avatar ||
            profileData.image ||
            "https://via.placeholder.com/80",
          transactions: profileData.transactions || [],
        });
      } catch (error) {
        console.error("Error fetching buyer profile:", error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchBuyerProfile();
  }, [buyerId, initialData]);

  // --- ACTIONS ---
  const handleViewPassport = async () => {
    setLoading(true);
    setModalVisible(true);

    try {
      const data = await api.get(
        `/api/trust/test-identity/${buyerId || "buyer_123"}`,
      );

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
          issuer: "FreshRoute Buyer Network (Hyperledger Fabric)",
          subject: "CN=Fresh Mart, OU=Buyer, O=FreshRoute, C=LK",
          validFrom: "Jan 01, 2026",
          validTo: "Jan 01, 2027",
          fingerprint:
            "3B:C9:F4:E7:2D:A1:8F:5C:9E:6B:D2:7A:4E:1F:8C:53:7B:C0:D4:A5",
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionClick = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setReceiptModalVisible(true);
  };

  // --- FALLBACK BUYER PROFILE DATA ---
  const fallbackBuyerProfile: BuyerProfileData = {
    name: "Fresh Mart",
    location: "Colombo",
    verified: true,
    trustScore: 88,
    onTimeDelivery: 96,
    qualityGrade: 95,
    successfulOrders: 7,
    image: "https://via.placeholder.com/80",
    transactions: [
      {
        id: "1",
        txId: "b8a7c234-5d6e-47f9-9c1d-a2e4f6b3c9d1",
        date: "Jan 02, 2026 • 14:00 PM",
        item: "Pineapple (Mauritius)",
        quantity: "1000kg",
        amount: "Rs. 350,000",
        status: "COMMITTED",
        blockNumber: "#145",
        smartContract: "PurchaseContract:v1",
      },
      {
        id: "2",
        txId: "c9b8d345-6e7f-48g0-0d2e-b3f5g7c4d0e2...",
        date: "Dec 28, 2025 • 09:30 AM",
        item: "TJC Mango",
        quantity: "500kg",
        amount: "Rs. 180,000",
        status: "COMMITTED",
        blockNumber: "#120",
        smartContract: "PurchaseContract:v1",
      },
      {
        id: "3",
        txId: "d0c9e456-7f8g-49h1-1e3f-c4g6h8d5e1f3...",
        date: "Dec 15, 2025 • 11:00 AM",
        item: "Ambul Banana (Grade A)",
        quantity: "300kg",
        amount: "Rs. 95,000",
        status: "DELIVERED",
        blockNumber: "#98",
        smartContract: "PurchaseContract:v1",
      },
      {
        id: "4",
        txId: "e1d0f567-8g9h-50i2-2f4g-d5h7i9e6f2g4...",
        date: "Nov 25, 2025 • 16:45 PM",
        item: "Pineapple (Smooth Cayenne)",
        quantity: "400kg",
        amount: "Rs. 140,000",
        status: "DELIVERED",
        blockNumber: "#67",
        smartContract: "PurchaseContract:v1",
      },
    ],
  };

  const displayProfile = profile || fallbackBuyerProfile;
  const displayTransactions =
    displayProfile.transactions.length > 0
      ? displayProfile.transactions
      : fallbackBuyerProfile.transactions;

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Buyer Identity" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Fetching buyer profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Buyer Identity" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- HEADER SECTION --- */}
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: displayProfile.image }}
                style={styles.avatarLarge}
              />
              <View style={styles.avatarBadge}>
                <ShoppingBag size={12} color="#FFF" />
              </View>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameBadgeWrapper}>
                <Text style={styles.profileNameLarge}>{displayProfile.name}</Text>
                {displayProfile.verified && (
                  <ShieldCheck size={20} color={BuyerColors.primaryGreen} strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.locationWrapper}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.locationTextPlain}>
                  {displayProfile.location}
                </Text>
              </View>
              <Text style={styles.idHash}>
                ID: 0x{buyerId?.substring(0, 8) || "b4e2a7f9"}... Verified
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.verifyButtonSolid}
            onPress={handleViewPassport}
          >
            <CheckCircle2 size={16} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>View X.509 Certificate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.thickDivider} />

        {/* --- PLATFORM METRICS --- */}
        <View style={styles.metricsWrapper}>
          <View style={styles.sectionTitleRow}>
            <Award size={16} color={BuyerColors.primaryGreen} />
            <Text style={styles.sectionLabel}>PLATFORM METRICS</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValueLarge}>{displayProfile.trustScore}</Text>
              <Text style={styles.statLabelMuted}>Trust Score</Text>
            </View>
            <View style={styles.statVerticalDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValueLarge}>{displayProfile.qualityGrade}%</Text>
              <Text style={styles.statLabelMuted}>Standards</Text>
            </View>
            <View style={styles.statVerticalDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValueLarge}>{displayProfile.onTimeDelivery}%</Text>
              <Text style={styles.statLabelMuted}>On-Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.thickDivider} />

        {/* --- IMMUTABLE LEDGER --- */}
        <View style={styles.ledgerSection}>
          <View style={styles.ledgerHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Box size={16} color={BuyerColors.primaryGreen} />
              <Text style={styles.sectionLabel}>PURCHASE LEDGER</Text>
            </View>
            <Text style={styles.totalTxText}>
              {displayProfile.successfulOrders} Purchases
            </Text>
          </View>

          <View style={styles.ledgerList}>
            {displayTransactions.map((tx, index) => (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.ledgerItem,
                  index === displayTransactions.length - 1 && styles.ledgerItemLast,
                ]}
                onPress={() => handleTransactionClick(tx)}
              >
                <View style={styles.txIconBox}>
                  <FileText size={20} color={BuyerColors.primaryGreen} strokeWidth={2} />
                </View>

                <View style={styles.txCenter}>
                  <Text style={styles.txHashText} numberOfLines={1} ellipsizeMode="middle">
                    {tx.txId}
                  </Text>
                  <Text style={styles.txDateText}>{tx.date.split("•")[0]}</Text>
                </View>

                <View style={styles.txRight}>
                  <Text style={styles.txAmountText}>Success</Text>
                  <ArrowRight size={16} color={BuyerColors.primaryGreen} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <DigitalPassportModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        loading={loading}
        passportData={passportData}
      />

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
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "android" ? 24 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // --- TOP HEADER SECTION ---
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F5E9",
    borderWidth: 2,
    borderColor: "#C8E6C9",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: BuyerColors.primaryGreen,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  headerInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: "center",
  },
  nameBadgeWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  profileNameLarge: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  locationTextPlain: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  idHash: {
    fontSize: 12,
    color: BuyerColors.primaryGreen,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  verifyButtonSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    shadowColor: BuyerColors.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // --- SEPARATORS ---
  thickDivider: {
    height: 8,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },

  // --- METRICS SECTION ---
  metricsWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: BuyerColors.primaryGreen,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBlock: {
    flex: 1,
    alignItems: "flex-start",
  },
  statVerticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  statValueLarge: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  statLabelMuted: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },

  // --- LEDGER SECTION ---
  ledgerSection: {
    paddingTop: 24,
  },
  ledgerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  totalTxText: {
    fontSize: 13,
    color: BuyerColors.primaryGreen,
    fontWeight: "700",
  },
  ledgerList: {
    borderTopWidth: 1,
    borderColor: "#F3F4F6",
  },
  ledgerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  ledgerItemLast: {
    borderBottomWidth: 0,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  txCenter: {
    flex: 1,
    justifyContent: "center",
  },
  txHashText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  txDateText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  txRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: "700",
    color: BuyerColors.primaryGreen,
  },
});
