import DashboardHeader from "@/components/DashboardHeader";
import { BACKEND_URL } from "@/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BuyerColors } from "../../../constants/theme";
import { DealData } from "../../../types";
import DealCard from "../components/DealCard";
import Hero from "../components/Hero";
import PriceComparisonChart from "../components/PriceComparisonChart";
import Search from "../components/Search";

// --- Main Component ---

export default function BuyerDashboardScreen(): React.JSX.Element {
  const router = useRouter();
  const [deals, setDeals] = useState<DealData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch matching deals for the buyer
  useEffect(() => {
    const fetchMatchingDeals = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");

        if (!token || !userStr) {
          console.warn("No auth token or user data found");
          setLoading(false);
          setDeals([]); // No deals if not authenticated
          return;
        }

        const user = JSON.parse(userStr);
        const buyerId = user.id;

        if (!buyerId) {
          console.warn("No buyer ID found");
          setLoading(false);
          setDeals([]);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/api/buyer/matching/buyer/${buyerId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch matching deals: ${response.status}`);
        }

        const data = await response.json();
        console.log("Matching deals data:", data);

        // Transform API response to DealData format
        const matchingDeals = (data.proposals || data || []).map(
          (proposal: any) => ({
            id: proposal.id,
            title:
              `${proposal.order?.fruit_type || proposal.fruit_type || ""} ${
                proposal.order?.variant || proposal.variant || ""
              }`.trim(),
            price: proposal.price_per_kg || proposal.price || "",
            unit: proposal.price_per_kg ? "kg" : "",
            location:
              proposal.order?.delivery_location ||
              proposal.delivery_location ||
              proposal.location ||
              "Unknown Location",
            grade: proposal.order?.grade || proposal.grade || "Standard",
            quality:
              (proposal.order?.grade || proposal.grade) === "Grade A"
                ? "Premium"
                : "Standard",
          }),
        );

        // Only set deals if there are matching deals, otherwise empty array
        setDeals(matchingDeals.length > 0 ? matchingDeals : []);
      } catch (error) {
        console.error("Error fetching matching deals:", error);
        // Set empty array on error - don't show section
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingDeals();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BuyerColors.cardWhite}
      />

      <DashboardHeader />

      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <Search />

        <Hero />

        {/* FreshRoute Prices Quick Access
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/buyer/(tabs)/freshroutePrices")}
        >
          <View>
            <Text style={styles.quickTitle}>FreshRoute Prices</Text>
            <Text style={styles.quickSubtitle}>See latest curated prices by grade</Text>
          </View>
          <Text style={styles.quickAction}>View</Text>
        </TouchableOpacity> */}

        {/* Best Matching Deals Section - Only show if there are deals */}
        {loading || deals.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Best Matching Deals</Text>
              <TouchableOpacity
                onPress={() => {
                  router.push("/buyer/screens/MatchedStocks");
                }}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Scroll for Deals */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.dealsScroll}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={BuyerColors.primaryGreen}
                  />
                  <Text style={styles.loadingText}>Loading deals...</Text>
                </View>
              ) : (
                deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
              )}
            </ScrollView>
          </>
        ) : null}
        {/* Wholesale Deals Section */}
        <View style={styles.sectionHeader2}>
          <Text style={styles.sectionTitle}>Price Comparison</Text>
        </View>

        {/* Price Comparison Chart */}
        <PriceComparisonChart />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Styles ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BuyerColors.cardWhite,
    // paddingTop: 20, // Add top padding since no default header
  },

  contentContainer: {
    backgroundColor: BuyerColors.background,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },

  seeAllText: {
    fontSize: 14,
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
  },

  dealsScroll: {
    paddingBottom: 20,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 200,
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: BuyerColors.textGray,
  },

  sectionHeader2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    // marginTop: 32,
    marginBottom: 16,
  },
  quickCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: BuyerColors.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  quickSubtitle: {
    fontSize: 12,
    color: "#f1f5f9",
    marginTop: 4,
  },
  quickAction: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
});
