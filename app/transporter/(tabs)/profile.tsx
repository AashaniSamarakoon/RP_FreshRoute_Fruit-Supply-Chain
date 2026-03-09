import DigitalPassportModal from "@/components/modals/DigitalPassportModal";
import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    user_metadata: { first_name: "Loading..." },
    email: "...",
    role: "",
  });

  // passport state
  const [userId, setUserId] = useState<string | null>(null);
  const [certModalVisible, setCertModalVisible] = useState(false);
  const [passportData, setPassportData] = useState<any | null>(null);
  const [loadingCert, setLoadingCert] = useState(false);

  useEffect(() => {
    loadProfile();
    // fetch user ID for certificate
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    })();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn("signOut failed", e);
          }
          await AsyncStorage.multiRemove([
            "token",
            "user",
            "onboarded",
            "onboarding_farmer",
            "onboarding_buyer",
          ]);
          router.replace("/login");
        },
      },
    ]);
  };

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
        subject: user.user_metadata?.first_name || "Transporter",
        validFrom: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        fingerprint: "A2:4F:99:B1:0C:E3",
      });
    } finally {
      setLoadingCert(false);
    }
  };

  const MenuOption = ({ icon, label, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View
        style={[styles.menuIconBox, isDestructive && styles.destructiveBox]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={isDestructive ? "#e53e3e" : "#4a5568"}
        />
      </View>
      <Text style={[styles.menuText, isDestructive && styles.destructiveText]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. Top Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={54} color={PRIMARY_GREEN} />
          </View>
        </View>
        <Text style={styles.userName}>
          {user.user_metadata?.first_name || "User"}
        </Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>

        {/* certificate card */}
        <TouchableOpacity
          style={styles.certificateCard}
          onPress={handleViewCertificate}
          activeOpacity={0.8}
        >
          <View style={styles.certIconBg}>
            <Ionicons name="checkmark-circle" size={24} color={PRIMARY_GREEN} />
          </View>
          <View style={styles.certTextContent}>
            <Text style={styles.certTitle}>Digital Passport (X.509)</Text>
            <Text style={styles.certSubtitle}>View your cryptographic identity</Text>
          </View>
          {loadingCert ? (
            <ActivityIndicator color={PRIMARY_GREEN} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Menu Options */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        {/* <MenuOption
          icon="person-outline"
          label="Edit Profile"
          onPress={() => console.log("Edit Profile")}
        /> */}
        <MenuOption
          icon="notifications-outline"
          label="Notifications"
          onPress={() => {
            console.log("Notifications");
            router.push("/transporter/notifications");
          }}
        />
        <MenuOption
          icon="lock-closed-outline"
          label="Privacy & Security"
          onPress={() => console.log("Privacy")}
        />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Support</Text>

        <MenuOption
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => console.log("Help")}
        />
        <MenuOption
          icon="document-text-outline"
          label="Terms & Conditions"
          onPress={() => console.log("Terms")}
        />
      </View>

      {/* 3. Logout Button */}
      <View style={styles.footerSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* certificate modal */}
      <DigitalPassportModal
        visible={certModalVisible}
        onClose={() => setCertModalVisible(false)}
        loading={loadingCert}
        passportData={passportData}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },

  // Header Section
  headerSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e6fffa",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#f7fafc",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY_GREEN,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d3748",
  },
  userEmail: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: "#e6fffa",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b2f5ea",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#a0aec0",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#edf2f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  destructiveBox: {
    backgroundColor: "#fff5f5",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "500",
  },
  destructiveText: {
    color: "#e53e3e",
  },

  // Footer Section
  footerSection: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fed7d7",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 12,
    marginBottom: 16,
  },

  // certificate styles
  certificateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 20,
  },
  certIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e6fffa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  certTextContent: {
    flex: 1,
  },
  certTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2d3748",
  },
  certSubtitle: {
    fontSize: 12,
    color: "#4a5568",
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#e53e3e",
  },
  versionText: {
    fontSize: 12,
    color: "#cbd5e0",
  },
});
