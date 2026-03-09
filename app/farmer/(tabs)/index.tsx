import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslationContext } from "../../../context/TranslationContext";
import { FeatureGrid, FruitDemandCards, Header } from "../components";

interface FarmerDashboardData {
  message?: string;
  upcomingPickups?: unknown[];
  stats?: { totalShipments: number; spoilageReduced: number };
}

interface UserData {
  name?: string;
  email?: string;
  role?: string;
}

interface ForecastDay {
  day: string;
  value: string;
  unit: string;
}

interface GradePrice {
  grade: string;
  dailyPrice: number;
}

interface FruitSearchResult {
  name: string;
  emoji: string;
  forecast: ForecastDay[];
  grades: GradePrice[];
  dayLabel: string;
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslationContext();
  const [data, setData] = useState<FarmerDashboardData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [greeting, setGreeting] = useState<string>("Good morning");
  const [searchResult, setSearchResult] = useState<FruitSearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const load = async () => {
      console.log("[DASHBOARD] Loading dashboard...");
      try {
        const userJson = await AsyncStorage.getItem("user");
        console.log("[DASHBOARD] User from storage:", userJson);
        if (userJson) {
          setUser(JSON.parse(userJson));
        }

        const token = await AsyncStorage.getItem("token");
        console.log(
          "[DASHBOARD] Token from storage:",
          token?.substring(0, 20) + "...",
        );
        if (!token) {
          console.log("[DASHBOARD] No token found, skipping API call");
          return;
        }

        console.log("[DASHBOARD] Calling dashboard API");
        let body: any;
        try {
          body = await api.get(`/api/farmer/dashboard`);
          console.log("[DASHBOARD] Response body:", body);
        } catch (err: any) {
          console.log("[DASHBOARD] Error response:", err.message);
          return Alert.alert(
            t("common.error"),
            err.message || t("farmer.errors.failed"),
          );
        }
        console.log("[DASHBOARD] Data loaded successfully");
        setData(body);
      } catch (err) {
        console.error("[DASHBOARD] Error:", err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        Alert.alert(
          t("common.error"),
          t("farmer.errors.generic") + ": " + errorMsg,
        );
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await api.get("/api/farmer/home");
        if (response?.greeting) {
          // Extract first name only from greeting
          const parts = response.greeting.split(", ");
          if (parts.length > 1) {
            const fullName = parts[1];
            const firstName = fullName.split(" ")[0];
            const greetingWithFirstName = `${parts[0]}, ${firstName}`;
            setGreeting(greetingWithFirstName);
          } else {
            setGreeting(response.greeting);
          }
        }
      } catch (error) {
        console.error("[FarmerDashboard] Failed to fetch greeting:", error);
      }
    };
    fetchGreeting();
  }, []);

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  const handleSearch = async (text: string) => {
    setSearchText(text);
    
    if (!text.trim()) {
      setSearchResult(null);
      return;
    }

    setSearchLoading(true);
    try {
      const searchTerm = text.trim().toLowerCase();
      
      // Known fruits for matching
      const knownFruits = [
        { name: "mango", emoji: "🥭" },
        { name: "banana", emoji: "🍌" },
        { name: "pineapple", emoji: "🍍" },
        { name: "apple", emoji: "🍎" },
        { name: "orange", emoji: "🍊" },
        { name: "grape", emoji: "🍇" },
        { name: "strawberry", emoji: "🍓" },
        { name: "watermelon", emoji: "🍉" },
        { name: "papaya", emoji: "🍈" },
        { name: "coconut", emoji: "🥥" },
      ];
      
      // Find matching fruit (starts with search term or search term is part of fruit name)
      const matchedFruit = knownFruits.find(fruit => 
        fruit.name.startsWith(searchTerm) || 
        fruit.name.includes(searchTerm) ||
        searchTerm.includes(fruit.name)
      );
      
      if (!matchedFruit) {
        // No fruit matched, clear results
        setSearchResult(null);
        setSearchLoading(false);
        return;
      }
      
      const fruitName = matchedFruit.name;
      const emoji = matchedFruit.emoji;

      // Fetch demand forecast
      const demandPath = `/api/forecast/7day?fruit=${encodeURIComponent(fruitName)}&target=demand`;
      const demandResponse = await api.get(demandPath).catch(() => null);

      const forecast: ForecastDay[] = [];
      let dayLabel = "Today";

      if (demandResponse?.days) {
        demandResponse.days.forEach((day: any) => {
          forecast.push({
            day: day.day || "Unknown",
            value: day.value || "N/A",
            unit: day.unit || "units",
          });
        });
        dayLabel = demandResponse.days[0]?.day || "Today";
      }

      // Fetch FreshRoute prices
      const freshRouteResponse = await api.get("/api/prices/freshroute").catch(() => null);
      
      let grades: GradePrice[] = [];
      if (freshRouteResponse?.fruits) {
        // Find the fruit in the freshroute response
        const fruitData = freshRouteResponse.fruits.find(
          (f: any) => f.name.toLowerCase() === fruitName.toLowerCase()
        );
        
        if (fruitData?.grades) {
          // Convert grades object to array
          grades = Object.values(fruitData.grades).map((gradeData: any) => ({
            grade: gradeData.grade,
            dailyPrice: gradeData.price || 0,
          }));
        }
      }

      // If no grades found from freshroute, create default grades
      if (grades.length === 0) {
        grades = ['A', 'B', 'C'].map(grade => ({
          grade,
          dailyPrice: 0,
        }));
      }

      setSearchResult({
        name: fruitName,
        emoji,
        forecast,
        grades,
        dayLabel,
      });
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult(null);
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Component with Search Bar */}
      <Header 
        userName="" 
        greeting={greeting} 
        onSearch={handleSearch}
        searchText={searchText}
        onSearchClear={() => {
          setSearchText("");
          setSearchResult(null);
        }}
      />

      {/* Show search results in full screen when searching */}
      {searchText.trim() && searchResult && !searchLoading ? (
        <View style={styles.fullScreenSearch}>
          <ScrollView 
            style={styles.searchScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.searchContent}
          >
            <View style={styles.searchResultHeader}>
              <Text style={styles.searchResultEmoji}>{searchResult.emoji}</Text>
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName}>{searchResult.name}</Text>
                <Text style={styles.searchResultDay}>{searchResult.dayLabel}</Text>
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>FreshRoute Daily Prices</Text>
            <View style={styles.gradesContainer}>
              {searchResult.grades.map((grade, index) => (
                <View key={index} style={styles.gradeCard}>
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeLabel}>Grade {grade.grade}</Text>
                    <Text style={styles.dailyPriceValue}>
                      Rs. {grade.dailyPrice.toFixed(2)}/kg
                    </Text>
                  </View>
                  <Text style={styles.priceTypeLabel}>Daily Price</Text>
                </View>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>7-Day Demand Forecast</Text>
            <View style={styles.forecastContainer}>
              {searchResult.forecast.length > 0 ? (
                searchResult.forecast.map((day, index) => (
                  <View key={index} style={styles.forecastCard}>
                    <Text style={styles.forecastDay}>{day.day}</Text>
                    <Text style={styles.forecastValue}>
                      {day.value} {day.unit}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noForecast}>No forecast data available</Text>
              )}
            </View>
          </ScrollView>
        </View>
      ) : searchText.trim() && searchLoading ? (
        <View style={styles.searchLoading}>
          <ActivityIndicator size="large" color="#2f855a" />
          <Text style={styles.searchLoadingText}>Searching...</Text>
        </View>
      ) : (
        /* Show dashboard when not searching */
        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Fruit Demand Cards Component */}
          <FruitDemandCards />

          {/* Feature Grid Component */}
          <FeatureGrid />
        </ScrollView>
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
  scrollContent: {
    paddingBottom: 10,
  },
  searchLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  searchLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  fullScreenSearch: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchScrollView: {
    flex: 1,
  },
  searchContent: {
    padding: 16,
    paddingBottom: 30,
  },
  searchResultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f4f0",
  },
  searchResultEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2f855a",
    marginBottom: 4,
  },
  searchResultDay: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#11181C",
    marginBottom: 16,
    marginTop: 8,
  },
  gradesContainer: {
    marginBottom: 24,
  },
  gradeCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8f4f0",
  },
  gradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gradeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2f855a",
  },
  dailyPriceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  priceTypeLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  forecastContainer: {
    marginBottom: 24,
  },
  forecastCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e8f4f0",
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: "600",
    color: "#11181C",
  },
  forecastValue: {
    fontSize: 14,
    color: "#2f855a",
    fontWeight: "600",
  },
  noForecast: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
});
