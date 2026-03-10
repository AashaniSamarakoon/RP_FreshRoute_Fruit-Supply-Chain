import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LifeBuoy,
  LogOut,
  MapPin,
  Settings,
  ShieldCheck,
  User
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { BuyerColors } from "../../../constants/theme";

// Dummy stats for the dashboard
const BUYER_STATS = [
  { label: "Active Orders", value: "3" },
  { label: "Completed", value: "24" },
  { label: "Saved Farms", value: "8" },
];

export default function BuyerProfile() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // user info + certificate
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [passportData, setPassportData] = useState<any | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Add logic to refresh profile data here if needed
    setTimeout(() => setRefreshing(false), 1000);
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user = data?.user;
      if (error) {
        console.warn("Failed to get supabase user", error);
        return;
      }
      if (user) {
        setUserId(user.id);
        // attempt to look up names from users table
        const { data: userData, error: uErr } = await supabase
          .from('users')
          .select('first_name,last_name,email')
          .eq('id', user.id)
          .single();
        if (uErr) {
          console.warn('failed to fetch user record', uErr);
        }
        const f = userData?.first_name || null;
        const l = userData?.last_name || null;
        setFirstName(f);
        setLastName(l);
        setUserName(
          f || l
            ? `${f || ''} ${l || ''}`.trim()
            : user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              "Buyer"
        );
      }
    };
    fetchUser();
  }, []);

  const handleViewCertificate = async () => {
    if (!userId) return;
    setLoadingCert(true);
    setCertModalVisible(true);
    try {
      const data = await api.get(`/api/trust/test-identity/${userId}`);
      if (data.success) {
        setPassportData(data.digitalPassport);
      } else {
        throw new Error("ID not found");
      }
    } catch (e) {
      console.warn("Certificate fetch failed, showing placeholder", e);
      setPassportData({
        serialNumber: "FR-8892-4B2A-9011",
        issuer: "FreshRoute Root CA",
        subject: userName || "Verified Buyer",
        validFrom: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        fingerprint: "A2:4F:99:B1:0C:E3",
      });
    } finally {
      setLoadingCert(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed", e);
    }
    await AsyncStorage.multiRemove([
      "token",
      "user",
      "onboarded",
      "onboarding_buyer",
    ]);
    router.replace("/login");
  };

  // Reusable Menu Item Component
  const MenuOption = ({ icon: Icon, title, subtitle, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconBox, isDestructive && styles.menuIconBoxDestructive]}>
        <Icon size={20} color={isDestructive ? "#EF4444" : "#4B5563"} />
      </View>
      <View style={styles.menuTextContent}>
        <Text style={[styles.menuTitle, isDestructive && styles.menuTitleDestructive]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#D1D5DB" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Account"
        showNotification={true}
        onNotificationPress={() => console.log("Notifications pressed")}
      />
      
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BuyerColors?.primaryGreen || "#2E7D32"]}
            tintColor={BuyerColors?.primaryGreen || "#2E7D32"}
          />
        }
      >
        {/* --- USER HEADER SECTION --- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{userName?.charAt(0).toUpperCase() || "B"}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userName || "Loading..."}</Text>
            {/* show identifier from session if available */}
            {userId && (
              <Text style={styles.userIdSmall} numberOfLines={1} ellipsizeMode="middle">
                {userId}
              </Text>
            )}
            <View style={styles.badgeRow}>
              <ShieldCheck size={14} color={BuyerColors.primaryGreen || "#2E7D32"} />
              <Text style={styles.verifiedText}>Verified Buyer</Text>
            </View>
          </View>
        </View>

        {/* --- STATS ROW --- */}
        {/* <View style={styles.statsContainer}>
          {BUYER_STATS.map((stat, index) => (
            <View key={index} style={styles.statBox}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View> */}

        {/* --- TRUST & IDENTITY --- */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Trust & Security</Text>
          <TouchableOpacity 
            style={styles.certificateCard} 
            onPress={handleViewCertificate}
            activeOpacity={0.8}
          >
            <View style={styles.certIconBg}>
              <CheckCircle2 size={24} color={BuyerColors.primaryGreen || "#2E7D32"} />
            </View>
            <View style={styles.certTextContent}>
              <Text style={styles.certTitle}>Digital Passport (X.509)</Text>
              <Text style={styles.certSubtitle}>View your cryptographic identity</Text>
            </View>
            {loadingCert ? (
              <ActivityIndicator color={BuyerColors.primaryGreen || "#2E7D32"} />
            ) : (
              <ChevronRight size={20} color="#9CA3AF" />
            )}
          </TouchableOpacity>
        </View>

        {/* --- ACCOUNT SETTINGS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.menuCard}>
            <MenuOption icon={User} title="Personal Information" subtitle="Update your details" />
            <View style={styles.menuDivider} />
            <MenuOption icon={MapPin} title="Delivery Addresses" subtitle="Manage drop-off locations" />
            <View style={styles.menuDivider} />
            <MenuOption icon={CreditCard} title="Payment Methods" subtitle="Cards and billing" />
            <View style={styles.menuDivider} />
            <MenuOption icon={Settings} title="Preferences" subtitle="Notifications and app settings" />
          </View>
        </View>

        {/* --- SUPPORT & ACTIONS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Support</Text>
          <View style={styles.menuCard}>
            <MenuOption icon={LifeBuoy} title="Help Center" subtitle="FAQs and contact support" />
            <View style={styles.menuDivider} />
            <MenuOption 
              icon={LogOut} 
              title="Sign Out" 
              isDestructive={true} 
              onPress={handleLogout} 
            />
          </View>
        </View>
        
        <Text style={styles.versionText}>FreshRoute v1.0.0</Text>
      </ScrollView>

      {/* certificate modal */}
      <DigitalPassportModal
        visible={certModalVisible}
        onClose={() => setCertModalVisible(false)}
        loading={loadingCert}
        passportData={passportData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" // Soft background to let white cards pop
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#374151",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  userIdSmall: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },

  // Stats Row
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Certificate Card
  certificateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  certIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  certTextContent: {
    flex: 1,
  },
  certTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  certSubtitle: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Menu List
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconBoxDestructive: {
    backgroundColor: "#FEF2F2",
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  menuTitleDestructive: {
    color: "#DC2626",
  },
  menuSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 64, // Aligns divider with text, not icon
  },

  versionText: {
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 16,
  }
});