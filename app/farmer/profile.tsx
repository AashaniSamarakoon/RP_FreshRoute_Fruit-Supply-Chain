import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  farmName?: string;
  location?: string;
  memberSince?: string;
}

interface Activity {
  title: string;
  date: string;
  amount: string;
}

const mockActivities: Activity[] = [
  {
    title: "Sold 50kg of Fuji Apples",
    date: "Oct 18, 2025",
    amount: "$125.00",
  },
  {
    title: "Sold 20kg of Mixed Berries",
    date: "Oct 18, 2025",
    amount: "$80.50",
  },
  {
    title: "Sold 100kg of Navel Oranges",
    date: "Oct 18, 2025",
    amount: "$210.00",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadUser();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Farmer Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
                }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.userName}>{user?.name || "Alexandre Dumas"}</Text>
            <Text style={styles.farmName}>
              {user?.farmName || "Dumas Family Farm"}
            </Text>
            <Text style={styles.memberSince}>
              Member since Jan 2020
            </Text>
            <TouchableOpacity style={styles.messageButton}>
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Farm Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Farm Location</Text>
            <View style={styles.mapContainer}>
              <Image
                source={{
                  uri: "https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/79.8612,6.9271,12,0/300x200?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw",
                }}
                style={styles.mapImage}
              />
            </View>
            <Text style={styles.locationAddress}>
              125 Greenfield Lane, Orchard Valley, CA 98765
            </Text>
          </View>

          {/* Grows These Fruits */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grows These Fruits</Text>
            <View style={styles.fruitsGrid}>
              <View style={styles.fruitItem}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=80&h=80&fit=crop",
                  }}
                  style={styles.fruitImage}
                />
                <Text style={styles.fruitName}>Fuji Apples</Text>
              </View>
              <View style={styles.fruitItem}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=80&h=80&fit=crop",
                  }}
                  style={styles.fruitImage}
                />
                <Text style={styles.fruitName}>Navel Oran...</Text>
              </View>
              <View style={styles.fruitItem}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=80&h=80&fit=crop",
                  }}
                  style={styles.fruitImage}
                />
                <Text style={styles.fruitName}>Mixed Berri...</Text>
              </View>
              <View style={styles.fruitItem}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1629828874514-944573e90422?w=80&h=80&fit=crop",
                  }}
                  style={styles.fruitImage}
                />
                <Text style={styles.fruitName}>Peaches</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {mockActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDate}>{activity.date}</Text>
                </View>
                <Text style={styles.activityAmount}>{activity.amount}</Text>
              </View>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
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
  profileCard: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: LIGHT_GRAY,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  farmName: {
    fontSize: 14,
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  messageButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 80,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  messageButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  mapContainer: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: LIGHT_GRAY,
    marginBottom: 8,
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  locationAddress: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },
  fruitsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  fruitItem: {
    width: "23%",
    alignItems: "center",
    marginBottom: 12,
  },
  fruitImage: {
    width: "100%",
    height: 60,
    borderRadius: 8,
    marginBottom: 6,
  },
  fruitName: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  activityLeft: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: "#999",
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY_GREEN,
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
