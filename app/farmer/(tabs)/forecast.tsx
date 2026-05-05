import api from "@/services/api";
import { parseApiError, proApi } from "@/services/proApi";
import { logger } from "@/utils/logger";
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
    View,
} from "react-native";
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
  const [proNavLoading, setProNavLoading] = useState(false);

  useEffect(() => {
    loadForecasts();
  }, []);

   const loadForecasts = async () => {
     logger.log("[FORECAST] Loading forecast data...");
     setLoading(true);
     try {
       const token = await AsyncStorage.getItem("token");
       if (!token) {
         logger.log("[FORECAST] No token found");
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
             const path = `/api/forecast/7day?fruit=${encodeURIComponent(
               fruit.name,
             )}&target=${encodeURIComponent(target)}`;
             logger.log("[FORECAST] Fetching", path);
             let data: any;
             try {
               data = await api.get(path);
             } catch (err) {
               logger.log("[FORECAST] Error for", fruit.name, err);
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
             logger.error("[FORECAST] Failed for", fruit.name, err);
             return { ...fruit, days: [] } as FruitForecast;
           }
        }),
      );

      setForecastData(results);
      setLastUpdated(new Date().toISOString());
     } catch (err) {
       logger.error("[FORECAST] Unexpected error", err);
       setForecastData([]);
     } finally {
       setLoading(false);
     }
   };

  const goToPersonalMarketForecast = async () => {
    setProNavLoading(true);
    try {
      const status = await proApi.getStatus();
      if (status.isPro) {
        router.push("/farmer/screens/personal-market-forecast" as any);
        return;
      }
      router.push(
        "/subscription?redirect=%2Ffarmer%2Fscreens%2Fpersonal-market-forecast" as any,
      );
    } catch (e: any) {
      const parsed = parseApiError(e);
      if (parsed.endpointMissing) {
        Alert.alert(
          "Pro temporarily unavailable",
          "Your server does not expose the Pro endpoints yet. Please check the backend deployment or set EXPO_PUBLIC_PRO_BACKEND_URL to the server that has Pro enabled.",
        );
      } else {
        Alert.alert(
          "Error",
          parsed.json?.message || e?.message || "Could not check Pro status. Please try again.",
        );
      }
    } finally {
      setProNavLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="chevron-back" size={24} color={PRIMARY_GREEN} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("forecast.headerTitle")}</Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={PRIMARY_GREEN}
            />
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

        {/* Personal Market Forecast button */}
        <View style={styles.proCtaWrap}>
          <TouchableOpacity
            style={[styles.proCta, proNavLoading && { opacity: 0.7 }]}
            onPress={goToPersonalMarketForecast}
            disabled={proNavLoading}
            activeOpacity={0.85}
          >
            <View style={styles.proCtaLeft}>
              <View style={styles.proIconCircle}>
                <Ionicons name="sparkles" size={18} color={PRIMARY_GREEN} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.proTitleRow}>
                  <Text style={styles.proTitle}>Personal Market Forecast</Text>
                  <View style={styles.proBadge}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.proBadgeText}>PRO</Text>
                  </View>
                </View>
                <Text style={styles.proSubtitle}>
                  Live prices + personalized hints for your crops
                </Text>
              </View>
            </View>

            {proNavLoading ? (
              <ActivityIndicator size="small" color={PRIMARY_GREEN} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            )}
          </TouchableOpacity>
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
                    <Text style={styles.fruitEmoji}>
                      {forecastData[selectedFruitIdx].emoji}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fruitLabel}>
                      {t("forecast.fruitLabel")}
                    </Text>
                    <Text style={styles.fruitName}>
                      {forecastData[selectedFruitIdx].name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      router.push(
                        `../screens/fruit-forecast?fruit=${forecastData[selectedFruitIdx].name}`,
                      )
                    }
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#999"
                    />
                  </TouchableOpacity>
                </View>

                {forecastData[selectedFruitIdx].days.length === 0 ? (
                  <View style={styles.noDataRow}>
                    <Ionicons name="cloud-offline" size={18} color="#999" />
                    <Text style={styles.noDataText}>
                      No forecast data for {forecastData[selectedFruitIdx].name}
                    </Text>
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
    paddingTop: 45,
    paddingBottom: 20,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  fruitTabsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
    paddingVertical: 8,
  },
  proCtaWrap: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  proCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  proCtaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  proIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  proTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  proTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  proBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  proBadgeText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  proSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  fruitTab: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#e8e8e8",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fruitTabActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  fruitTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  fruitTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
  fruitCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  fruitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
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
    fontSize: 20,
  },
  fruitLabel: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
  },
  fruitName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  trendIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  noDataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  noDataText: {
    fontSize: 12,
    color: "#666",
  },
  lastUpdated: {
    textAlign: "center",
    fontSize: 12,
    color: "#999",
    marginTop: 10,
  },
});
