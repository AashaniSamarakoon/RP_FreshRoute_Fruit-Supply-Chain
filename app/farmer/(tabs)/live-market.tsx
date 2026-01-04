import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslationContext } from "../../../context/TranslationContext";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const YELLOW = "#fbbf24";
const RED = "#ef4444";

// Fruit images mapping
const FRUIT_IMAGES: { [key: string]: string } = {
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

interface FruitPrice {
  _id?: string;
  fruitCategory?: string;
  market?: string;
  price?: number;
  demand?: string;
  date?: string;
  name?: string;
  emoji?: string;
  image?: string;
  unit?: string;
  status?: "High" | "Medium" | "Low";
  statusColor?: string;
}

export default function LiveMarketScreen() {
  const router = useRouter();
  const { t } = useTranslationContext();
  const [selectedTab, setSelectedTab] = useState<"All" | "Dambulla" | "Manning Market" | "Meegoda" | "Pettah">("All");
  const [sortBy, setSortBy] = useState<"Price" | "Demand">("Price");
  const [order, setOrder] = useState<"High" | "Low">("High");
  const [fruits, setFruits] = useState<FruitPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadLiveMarketPrices();
  }, [selectedTab, selectedDate]);

  const formatFruitData = (rawFruit: any): FruitPrice => {
    const fruitName = rawFruit.fruitCategory || rawFruit.fruit || rawFruit.name || "Unknown";
    const fruitKey = fruitName.toLowerCase();
    const demandStatus = (rawFruit.demand || rawFruit.status || "Medium").toLowerCase();
    
    return {
      ...rawFruit,
      name: fruitName,
      emoji: FRUIT_IMAGES[fruitKey] || "🍎",
      image: FRUIT_IMAGES[fruitKey] || "🍎",
      price: `Rs. ${rawFruit.price || rawFruit.amount || 0}`,
      unit: rawFruit.unit || "/ kg",
      status: (demandStatus.charAt(0).toUpperCase() + demandStatus.slice(1)) as "High" | "Medium" | "Low",
      statusColor: 
        demandStatus === "high" 
          ? LIGHT_GREEN
          : demandStatus === "medium"
          ? "#fef3c7"
          : "#fee2e2",
    };
  };

  const loadLiveMarketPrices = async () => {
    console.log("[LIVE-MARKET] Loading prices for date:", selectedDate.toISOString().split('T')[0]);
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[LIVE-MARKET] No token found");
        setFruits([]);
        setLoading(false);
        return;
      }

      // Format date as YYYY-MM-DD for filtering
      const dateStr = selectedDate.toISOString().split('T')[0];
      console.log("[LIVE-MARKET] Selected date for filtering:", dateStr);

      // Build URL based on selected tab (not including date in API call)
      let url = `${BACKEND_URL}/api/farmer/live-market`;
      if (selectedTab !== "All") {
        url += `?location=${encodeURIComponent(selectedTab)}`;
      }
      
      console.log("[LIVE-MARKET] Fetching:", url);
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("[LIVE-MARKET] Response status:", res.status);
      
      if (!res.ok) {
        console.log("[LIVE-MARKET] Error response, status:", res.status);
        Alert.alert("Error", `Failed to load prices (${res.status})`);
        setFruits([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("[LIVE-MARKET] Response data:", data);

      // Format the fruit data - show all records regardless of date
      const formattedFruits = (data.fruits || data.data || data || []).map(formatFruitData);
      
      setFruits(formattedFruits);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      console.log("[LIVE-MARKET] Loaded", formattedFruits.length, "fruits");
    } catch (err) {
      console.error("[LIVE-MARKET] Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", "Failed to load market prices: " + errorMsg);
      setFruits([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("liveMarket.headerTitle")}</Text>
          <TouchableOpacity>
            <Ionicons name="search" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* FreshRoute daily prices CTA */}
        <TouchableOpacity
          style={styles.ctaCard}
          onPress={() => router.push("../screens/daily-prices")}
        >
          <View style={styles.ctaIconWrap}>
            <Ionicons name="sparkles" size={24} color={PRIMARY_GREEN} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.ctaPill}>
              <Text style={styles.ctaPillText}>{t("liveMarket.ctaPill")}</Text>
            </View>
            <Text style={styles.ctaTitle}>{t("liveMarket.ctaTitle")}</Text>
            <Text style={styles.ctaSubtitle}>{t("liveMarket.ctaSubtitle")}</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={30} color={PRIMARY_GREEN} />
        </TouchableOpacity>

        {/* Date Picker Button */}
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={20} color={PRIMARY_GREEN} />
          <Text style={styles.datePickerText}>
            {selectedDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Text>
        </TouchableOpacity>

        {/* Location Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScrollView}
          contentContainerStyle={styles.tabContainer}
        >
          <TouchableOpacity
            style={[styles.tab, selectedTab === "All" && styles.tabActive]}
            onPress={() => setSelectedTab("All")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "All" && styles.tabTextActive,
              ]}
            >
              All Markets
            </Text>
          </TouchableOpacity>
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
            <Text style={styles.sortText}>
              {t("liveMarket.sortBy", {
                value: sortBy === "Price" ? t("liveMarket.sortOptions.price") : t("liveMarket.sortOptions.demand"),
              })}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setOrder(order === "High" ? "Low" : "High")}
          >
            <Text style={styles.sortText}>
              {t("liveMarket.demandOrder", {
                value: order === "High" ? t("liveMarket.order.high") : t("liveMarket.order.low"),
              })}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Last Updated */}
        <Text style={styles.lastUpdated}>
          {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Loading..."}
        </Text>

        {/* Fruit List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading prices...</Text>
          </View>
        ) : fruits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No prices available for {selectedTab}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadLiveMarketPrices}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {fruits.map((fruit, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fruitCard}
              onPress={() => {}}
            >
              <View style={styles.fruitLeft}>
                <View style={styles.fruitImageContainer}>
                  {typeof fruit.image === 'string' && fruit.image.length <= 4 && /\p{Emoji}/u.test(fruit.image) ? (
                    <Text style={styles.fruitImageEmoji}>{fruit.image}</Text>
                  ) : (
                    <Image
                      source={{ uri: fruit.image }}
                      style={styles.fruitImage}
                    />
                  )}
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
        )}
      </View>

      {/* Date Time Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  datePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  fruitImageEmoji: {
    fontSize: 36,
    textAlign: "center",
    textAlignVertical: "center",
    width: "100%",
    height: "100%",
    lineHeight: 60,
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
