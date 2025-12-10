import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
const YELLOW = "#fbbf24";
const RED = "#ef4444";

interface FruitPrice {
  name: string;
  emoji: string;
  image: string;
  price: string;
  unit: string;
  status: "High" | "Medium" | "Low";
  statusColor: string;
}

const mockFruits: FruitPrice[] = [
  {
    name: "Banana",
    emoji: "🍌",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=100&h=100&fit=crop",
    price: "Rs. 150.00",
    unit: "/ kg",
    status: "Medium",
    statusColor: "#fef3c7",
  },
  {
    name: "Mango",
    emoji: "🥭",
    image: "https://images.unsplash.com/photo-1599599810694-b5ac4dd19e1d?w=100&h=100&fit=crop",
    price: "Rs. 400.00",
    unit: "/ kg",
    status: "High",
    statusColor: LIGHT_GREEN,
  },
  {
    name: "Pineapple",
    emoji: "🍍",
    image: "https://images.unsplash.com/photo-1587883012610-e3e2b3a0c2e1?w=100&h=100&fit=crop",
    price: "Rs. 250.00",
    unit: "/ unit",
    status: "Low",
    statusColor: "#fee2e2",
  },
];

export default function LiveMarketScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"Dambulla" | "Manning Market" | "Meegoda" | "Pettah">("Dambulla");
  const [sortBy, setSortBy] = useState<"Price" | "Demand">("Price");
  const [order, setOrder] = useState<"High" | "Low">("High");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prices & Demand</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* FreshRoute daily prices CTA */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push("/farmer/daily-prices")}
        >
          <View style={styles.ctaIconWrap}>
            <Ionicons name="sparkles" size={24} color={PRIMARY_GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaPillText}>FreshRoute Prices</Text>
            </View>
            <Text style={styles.ctaTitle}>Check Today FreshRoute Price</Text>
            <Text style={styles.ctaSubtitle}>Daily curated prices for our 3 fruits</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={30} color={PRIMARY_GREEN} />
        </TouchableOpacity>

        {/* Location Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Dambulla" && styles.tabActive]}
            onPress={() => setSelectedTab("Dambulla")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Dambulla" && styles.tabTextActive,
              ]}
            >
              Dambulla
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Manning Market" && styles.tabActive]}
            onPress={() => setSelectedTab("Manning Market")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Manning Market" && styles.tabTextActive,
              ]}
            >
              Manning Market
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Meegoda" && styles.tabActive]}
            onPress={() => setSelectedTab("Meegoda")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Meegoda" && styles.tabTextActive,
              ]}
            >
              Meegoda
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Pettah" && styles.tabActive]}
            onPress={() => setSelectedTab("Pettah")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Pettah" && styles.tabTextActive,
              ]}
            >
              Pettah
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setSortBy(sortBy === "Price" ? "Demand" : "Price")}
          >
            <Text style={styles.sortText}>Sort by: {sortBy}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setOrder(order === "High" ? "Low" : "High")}
          >
            <Text style={styles.sortText}>Demand: {order}</Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>Last updated: 3 mins ago</Text>

        {/* Fruit List */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {mockFruits.map((fruit, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fruitCard}
              onPress={() => {}}
            >
              <View style={styles.fruitLeft}>
                <View style={styles.fruitImageContainer}>
                  <Image
                    source={{ uri: fruit.image }}
                    style={styles.fruitImage}
                  />
                </View>
                <View style={styles.fruitInfo}>
                  <Text style={styles.fruitName}>{fruit.name}</Text>
                  <Text style={styles.fruitPrice}>
                    {fruit.price} {fruit.unit}
                  </Text>
                </View>
              </View>
              <View style={styles.fruitRight}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: fruit.statusColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          fruit.status === "High"
                            ? PRIMARY_GREEN
                            : fruit.status === "Medium"
                            ? "#d97706"
                            : RED,
                      },
                    ]}
                  >
                    {fruit.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            </TouchableOpacity>
          ))}

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
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    padding: 18,
    borderRadius: 14,
    backgroundColor: LIGHT_GREEN,
    borderWidth: 1,
    borderColor: "#d0e7db",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: 14,
    minHeight: 110,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6f2ec",
  },
  ctaTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 4,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: "#475569",
  },
  ctaPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0ede6",
    marginBottom: 6,
  },
  ctaPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  tabScrollView: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: LIGHT_GRAY,
    minWidth: 110,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  sortContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: LIGHT_GRAY,
    gap: 4,
  },
  sortText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  lastUpdated: {
    fontSize: 11,
    color: "#999",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollView: {
    flex: 1,
  },
  fruitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fruitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fruitImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: LIGHT_GRAY,
    marginRight: 14,
  },
  fruitImage: {
    width: "100%",
    height: "100%",
  },
  fruitInfo: {
    flex: 1,
  },
  fruitName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  fruitPrice: {
    fontSize: 12,
    color: "#666",
  },
  fruitRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
