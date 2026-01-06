import DashboardHeader from "@/components/DashboardHeader";
import { useRouter } from "expo-router";
import React from "react";
import {
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
  // Sample Data for Wholesale Deals
  const deals: DealData[] = [
    {
      id: "1",
      title: "Premium Cavendish",
      price: "Rs. 300",
      unit: "/kg",
      location: "Awissawella",
      grade: "Grade A",
      quality: "Organic",
    },
    {
      id: "2",
      title: "Premium Cavendish",
      price: "Rs. 350",
      unit: "/kg",
      location: "Ratnapura",
      grade: "Grade A",
      quality: "Inorganic",
    },
  ];

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

        {/* FreshRoute Prices Quick Access */}
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => router.push("/buyer/(tabs)/freshroutePrices")}
        >
          <View>
            <Text style={styles.quickTitle}>FreshRoute Prices</Text>
            <Text style={styles.quickSubtitle}>See latest curated prices by grade</Text>
          </View>
          <Text style={styles.quickAction}>View</Text>
        </TouchableOpacity>

        {/* Wholesale Deals Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Best Matching Deals</Text>
          <TouchableOpacity>
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
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </ScrollView>
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
    paddingTop: 20, // Add top padding since no default header
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
    borderRadius: 14,
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
