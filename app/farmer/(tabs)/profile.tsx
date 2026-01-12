import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslationContext } from "../../../context/TranslationContext";
import {
  FarmLocationMap,
  GrowingFruits,
  ProfileHeader,
  RecentActivity,
} from "../components";

const PRIMARY_GREEN = "#2f855a";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  farmName?: string;
  location?: string;
  memberSince?: string;
}

interface Fruit {
  id: string;
  name: string;
  imageUri: string;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  amount: string;
}

const mockFruits: Fruit[] = [
  {
    id: 'mango',
    name: 'Mango',
    imageUri: '🥭',
  },
  {
    id: 'banana',
    name: 'Banana',
    imageUri: '🍌',
  },
  {
    id: 'pineapple',
    name: 'Pineapple',
    imageUri: '🍍',
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    title: "Delivered 120kg ripe pineapples",
    date: "Jan 02, 2026",
    amount: "LKR 360.00",
  },
  {
    id: '2',
    title: "Packed 40 boxes of golden pineapple",
    date: "Jan 04, 2026",
    amount: "LKR 210.00",
  },
  {
    id: '3',
    title: "Received advance for next pineapple lot",
    date: "Jan 06, 2026",
    amount: "LKR 150.00",
  },
];

const demoOrderStats = {
  completedCount: 15,
  lastCompletedDate: "Jan 05, 2026",
  nextOrderDate: "Jan 12, 2026",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslationContext();
  const [user, setUser] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [orderStats, setOrderStats] = useState(demoOrderStats);

  const loadUser = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        setUser(JSON.parse(userJson));
      }

      const profileJson = await AsyncStorage.getItem("profile_data");
      if (profileJson) {
        setProfileData(JSON.parse(profileJson));
      }

      // Fetch order statistics
      await fetchOrderStats();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOrderStats = async () => {
    try {
      const BACKEND_URL = require("../../../config").BACKEND_URL;
      const token = await AsyncStorage.getItem("token");
      
      const response = await fetch(`${BACKEND_URL}/api/farmer/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setOrderStats({
          completedCount: data.completedCount ?? demoOrderStats.completedCount,
          lastCompletedDate: data.lastCompletedDate
            ? new Date(data.lastCompletedDate).toLocaleDateString()
            : demoOrderStats.lastCompletedDate,
          nextOrderDate: data.nextOrderDate
            ? new Date(data.nextOrderDate).toLocaleDateString()
            : demoOrderStats.nextOrderDate,
        });
      } else {
        setOrderStats(demoOrderStats);
      }
    } catch (err) {
      console.error("Error fetching order stats:", err);
      // Set mock data if API fails
      setOrderStats(demoOrderStats);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Reload profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser])
  );

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color={PRIMARY_GREEN} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("profile.headerTitle")}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/farmer/screens/edit-profile")} style={styles.headerButton}>
            <Ionicons name="create-outline" size={24} color={PRIMARY_GREEN} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Component */}
          <ProfileHeader
            userName={profileData?.name || user?.name || "Chaminda Wathuhewa"}
            farmName={profileData?.farmName || user?.farmName || "Pineaplle Farm"}
            memberSince={profileData?.memberSince || user?.memberSince || "Member since Jan 2026"}
            avatarUri={profileData?.avatarUri}
          />

          <Text style={styles.sectionTitle}>Overview</Text>

          {/* Overview Cards */}
          <View style={styles.overviewContainer}>
            {/* Completed Orders Card */}
            <View style={styles.overviewCard}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="checkmark-circle" size={28} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.cardValue}>{orderStats.completedCount}</Text>
              <Text style={styles.cardLabel}>Completed Orders</Text>
            </View>

            {/* Last Order Completed Card */}
            <View style={styles.overviewCard}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="calendar" size={28} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.cardValue} numberOfLines={1}>{orderStats.lastCompletedDate}</Text>
              <Text style={styles.cardLabel}>Last Order</Text>
            </View>

            {/* Next Order Card */}
            <View style={styles.overviewCard}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="hourglass" size={28} color={PRIMARY_GREEN} />
              </View>
              <Text style={styles.cardValue} numberOfLines={1}>{orderStats.nextOrderDate}</Text>
              <Text style={styles.cardLabel}>Next Order</Text>
            </View>
          </View>

          <FarmLocationMap
            latitude={6.9271}
            longitude={79.8612}
            address={profileData?.location || "125 Greenfield Lane, Orchard Valley, CA 98765"}
            farmName={profileData?.farmName || user?.farmName || "Dumas Family Farm"}
          />

          <GrowingFruits 
            fruits={
              profileData?.selectedFruits 
                ? mockFruits.filter(fruit => profileData.selectedFruits.includes(fruit.id))
                : mockFruits
            } 
          />

          <RecentActivity activities={mockActivities} />

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>{t("profile.logout")}</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    justifyContent: "space-between",
  },
  overviewCard: {
    flex: 1,
    backgroundColor: "#f7fdf9",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.12)",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardIconContainer: {
    marginBottom: 10,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f4ef",
  },
  cardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 11,
    color: "#4b5563",
    textAlign: "center",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e53e3e",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e53e3e",
  },
});
