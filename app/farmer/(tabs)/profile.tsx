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
    title: "Sold 50kg of Fuji Apples",
    date: "Oct 18, 2025",
    amount: "$125.00",
  },
  {
    id: '2',
    title: "Sold 20kg of Mixed Berries",
    date: "Oct 18, 2025",
    amount: "$80.50",
  },
  {
    id: '3',
    title: "Sold 100kg of Navel Oranges",
    date: "Oct 18, 2025",
    amount: "$210.00",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslationContext();
  const [user, setUser] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

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
    } catch (err) {
      console.error(err);
    }
  }, []);

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

  const handleMessagePress = () => {
    console.log("Message button pressed");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Profile"
        showNotification={true}
        onNotificationPress={() => {
          console.log("Notifications pressed");
        }}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile.headerTitle")}</Text>
          <TouchableOpacity onPress={() => router.push("/farmer/screens/edit-profile")}>
            <Ionicons name="create-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Component */}
          <ProfileHeader
            userName={profileData?.name || user?.name || "Aashani"}
            farmName={profileData?.farmName || user?.farmName || "Dumas Family Farm"}
            memberSince={t("profile.memberSince")}
            avatarUri={profileData?.avatarUri}
            onMessagePress={handleMessagePress}
          />

          {/* Farm Location Map Component */}
          <FarmLocationMap
            latitude={6.9271}
            longitude={79.8612}
            address={profileData?.location || "125 Greenfield Lane, Orchard Valley, CA 98765"}
            farmName={profileData?.farmName || user?.farmName || "Dumas Family Farm"}
          />

          {/* Growing Fruits Component */}
          <GrowingFruits 
            fruits={
              profileData?.selectedFruits 
                ? mockFruits.filter(fruit => profileData.selectedFruits.includes(fruit.id))
                : mockFruits
            } 
          />

          {/* Recent Activity Component */}
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
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  scrollView: {
    flex: 1,
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
