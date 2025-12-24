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
import BuyerHeader from "../../components/buyer/BuyerHeader";
import DealCard from "../../components/buyer/DealCard";
import Hero from "../../components/buyer/Hero";
import Search from "../../components/buyer/Search";

// --- Main Component ---

export default function BuyerDashboardScreen(): React.JSX.Element {
  // Sample Data for Wholesale Deals
  const deals: DealData[] = [
    {
      id: "1",
      title: "Wholesale Deals",
      price: "$1.25",
      unit: "/kg",
      description:
        "Bulk pricing for retailers.\nMinimum order 50kg.\nFreshness guaranteed.",
    },
    {
      id: "2",
      title: "Premium Cavendish",
      price: "$7.22",
      unit: "/kg",
      description:
        "Premium quality check.\nDirect from Ratnapura.\nExport Grade A.",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BuyerColors.cardWhite}
      />

      <BuyerHeader />

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
      </ScrollView>

      {/* <BottomNav /> */}
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
});
