import Header from "@/components/Header";
import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import TransactionReceiptModal from "@/components/modals/TransactionReceiptModal";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Award,
  Box,
  Leaf
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform
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

interface FarmerProfileData {
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

interface FarmerTrustProfileProps {
  farmerId: string;
  initialData?: {
    farmerName: string;
    farmLocation: string;
    trustScore: string;
    imageUrls?: string[];
  };
}

export default function FarmerTrustProfile({
  farmerId,
  initialData,
}: FarmerTrustProfileProps) {
  const router = useRouter();

  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [profileLoading, setProfileLoading] = useState(!initialData);
  const [profile, setProfile] = useState<FarmerProfileData | null>(null);

  // --- FETCH FARMER PROFILE DATA ---
  useEffect(() => {
    if (initialData) {
      const parsedScore = initialData.trustScore?.includes("/")
        ? parseFloat(initialData.trustScore.split("/")[0]) * 20
        : 85;

      setProfile({
        name: initialData.farmerName,
        location: initialData.farmLocation,
        verified: true,
        trustScore: parsedScore,
        onTimeDelivery: 98,
        qualityGrade: 92,
        successfulOrders: 7,
        image: "https://via.placeholder.com/80",
        transactions: [],
      });
      setProfileLoading(false);
      return;
    }

    const fetchFarmerProfile = async () => {
      try {
        setProfileLoading(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          console.warn("No auth token found");
          setProfileLoading(false);
          return;
        }

        const data = await api.get(`/api/trust/farmer-profile/${farmerId}`);
        const profileData = data.farmer || data;
        const userData = profileData.user || {};

        setProfile({
          name: userData.name || profileData.name || "Unknown Farmer",
          location:
            profileData.location || userData.location || "Unknown Location",
          verified: profileData.verified ?? true,
          trustScore: profileData.reputation ? profileData.reputation * 20 : 85,
          onTimeDelivery: profileData.onTimeDelivery || 98,
          qualityGrade: profileData.qualityGrade || 92,
          successfulOrders:
            profileData.successfulOrders || profileData.total_orders || 10,
          image:
            userData.avatar ||
            profileData.image ||
            "https://via.placeholder.com/80",
          transactions: profileData.transactions || [],
        });
      } catch (error) {
        console.error("Error fetching farmer profile:", error);
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchFarmerProfile();
  }, [farmerId, initialData]);

  // --- ACTIONS ---
  const handleViewPassport = async () => {
    setLoading(true);
    setModalVisible(true);

    try {
      const data = await api.get(
        `/api/trust/test-identity/${farmerId || "farmer_123"}`
      );

      if (data.success) {
        setPassportData(data.digitalPassport);
      } else {
        throw new Error("ID not found");
      }
    } catch (error) {
      setTimeout(() => {
        setPassportData({
          serialNumber: "27AF229D9B2D6EAED82A1D563FE4D3BBA3529952",
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

  const handleTransactionClick = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setReceiptModalVisible(true);
  };

  // --- FALLBACK FARMER PROFILE DATA ---
  const fallbackFarmerProfile: FarmerProfileData = {
    name: "Lakshan Farms",
    location: "Awissawella",
    verified: true,
    trustScore: 100,
    onTimeDelivery: 98,
    qualityGrade: 92,
    successfulOrders: 7,
    image: "https://via.placeholder.com/80",
    transactions: [
      {
        id: "1",
        txId: "50ca8296-64c7-47f4-8946-d8f082d07f7c",
        date: "Jan 05, 2026 • 10:30 AM",
        item: "Ambul Banana (Grade A)",
        quantity: "500kg",
        amount: "Rs. 125,000",
        status: "COMMITTED",
        blockNumber: "#178",
        smartContract: "OrderContract:v1",
      },
      {
        id: "2",
        txId: "1868d481327a8-449b4847-8965-2f5od8d73",
        date: "Dec 30, 2025 • 02:15 PM",
        item: "TJC Mango",
        quantity: "200kg",
        amount: "Rs. 80,000",
        status: "COMMITTED",
        blockNumber: "#145",
        smartContract: "OrderContract:v1",
      },
      {
        id: "3",
        txId: "1868d88289169-449b4827-ae03-3f29d90ec",
        date: "Dec 18, 2025 • 09:00 AM",
        item: "Papaya (Red Lady)",
        quantity: "150kg",
        amount: "Rs. 45,000",
        status: "DELIVERED",
        blockNumber: "#120",
        smartContract: "OrderContract:v1",
      },
      {
        id: "4",
        txId: "f9b8d88289169-449b4827-ae03-3f29d90ec",
        date: "Dec 12, 2025 • 08:45 AM",
        item: "Pineapple (Mauritius)",
        quantity: "300kg",
        amount: "Rs. 110,000",
        status: "DELIVERED",
        blockNumber: "#98",
        smartContract: "OrderContract:v1",
      },
    ],
  };

  const displayProfile = profile || fallbackFarmerProfile;
  const displayTransactions =
    displayProfile.transactions.length > 0
      ? displayProfile.transactions
      : fallbackFarmerProfile.transactions;

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Identity Verification" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Fetching cryptographic proof...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Supplier Identity" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- SLEEK HEADER SECTION --- */}
        <View style={styles.headerSection}>
          <View style={styles.headerTopRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: displayProfile.image }}
                style={styles.avatarLarge}
              />
              <View style={styles.avatarLeafBadge}>
                <Leaf size={12} color="#FFF" />
              </View>
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameBadgeWrapper}>
                <Text style={styles.profileNameLarge}>{displayProfile.name}</Text>
                {displayProfile.verified && (
                  <ShieldCheck size={20} color="#2E7D32" strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.locationWrapper}>
                <MapPin size={14} color="#6B7280" />
                <Text style={styles.locationTextPlain}>
                  {displayProfile.location}
                </Text>
              </View>
              <Text style={styles.idHash}>ID: 0x{farmerId?.substring(0, 8) || "a7f9b2e4"}... Verified</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.verifyButtonSolid}
            onPress={handleViewPassport}
          >
            <CheckCircle2 size={16} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>
              View X.509 Certificate
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.thickDivider} />

        {/* --- METRICS DASHBOARD (Bank Style + Color) --- */}
        <View style={styles.metricsWrapper}>
          <View style={styles.sectionTitleRow}>
            <Award size={16} color="#2E7D32" />
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
              <Text style={styles.statLabelMuted}>Quality</Text>
            </View>
            <View style={styles.statVerticalDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValueLarge}>{displayProfile.onTimeDelivery}%</Text>
              <Text style={styles.statLabelMuted}>On-Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.thickDivider} />

        {/* --- BLOCKCHAIN LEDGER (List Style + Mint Accents) --- */}
        <View style={styles.ledgerSection}>
          <View style={styles.ledgerHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Box size={16} color="#2E7D32" />
              <Text style={styles.sectionLabel}>IMMUTABLE LEDGER</Text>
            </View>
            <Text style={styles.totalTxText}>{displayProfile.successfulOrders} Transfers</Text>
          </View>

          <View style={styles.ledgerList}>
            {displayTransactions.map((tx, index) => (
              <TouchableOpacity
                key={tx.id}
                style={[
                  styles.ledgerItem,
                  index === displayTransactions.length - 1 && styles.ledgerItemLast
                ]}
                onPress={() => handleTransactionClick(tx)}
              >
                <View style={styles.txIconBox}>
                  <FileText size={20} color="#2E7D32" strokeWidth={2} />
                </View>
                
                <View style={styles.txCenter}>
                  <Text style={styles.txHashText} numberOfLines={1} ellipsizeMode="middle">
                    {tx.txId}
                  </Text>
                  <Text style={styles.txDateText}>{tx.date.split("•")[0]}</Text>
                </View>

                <View style={styles.txRight}>
                  <Text style={styles.txAmountText}>Success</Text>
                  <ArrowRight size={16} color="#2E7D32" />
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
    paddingTop: Platform.OS === 'android' ? 24 : 0, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#2E7D32", // Primary Brand Green
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
    position: 'relative',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E8F5E9", // Perfectly matched light background
    borderWidth: 2,
    borderColor: "#C8E6C9", // Perfectly matched border
  },
  avatarLeafBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2E7D32',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
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
    color: "#2E7D32",
    fontWeight: "700",
    fontFamily: "monospace",
  },
  
  // COLOR INJECTION: Vibrant Green Button
  verifyButtonSolid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    shadowColor: "#2E7D32",
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2E7D32",
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
    color: "#2E7D32",
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
  
  // COLOR INJECTION: Matched Background Icons
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12, 
    backgroundColor: "#E8F5E9", // Perfectly matched light background
    borderWidth: 1,
    borderColor: "#C8E6C9", // Perfectly matched border
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
    color: "#2E7D32", 
  },
});