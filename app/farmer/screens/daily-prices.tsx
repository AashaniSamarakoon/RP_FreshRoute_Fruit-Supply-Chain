import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../../../components/Header";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";

const fruits = [
  {
    name: "Mango",
    variety: "TJC",
    price: "Rs. 400.00",
    unit: "/ kg",
    status: "High Demand",
    statusColor: "#fef3c7",
    delta: "+3.2%",
    deltaColor: "#16a34a",
    image:
      "https://images.unsplash.com/photo-1599599810694-b5ac4dd19e1d?w=120&h=120&fit=crop",
  },
  {
    name: "Banana",
    variety: "Cavendish",
    price: "Rs. 150.00",
    unit: "/ kg",
    status: "Stable",
    statusColor: "#e5e7eb",
    delta: "-1.5%",
    deltaColor: "#dc2626",
    image:
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=120&h=120&fit=crop",
  },
  {
    name: "Pineapple",
    variety: "Kew",
    price: "Rs. 250.00",
    unit: "/ unit",
    status: "Stable",
    statusColor: "#e5e7eb",
    delta: "+0.8%",
    deltaColor: "#16a34a",
    image:
      "https://images.unsplash.com/photo-1587883012610-e3e2b3a0c2e1?w=120&h=120&fit=crop",
  },
];

export const options = {
  headerShown: false,
};

export default function DailyPricesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header
          title="Daily Prices"
          onBack={() => router.back()}
          rightComponent={
            <TouchableOpacity>
              <Ionicons name="notifications-outline" size={22} color="#000" />
            </TouchableOpacity>
          }
        />

        {/* Date */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={18} color="#000" />
          </TouchableOpacity>
          <Text style={styles.dateText}>Today, October 26</Text>
          <TouchableOpacity style={styles.dateArrow}>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color="#7b8b9a" />
          <TextInput
            placeholder="Search for a fruit"
            placeholderTextColor="#7b8b9a"
            style={styles.searchInput}
          />
        </View>

        {/* Sort Row */}
        <View style={styles.sortRow}>
          {["Sort by Price", "Sort by Name", "Sort by Demand"].map((label) => (
            <TouchableOpacity key={label} style={styles.sortChip}>
              <Text style={styles.sortChipText}>{label}</Text>
              <Ionicons name="chevron-down" size={14} color="#637381" />
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {fruits.map((fruit, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardLeft}>
                <Image source={{ uri: fruit.image }} style={styles.cardImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{fruit.name}</Text>
                  <Text style={styles.cardVariety}>{fruit.variety}</Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: fruit.statusColor },
                    ]}
                  >
                    <Text style={styles.badgeText}>{fruit.status}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardPrice}>{fruit.price}</Text>
                <Text style={styles.cardUnit}>{fruit.unit}</Text>
                <Text style={[styles.cardDelta, { color: fruit.deltaColor }]}>
                  {fruit.delta}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <TouchableOpacity style={styles.ctaButton}>
          <Ionicons
            name="storefront"
            size={18}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.ctaText}>Open for Sell</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GREEN,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  sortChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sortChipText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: LIGHT_GRAY,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardVariety: {
    fontSize: 12,
    color: PRIMARY_GREEN,
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "700",
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    minWidth: 90,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardUnit: {
    fontSize: 11,
    color: "#6b7280",
  },
  cardDelta: {
    fontSize: 11,
    fontWeight: "700",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  ctaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
