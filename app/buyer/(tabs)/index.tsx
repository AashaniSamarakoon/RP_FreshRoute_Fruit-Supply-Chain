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
import Search from "../components/Search";
import Hero from "../components/Hero";
import DealCard from "../components/DealCard";
import PriceComparisonChart from "../components/PriceComparisonChart";
import DashboardHeader from "@/components/DashboardHeader";


// --- Main Component ---

export default function BuyerDashboardScreen(): React.JSX.Element {
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

  sectionHeader2: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    // marginTop: 32,
    marginBottom: 16,
  },
});
