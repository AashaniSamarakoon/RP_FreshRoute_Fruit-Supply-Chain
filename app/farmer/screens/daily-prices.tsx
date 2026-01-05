import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslation } from "../../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const YELLOW = "#fbbf24";
const BLUE = "#3b82f6";

// Emoji fallbacks for known fruits
const FRUIT_IMAGES: Record<string, string> = {
  mango: "🥭",
  banana: "🍌",
  pineapple: "🍍",
  apple: "🍎",
  orange: "🍊",
  strawberry: "🍓",
  blueberry: "🫐",
  watermelon: "🍉",
  grape: "🍇",
};

// Grade styling
const GRADE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  A: { bg: "#dcfce7", text: "#15803d", badge: "#86efac" },
  B: { bg: "#fef3c7", text: "#b45309", badge: "#fcd34d" },
  C: { bg: "#fed7aa", text: "#92400e", badge: "#fdba74" },
  D: { bg: "#fee2e2", text: "#991b1b", badge: "#fca5a5" },
};

interface FreshRoutePrice {
  id: string;
  fruit_id: string;
  fruit_name: string;
  variety?: string;
  grade: string;
  target_date: string;
  price: number;
  source_min_price?: number;
  source_max_price?: number;
  margin_pct: number;
}

interface FruitPriceGroup {
  fruit_name: string;
  variety?: string;
  emoji: string;
  prices: FreshRoutePrice[];
}

export default function DailyPricesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [fruits, setFruits] = useState<FruitPriceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDate, setTargetDate] = useState<string>("");
  const [selectedFruitIdx, setSelectedFruitIdx] = useState(0);
  const fruitsPerPage = 3;
  const currentPage = Math.floor(selectedFruitIdx / fruitsPerPage);
  const visibleFruits = fruits.slice(currentPage * fruitsPerPage, (currentPage + 1) * fruitsPerPage);

  useEffect(() => {
    loadFreshRoutePrices();
  }, []);

  const loadFreshRoutePrices = async () => {
    console.log("[FRESHROUTE-PRICES] Loading FreshRoute prices...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[FRESHROUTE-PRICES] No token found");
        Alert.alert("Error", "Authentication required. Please log in again.");
        setFruits([]);
        setLoading(false);
        return;
      }

      const url = `${BACKEND_URL}/api/farmer/prices/freshroute`;
      console.log("[FRESHROUTE-PRICES] Fetching from:", url);
      console.log("[FRESHROUTE-PRICES] Authorization token:", token ? "✓ Present" : "✗ Missing");
      
      const res = await fetch(url, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("[FRESHROUTE-PRICES] Response status:", res.status);
      
      let data;
      try {
        data = await res.json();
        console.log("[FRESHROUTE-PRICES] Response data:", JSON.stringify(data, null, 2));
      } catch (parseErr) {
        console.error("[FRESHROUTE-PRICES] Failed to parse response:", parseErr);
        Alert.alert("Error", "Invalid response format from server");
        setFruits([]);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || "Failed to load FreshRoute prices";
        console.log("[FRESHROUTE-PRICES] HTTP Error:", res.status, errorMsg);
        Alert.alert("Error", errorMsg);
        setFruits([]);
        setLoading(false);
        return;
      }

      // Parse API response with new structure: fruits array with nested grades
      const fruitsData = data.fruits || [];
      console.log("[FRESHROUTE-PRICES] Found", fruitsData.length, "fruits");
      
      if (fruitsData.length === 0) {
        console.log("[FRESHROUTE-PRICES] No fruits available");
        setFruits([]);
        setTargetDate(new Date().toISOString().split('T')[0]);
        setLoading(false);
        return;
      }

      const groupedByFruit: FruitPriceGroup[] = [];

      fruitsData.forEach((fruit: any) => {
        const fruitKey = fruit.name.toLowerCase();
        const gradesObj = fruit.grades || {};
        
        // Convert grades object to prices array
        const prices: FreshRoutePrice[] = Object.values(gradesObj).map((gradeData: any) => ({
          id: `${fruit.fruit_id}-${gradeData.grade}`,
          fruit_id: fruit.fruit_id,
          fruit_name: fruit.name,
          variety: fruit.variety,
          grade: gradeData.grade,
          target_date: data.date || new Date().toISOString().split('T')[0],
          price: gradeData.price || 0,
          source_min_price: fruit.economicCenterRange?.min,
          source_max_price: fruit.economicCenterRange?.max,
          margin_pct: data.marginPercentage ? data.marginPercentage / 100 : 0.02,
        }));

        groupedByFruit.push({
          fruit_name: fruit.name,
          variety: fruit.variety,
          emoji: FRUIT_IMAGES[fruitKey] || "🍎",
          prices: prices.sort((a, b) => a.grade.localeCompare(b.grade)),
        });
      });

      setFruits(groupedByFruit);
      setTargetDate(data.date || new Date().toISOString().split('T')[0]);
      console.log("[FRESHROUTE-PRICES] Loaded", groupedByFruit.length, "fruit groups");

    } catch (err) {
      console.error("[FRESHROUTE-PRICES] Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", "Failed to load FreshRoute prices: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const filteredFruits = fruits;

  const selectedFruit = fruits.length > 0 ? fruits[selectedFruitIdx] : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FreshRoute Prices</Text>
          <TouchableOpacity>
            <Ionicons name="refresh" size={22} color={PRIMARY_GREEN} onPress={loadFreshRoutePrices} />
          </TouchableOpacity>
        </View>

        {/* Date Info */}
        <View style={styles.dateInfo}>
          <Ionicons name="calendar" size={18} color={PRIMARY_GREEN} />
          <Text style={styles.dateText}>
            {targetDate ? new Date(targetDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Loading...'}
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading FreshRoute prices...</Text>
          </View>
        ) : filteredFruits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No FreshRoute prices available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadFreshRoutePrices}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Fruits Navigation */}
            <View style={styles.fruitsNavigationContainer}>
              {fruits.map((fruit, idx) => {
                const isSelected = selectedFruitIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.simpleFruitName,
                      isSelected && styles.simpleFruitNameActive,
                    ]}
                    onPress={() => setSelectedFruitIdx(idx)}
                  >
                    <Text
                      style={[
                        styles.simpleFruitNameText,
                        isSelected && styles.simpleFruitNameTextActive,
                      ]}
                    >
                      {fruit.fruit_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Grade Details for Selected Fruit */}
            {selectedFruit && (
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Selected Fruit Header */}
                <View style={styles.selectedFruitDisplayHeader}>
                  <Text style={styles.selectedFruitDisplayEmoji}>{selectedFruit.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectedFruitDisplayName}>{selectedFruit.fruit_name}</Text>
                    {selectedFruit.variety && (
                      <Text style={styles.selectedFruitDisplayVariety}>{selectedFruit.variety}</Text>
                    )}
                  </View>
                  <View style={styles.gradeCountBadge}>
                    <Text style={styles.gradeCountText}>{selectedFruit.prices.length}</Text>
                    <Text style={styles.gradeCountLabel}>Grades</Text>
                  </View>
                </View>

                {/* Grades Grid */}
                <View style={styles.gradesContainer}>
                  {selectedFruit.prices.map((price, priceIdx) => {
                    const gradeColor = GRADE_COLORS[price.grade] || GRADE_COLORS.A;
                    return (
                      <View key={priceIdx} style={styles.gradeCard}>
                        <View style={styles.gradeHeader}>
                          <View style={[styles.gradeBadge, { backgroundColor: gradeColor.badge }]}>
                            <Text style={[styles.gradeBadgeText, { color: gradeColor.text }]}>
                              Grade {price.grade}
                            </Text>
                          </View>
                          <Text style={styles.gradePrice}>
                            Rs. {price.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </View>

                        {/* Price Range */}
                        {(price.source_min_price || price.source_max_price) && (
                          <View style={styles.priceRangeRow}>
                            <Text style={styles.rangeLabel}>Market Range:</Text>
                            <Text style={styles.rangeValue}>
                              Rs. {(price.source_min_price || 0).toLocaleString()} - Rs. {(price.source_max_price || 0).toLocaleString()}
                            </Text>
                          </View>
                        )}

                        {/* Margin Info */}
                        <View style={styles.marginRow}>
                          <Ionicons name="information-circle" size={14} color={PRIMARY_GREEN} />
                          <Text style={styles.marginText}>
                            {(price.margin_pct * 100).toFixed(1)}% margin
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </>
        )}
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
  dateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: LIGHT_GREEN,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY_GREEN,
  },
  fruitsCarousel: {
    maxHeight: 100,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  fruitsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  fruitCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
    gap: 10,
    minWidth: 140,
  },
  fruitCardActive: {
    backgroundColor: LIGHT_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  fruitCardEmoji: {
    fontSize: 28,
  },
  fruitCardName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },
  fruitCardNameActive: {
    color: PRIMARY_GREEN,
  },
  fruitCardVariety: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  fruitNavigationHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LIGHT_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  fruitsNavigationContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    flexWrap: "wrap",
  },
  pageNavArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  fruitsRow: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  simpleFruitName: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  simpleFruitNameActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  simpleFruitNameText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#666",
  },
  simpleFruitNameTextActive: {
    color: "#fff",
  },
  selectedFruitDisplayHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: LIGHT_GREEN,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 10,
    gap: 8,
  },
  selectedFruitDisplayEmoji: {
    fontSize: 28,
  },
  selectedFruitDisplayName: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  selectedFruitDisplayVariety: {
    fontSize: 10,
    color: "#666",
    marginTop: 1,
  },
  gradeCountBadge: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
  },
  gradeCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },
  gradeCountLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    marginTop: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#000",
  },
  scroll: {
    flex: 1,
  },
  fruitContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fruitHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  fruitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fruitEmoji: {
    fontSize: 32,
  },
  fruitName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  fruitVariety: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  fruitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
  },
  fruitBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  gradesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  gradeCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: LIGHT_GREEN,
  },
  gradeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  gradePrice: {
    fontSize: 17,
    fontWeight: "800",
    color: PRIMARY_GREEN,
  },
  priceRangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  rangeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: PRIMARY_GREEN,
  },
  rangeValue: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
    color: PRIMARY_GREEN,
  },
  marginRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  marginText: {
    fontSize: 11,
    fontWeight: "600",
    color: PRIMARY_GREEN,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

