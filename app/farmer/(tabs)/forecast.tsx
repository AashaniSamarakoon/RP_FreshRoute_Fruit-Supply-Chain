import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslation } from "../../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const LIGHT_RED = "#fee2e2";
const RED = "#ef4444";

type Trend = "up" | "down" | "stable";

interface ForecastDay {
  day: string;
  trend: Trend;
  trendText: string;
  value: string;
  unit: string;
}

interface FruitForecast {
  name: string;
  emoji: string;
  days: ForecastDay[];
}

export default function ForecastScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedFruitIdx, setSelectedFruitIdx] = useState(0);
  const [forecastData, setForecastData] = useState<FruitForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    loadForecasts();
  }, []);

  const loadForecasts = async () => {
    console.log("[FORECAST] Loading forecast data...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[FORECAST] No token found");
        setForecastData([]);
        setLoading(false);
        return;
      }

      const fruitsToFetch = [
        { name: "Mango", emoji: "🥭" },
        { name: "Banana", emoji: "🍌" },
        { name: "Pineapple", emoji: "🍍" },
      ];

      const target = "demand"; // Always fetch demand forecast
      const results = await Promise.all(
        fruitsToFetch.map(async (fruit) => {
          try {
            const url = `${BACKEND_URL}/api/farmer/forecast/7day?fruit=${encodeURIComponent(fruit.name)}&target=${encodeURIComponent(target)}`;
            console.log("[FORECAST] Fetching", url);
            const res = await fetch(url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (!res.ok) {
              console.log("[FORECAST] Error for", fruit.name, data.message);
              return { ...fruit, days: [] } as FruitForecast;
            }

            const days: ForecastDay[] = (data.days || []).map((d: any) => ({
              day: d.day || "",
              trend: (d.trend as Trend) || "stable",
              trendText: d.trendText || "",
              value: d.value || "N/A",
              unit: d.unit || "units",
            }));

            return { ...fruit, days } as FruitForecast;
          } catch (err) {
            console.error("[FORECAST] Failed for", fruit.name, err);
            return { ...fruit, days: [] } as FruitForecast;
          }
        })
      );

      setForecastData(results);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      console.error("[FORECAST] Unexpected error", err);
      setForecastData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={24} color={PRIMARY_GREEN} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("forecast.headerTitle")}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="notifications-outline" size={22} color={PRIMARY_GREEN} />
          </TouchableOpacity>
        </View>

        {/* Fruit Navigation Tabs */}
        <View style={styles.fruitTabsContainer}>
          {forecastData.map((fruit, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedFruitIdx(idx)}
              style={[
                styles.fruitTab,
                selectedFruitIdx === idx && styles.fruitTabActive,
              ]}
            >
              <Text
                style={[
                  styles.fruitTabText,
                  selectedFruitIdx === idx && styles.fruitTabTextActive,
                ]}
              >
                {fruit.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading forecast...</Text>
          </View>
        ) : forecastData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No forecast data available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadForecasts}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {forecastData[selectedFruitIdx] && (
              <View style={styles.fruitCard}>
                <View style={styles.fruitHeader}>
                  <View style={styles.fruitIcon}>
                    <Text style={styles.fruitEmoji}>{forecastData[selectedFruitIdx].emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fruitLabel}>{t("forecast.fruitLabel")}</Text>
                    <Text style={styles.fruitName}>{forecastData[selectedFruitIdx].name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => router.push(`../screens/fruit-forecast?fruit=${forecastData[selectedFruitIdx].name}`)}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                </View>

                {forecastData[selectedFruitIdx].days.length === 0 ? (
                  <View style={styles.noDataRow}>
                    <Ionicons name="cloud-offline" size={18} color="#999" />
                    <Text style={styles.noDataText}>No forecast data for {forecastData[selectedFruitIdx].name}</Text>
                  </View>
                ) : (
                  forecastData[selectedFruitIdx].days.map((day, dayIndex) => (
                    <View key={dayIndex} style={styles.dayRow}>
                      <View style={styles.dayLeft}>
                        <View
                          style={[
                            styles.trendIcon,
                            {
                              backgroundColor:
                                day.trend === "up"
                                  ? LIGHT_GREEN
                                  : day.trend === "down"
                                  ? LIGHT_RED
                                  : LIGHT_GRAY,
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              day.trend === "up"
                                ? "arrow-up"
                                : day.trend === "down"
                                ? "arrow-down"
                                : "remove"
                            }
                            size={16}
                            color={
                              day.trend === "up"
                                ? PRIMARY_GREEN
                                : day.trend === "down"
                                ? RED
                                : "#999"
                            }
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dayName}>{day.day}</Text>
                          <Text
                            style={[
                              styles.trendText,
                              {
                                color:
                                  day.trend === "up"
                                    ? PRIMARY_GREEN
                                    : day.trend === "down"
                                    ? RED
                                    : "#999",
                              },
                            ]}
                          >
                            {day.trendText || t("forecast.trends.stable")}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.dayValue}>
                        {day.value} {day.unit}
                      </Text>
                    </View>
                  ))
                )}
              </View>
            )}

            <Text style={styles.lastUpdated}>
              {lastUpdated ? new Date(lastUpdated).toLocaleString() : ""}
            </Text>
          </ScrollView>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  tabTextActive: {
    color: "#000",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
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
  fruitCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 13,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  fruitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    gap: 10,
  },
  fruitIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },
  fruitEmoji: {
    fontSize: 19,
  },
  fruitLabel: {
    fontSize: 10,
    color: "#999",
    marginBottom: 1,
  },
  fruitName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  trendIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "500",
  },
  dayValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  noDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  noDataText: {
    fontSize: 13,
    color: "#666",
  },
  lastUpdated: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  fruitTabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    gap: 10,
    paddingVertical: 4,
  },
  fruitTab: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#e8e8e8",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fruitTabActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  fruitTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  fruitTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
