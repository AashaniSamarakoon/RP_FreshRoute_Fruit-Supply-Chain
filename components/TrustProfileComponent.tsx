import Header from "@/components/Header";
import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import TransactionReceiptModal from "@/components/modals/TransactionReceiptModal";
import { BACKEND_URL } from "@/config";
import { BuyerColors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ArrowRight, MapPin, ShieldCheck, Wallet } from "lucide-react-native";
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
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

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

interface ProfileData {
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

interface InitialProfileData {
  name: string;
  location: string;
  trustScore: string;
}

interface TrustProfileProps {
  userType: "farmer" | "buyer"; // 'farmer' or 'buyer'
  userId?: string;
  initialData?: InitialProfileData; // Data passed from MatchedStocks
}

export default function TrustProfileComponent({
  userType,
  userId,
  initialData,
}: TrustProfileProps) {
  const router = useRouter();

  // --- STATE ---
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  // If initialData is provided, skip loading state
  const [profileLoading, setProfileLoading] = useState(!initialData);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // --- FETCH PROFILE DATA ---
  useEffect(() => {
    // If initialData is provided from navigation, use it directly
    if (initialData) {
      // Parse trust score from string like "4.5/5" to number
      const parsedScore = initialData.trustScore?.includes("/")
        ? parseFloat(initialData.trustScore.split("/")[0]) * 20
        : 90;

      setProfile({
        name: initialData.name,
        location: initialData.location,
        verified: true,
        trustScore: parsedScore,
        onTimeDelivery: 98, // Default values for now
        qualityGrade: 92,
        successfulOrders: 10,
        image: "https://via.placeholder.com/80",
        transactions: [],
      });
      setProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      if (!userId) {
        setProfileLoading(false);
        return;
      }

      try {
        setProfileLoading(true);
        const token = await AsyncStorage.getItem("token");

        if (!token) {
          console.warn("No auth token found");
          setProfileLoading(false);
          return;
        }

        // Use trust profile endpoint which is accessible by any authenticated user
        const endpoint =
          userType === "buyer"
            ? `${BACKEND_URL}/api/trust/farmer-profile/${userId}`
            : `${BACKEND_URL}/api/trust/buyer-profile/${userId}`;

        console.log("Fetching profile from:", endpoint);

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const data = await response.json();
        console.log("Profile data:", data);

        // Transform the API response to match our ProfileData structure
        const profileData = data.farmer || data.buyer || data;
        const userData = profileData.user || {};

        setProfile({
          name: userData.name || profileData.name || "Unknown",
          location:
            profileData.location || userData.location || "Unknown Location",
          verified: profileData.verified ?? true,
          trustScore: profileData.reputation ? profileData.reputation * 20 : 90,
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
        console.error("Error fetching profile:", error);
        // Fall back to default data on error
        setProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [userId, userType, initialData]);

  // --- ACTIONS ---
  const handleViewPassport = async () => {
    setLoading(true);
    setModalVisible(true);

    try {
      // const API_URL = "http://192.168.1.4:4000";
      const response = await fetch(
        `${BACKEND_URL}/api/trust/test-identity/${userId || "user_123"}`
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
          issuer:
            userType === "farmer"
              ? "FreshRoute Buyer Network (Hyperledger Fabric)"
              : "FreshRoute CA (Hyperledger Fabric)",
          subject:
            userType === "farmer"
              ? "CN=Fresh Mart, OU=Buyer, O=FreshRoute, C=LK"
              : "CN=Lakshan Farms, OU=Farmer, O=FreshRoute, C=LK",
          validFrom: "Jan 01, 2026",
          validTo: "Jan 01, 2027",
          fingerprint:
            userType === "farmer"
              ? "3B:C9:F4:E7:2D:A1:8F:5C:9E:6B:D2:7A:4E:1F:8C:53:7B:C0:D4:A5"
              : "27:AF:E2:F9:8B:DB:D9:09:7D:FB:D3:9B:3E:F1:15:62:34:80:FA:C1",
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

  // --- MOCK DATA (fallback when API fails or no userId) ---
  // When buyer views, show farmer profile; when farmer views, show buyer profile
  const fallbackProfile: ProfileData =
    userType === "farmer"
      ? {
          name: "Fresh Mart",
          location: "Colombo",
          verified: true,
          trustScore: 100,
          onTimeDelivery: 96,
          qualityGrade: 95,
          successfulOrders: 150,
          image: "https://via.placeholder.com/80",
          transactions: [
            {
              id: "1",
              txId: "b8a7c234-5d6e-47f9-9c1d-a2e4f6b3c9d1",
              date: "Aug 24, 2024 • 14:00 PM",
              item: "Fresh Vegetables Batch",
              quantity: "1000kg",
              amount: "Rs. 350,000",
              status: "COMMITTED",
              blockNumber: "#1050",
              smartContract: "PurchaseContract:v1",
            },
            {
              id: "2",
              txId: "c9b8d345-6e7f-48g0-0d2e-b3f5g7c4d0e2...",
              date: "Aug 20, 2024 • 09:30 AM",
              item: "Premium Fruits Mix",
              quantity: "500kg",
              amount: "Rs. 180,000",
              status: "COMMITTED",
              blockNumber: "#1038",
              smartContract: "PurchaseContract:v1",
            },
            {
              id: "3",
              txId: "d0c9e456-7f8g-49h1-1e3f-c4g6h8d5e1f3...",
              date: "Aug 15, 2024 • 11:00 AM",
              item: "Organic Produce",
              quantity: "300kg",
              amount: "Rs. 95,000",
              status: "DELIVERED",
              blockNumber: "#1020",
              smartContract: "PurchaseContract:v1",
            },
            {
              id: "4",
              txId: "e1d0f567-8g9h-50i2-2f4g-d5h7i9e6f2g4...",
              date: "Aug 10, 2024 • 16:45 PM",
              item: "Seasonal Fruits",
              quantity: "400kg",
              amount: "Rs. 140,000",
              status: "DELIVERED",
              blockNumber: "#1005",
              smartContract: "PurchaseContract:v1",
            },
          ],
        }
      : {
          name: "Lakshan Farms",
          location: "Awissawella",
          verified: true,
          trustScore: 90,
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
          ],
        };

  // Use fetched profile or fallback
  const displayProfile = profile || fallbackProfile;

  // If profile has no transactions, use fallback transactions
  const displayTransactions =
    displayProfile.transactions.length > 0
      ? displayProfile.transactions
      : fallbackProfile.transactions;

  const needleRotation = (displayProfile.trustScore / 100) * 180 - 90;

  // Show loading state
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={
            userType === "farmer"
              ? "Buyer Trust Profile"
              : "Farmer Trust Profile"
          }
          onBack={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={
          userType === "farmer" ? "Buyer Trust Profile" : "Farmer Trust Profile"
        }
        onBack={() => router.back()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardLeft}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{displayProfile.name}</Text>
              {displayProfile.verified && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color={BuyerColors.primaryGreen} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.locationRow}>
              <MapPin size={16} color={BuyerColors.textGray} />
              <Text style={styles.locationText}>{displayProfile.location}</Text>
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
              source={{ uri: displayProfile.image }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Trust Score Card */}
        <View style={styles.trustScoreCard}>
          <View style={styles.trustScoreLeft}>
            <Text style={styles.trustScoreLabel}>Trust Score</Text>
            <Text style={styles.trustScoreValue}>
              {displayProfile.trustScore}%
            </Text>
          </View>
          <View style={styles.gaugeContainer}>
            <Svg width={120} height={70} viewBox="0 0 120 70">
              <Path
                d="M 10 60 A 45 45 0 0 1 110 60"
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
            <Text style={styles.metricLabel}>
              {userType === "buyer" ? "On-time Delivery" : "On-time Purchase"}
            </Text>
            <Text style={styles.metricValue}>
              {displayProfile.onTimeDelivery}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              {userType === "buyer" ? "Quality Grade A" : "Quality Standards"}
            </Text>
            <Text style={styles.metricValue}>
              {displayProfile.qualityGrade}%
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              {userType === "buyer"
                ? "Successful Orders"
                : "Successful Purchases"}
            </Text>
            <Text style={styles.metricValue}>
              {displayProfile.successfulOrders}
            </Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={styles.transactionsTitle}>
            {userType === "buyer"
              ? "Recent Sold Transactions"
              : "Recent Purchase Transactions"}
          </Text>

          <View style={styles.transactionsContainer}>
            {displayTransactions.map((tx, index) => (
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
                {index < displayTransactions.length - 1 && (
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
    backgroundColor: "#ffffffff",
    paddingTop: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: BuyerColors.textGray,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  profileCard: {
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

  profileCardLeft: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },

  profileName: {
    fontSize: 23,
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
    gap: 6,
    marginBottom: 12,
  },

  locationText: {
    fontSize: 16,
    color: BuyerColors.textGray,
    fontWeight: "500",
    // lineHeight: 20,
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

  trustScoreCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 0,

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
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },

  trustScoreValue: {
    fontSize: 45,
    fontWeight: "800",
    color: "#fff",
  },

  gaugeContainer: {
    width: 120,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },

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
