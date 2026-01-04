import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BACKEND_URL } from "../../../config";
import DashboardHeader from "../../components/DashboardHeader";

interface FarmerDashboardData {
  message?: string;
  upcomingPickups?: unknown[];
  stats?: { totalShipments: number; spoilageReduced: number };
}

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";

export default function FarmerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "home" | "forecast" | "market" | "profile"
  >("home");

  // Reset to home tab when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setActiveTab("home");
    }, [])
  );

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/farmer/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const body = await res.json();
        if (!res.ok) {
          return Alert.alert(
            "Error",
            body.message || "Failed to load dashboard"
          );
        }
        setData(body);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Could not load dashboard");
      }
    };
    load();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <DashboardHeader />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a fruit"
            placeholderTextColor="#999"
          />
        </View>

        {/* New Stock Card */}
        <View style={styles.newStockCard}>
          {/* optional icon */}
          {/* <View style={styles.iconCircleSmall}>
          <Ionicons name="leaf" size={22} color="#fff" />
        </View> */}
          <View style={styles.newStockContent}>
            <View style={styles.newStockHeader}>
              <Text style={styles.newStockTitle}>Have new stock?</Text>
              <TouchableOpacity
                style={styles.addStockButton}
                onPress={() => router.push("/farmer/screens/add-stock" as any)}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.addStockButtonText}>
                  Add Harvest Details
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Featured Card */}
        <View style={styles.featuredCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1599599810694-b5ac4dd19e1d?w=300&h=150&fit=crop",
            }}
            style={styles.featuredImage}
          />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>
              Mango prices are predicted to rise!
            </Text>
            <Text style={styles.featuredDescription}>
              The average price is expected to increase by 2.5% this week.
            </Text>
            <Text style={styles.updatedTime}>Updated 5 mins ago</Text>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => Alert.alert("Details", "Price prediction details")}
            >
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feature Grid */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/farmer/forecast" as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
              <Ionicons name="calendar" size={24} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.gridTitle}>7-Day Forecast</Text>
            <Text style={styles.gridSubtitle}>Future price trends</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/farmer/live-market" as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
              <Ionicons name="trending-up" size={24} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.gridTitle}>Live Market Prices</Text>
            <Text style={styles.gridSubtitle}>Current actual prices</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() =>
              router.push("/farmer/screens/accuracy-insights" as any)
            }
          >
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={PRIMARY_GREEN}
              />
            </View>
            <Text style={styles.gridTitle}>Accuracy Insights</Text>
            <Text style={styles.gridSubtitle}>Prediction progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/farmer/screens/feedback" as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
              <Ionicons name="chatbubble" size={24} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.gridTitle}>Feedback</Text>
            <Text style={styles.gridSubtitle}>Share your thoughts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => Alert.alert("Run a Prediction", "Coming soon")}
          >
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
              <Ionicons name="analytics" size={24} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.gridTitle}>Run a Prediction</Text>
            <Text style={styles.gridSubtitle}>Manual price check</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push("/farmer/screens/daily-prices" as any)}
          >
            <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
              <Ionicons name="pricetag" size={24} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.gridTitle}>FreshRoute Price</Text>
            <Text style={styles.gridSubtitle}>Check today prices</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 80 }} />
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 0, // Reduced from 50 to fix extra top padding issue
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
    zIndex: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    color: "#000",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#000",
  },
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    overflow: "hidden",
  },
  featuredImage: {
    width: "100%",
    height: 150,
  },
  featuredContent: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    lineHeight: 18,
  },
  updatedTime: {
    fontSize: 11,
    color: "#999",
    marginBottom: 8,
  },
  detailsButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // New Stock Card
  newStockCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    marginRight: 12,
  },
  newStockContent: {
    flex: 1,
  },
  newStockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  newStockTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
  },
  addStockButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  addStockButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  gridContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
    fontWeight: "500",
  },
  navLabelActive: {
    color: PRIMARY_GREEN,
    fontWeight: "600",
  },
});
