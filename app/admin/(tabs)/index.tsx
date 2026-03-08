import DashboardHeader from "@/components/DashboardHeader";
import { BuyerColors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MessageSquare, Package, ShoppingCart, Users } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
}

const MOCK_STATS = [
  { label: "Open complaints", value: "12", icon: MessageSquare, color: "#B45309" },
  { label: "Orders today", value: "48", icon: ShoppingCart, color: "#2E7D32" },
  { label: "Active users", value: "156", icon: Users, color: "#1D4ED8" },
  { label: "Products listed", value: "89", icon: Package, color: "#7C3AED" },
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) setUser(JSON.parse(userJson));
    };
    loadUser();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const userJson = await AsyncStorage.getItem("user");
    if (userJson) setUser(JSON.parse(userJson));
    setRefreshing(false);
  };

  const isAdmin = user?.role === "admin" || user?.email === "admin@gmail.com";
  const userName = isAdmin
    ? ""
    : user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BuyerColors.cardWhite}
      />
      <DashboardHeader />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BuyerColors.primaryGreen]}
            tintColor={BuyerColors.primaryGreen}
          />
        }
      >
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welcome back{userName ? `, ${userName}` : ""}
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Manage complaints, orders, and platform activity from here.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Overview</Text>
        </View>
        <View style={styles.statsGrid}>
          {MOCK_STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.color + "20" }]}>
                  <Icon size={24} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
        </View>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/admin/(tabs)/complaints")}
        >
          <MessageSquare size={22} color="#fff" />
          <View style={styles.quickCardText}>
            <Text style={styles.quickTitle}>View all complaints</Text>
            <Text style={styles.quickSubtitle}>Review and resolve buyer complaints</Text>
          </View>
          <Text style={styles.quickAction}>Open</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BuyerColors.cardWhite,
  },
  content: {
    flex: 1,
    backgroundColor: BuyerColors.background,
  },
  contentInner: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  welcomeCard: {
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    backgroundColor: BuyerColors.cardWhite,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: BuyerColors.textBlack,
  },
  statLabel: {
    fontSize: 13,
    color: BuyerColors.textGray,
    marginTop: 2,
  },
  quickCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  quickCardText: { flex: 1 },
  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  quickSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  quickAction: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});
