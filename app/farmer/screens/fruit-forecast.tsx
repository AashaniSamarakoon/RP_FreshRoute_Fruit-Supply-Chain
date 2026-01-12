import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
const ORANGE = "#f59e0b";
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.43.45:4000";

const screenWidth = Dimensions.get("window").width;

interface ForecastDay {
  day: string;
  demandValue: number;
  priceValue: number;
  demandTrend: string;
  priceTrend: string;
}

export default function FruitForecastScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedFruit, setSelectedFruit] = useState<string>(
    (Array.isArray(params.fruit) ? params.fruit[0] : params.fruit) || "Mango"
  );
  const [demandData, setDemandData] = useState<ForecastDay[]>([]);
  const [priceData, setPriceData] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [peakDay, setPeakDay] = useState("");
  const { t } = useTranslation();

  const fruits = ["Mango", "Pineapple", "Banana"];

  useEffect(() => {
    loadForecastData();
  }, [selectedFruit]);

  const loadForecastData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[FRUIT-FORECAST] No token found");
        setLoading(false);
        return;
      }

      const demandUrl = `${BACKEND_URL}/api/farmer/forecast/7day?fruit=${encodeURIComponent(selectedFruit)}&target=demand`;
      const priceUrl = `${BACKEND_URL}/api/farmer/forecast/7day?fruit=${encodeURIComponent(selectedFruit)}&target=price`;

      console.log("[FRUIT-FORECAST] Fetching demand from:", demandUrl);
      console.log("[FRUIT-FORECAST] Fetching price from:", priceUrl);

      // Fetch demand forecast
      const demandRes = await fetch(demandUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const demandJson = await demandRes.json();
      console.log("[FRUIT-FORECAST] Demand response:", demandRes.status, demandJson);

      // Fetch price forecast
      const priceRes = await fetch(priceUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const priceJson = await priceRes.json();
      console.log("[FRUIT-FORECAST] Price response:", priceRes.status, priceJson);

      if (demandRes.ok && demandJson.days) {
        const demandDays: ForecastDay[] = demandJson.days.map((d: any) => ({
          day: d.day,
          demandValue: parseFloat(d.value) || 0,
          demandTrend: d.trend,
          priceValue: 0,
          priceTrend: "",
        }));
        setDemandData(demandDays);

        // Find peak demand day
        const maxDemandDay = demandDays.reduce((prev, current) =>
          prev.demandValue > current.demandValue ? prev : current
        );
        setPeakDay(maxDemandDay.day);
      }

      if (priceRes.ok && priceJson.days) {
        const priceDays = priceJson.days.map((d: any) => ({
          day: d.day,
          priceValue: parseFloat(d.value) || 0,
          priceTrend: d.trend,
          demandValue: 0,
          demandTrend: "",
        }));
        console.log("[FRUIT-FORECAST] Price days for X-axis:", priceDays);
        setPriceData(priceDays);
      }
    } catch (err) {
      console.error("[FRUIT-FORECAST] Error loading data:", err);
      if (err instanceof TypeError) {
        console.error("[FRUIT-FORECAST] Network error - Check BACKEND_URL and API endpoint");
      }
    } finally {
      setLoading(false);
    }
  };

  // Normalize values to chart height (0-100)
  const normalizeValue = (value: number, max: number) => {
    if (max === 0) return 0;
    return (value / max) * 100;
  };

  const demandValues = demandData.map((d) => d.demandValue);
  const priceValues = priceData.map((d) => d.priceValue);
  const maxDemand = Math.max(...demandValues, 1);
  const maxPrice = Math.max(...priceValues, 1);

  const normalizedDemand = demandData.map((d) => normalizeValue(d.demandValue, maxDemand));
  const normalizedPrice = priceData.map((d) => normalizeValue(d.priceValue, maxPrice));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("fruitForecast.headerTitle")}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Fruit Selector Pills */}
          <View style={styles.fruitSelector}>
            {fruits.map((fruit) => (
              <TouchableOpacity
                key={fruit}
                style={[
                  styles.fruitPill,
                  selectedFruit === fruit && styles.fruitPillActive,
                ]}
                onPress={() => setSelectedFruit(fruit)}
              >
                <Text
                  style={[
                    styles.fruitPillText,
                    selectedFruit === fruit && styles.fruitPillTextActive,
                  ]}
                >
                  {fruit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Forecast Title */}
          <View style={styles.forecastHeader}>
            <Text style={styles.forecastTitle}>{selectedFruit} Forecast</Text>
            <Text style={styles.forecastSubtitle}>Next 7 Days</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            </View>
          ) : demandData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No forecast data available</Text>
            </View>
          ) : (
            <>
              {/* Price Forecast Chart with Dots */}
              <View style={styles.graphContainer}>
                <Text style={styles.chartTitle}>Price Forecast</Text>
                
                {/* Chart Area */}
                <View style={styles.chartWrapper}>
                  {/* Y-axis with price labels */}
                  <View style={styles.yAxisLabels}>
                    {[100, 75, 50, 25, 0].map((label, idx) => (
                      <Text key={idx} style={styles.yAxisLabel}>
                        {Math.round((maxPrice / 100) * label)}
                      </Text>
                    ))}
                  </View>

                  {/* Chart with dots */}
                  <View style={styles.chartArea}>
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((line) => (
                      <View
                        key={`grid-${line}`}
                        style={[
                          styles.gridLine,
                          { top: line * 50 },
                        ]}
                      />
                    ))}

                    {/* Price dots and labels */}
                    {priceData.map((day, idx) => {
                      const totalPoints = priceData.length;
                      const chartWidth = screenWidth - 24 - 28 - 44 - 20;
                      const segmentWidth = chartWidth / (totalPoints - 1);
                      const xPos = idx * segmentWidth;
                      const normalizedValue = normalizedPrice[idx] || 0;
                      const yPos = 220 - (normalizedValue / 100) * 220;
                      
                      return (
                        <React.Fragment key={`dot-${idx}`}>
                          {/* Dot */}
                          <View
                            style={[
                              styles.priceDot,
                              {
                                left: xPos,
                                top: yPos,
                              },
                            ]}
                          />
                          {/* Price label above dot */}
                          <Text
                            style={[
                              styles.dotLabel,
                              {
                                left: xPos - 15,
                                top: Math.max(yPos - 20, 0),
                              },
                            ]}
                          >
                            {Math.round(day.priceValue)}
                          </Text>
                        </React.Fragment>
                      );
                    })}
                  </View>
                </View>

                {/* X-axis with dates and day abbreviations */}
                {priceData && priceData.length > 0 && (
                  <View style={styles.xAxisContainer}>
                    {priceData.map((day, idx) => {
                      const dayStr = String(day.day || `Day ${idx + 1}`).trim();
                      const first3 = dayStr.substring(0, 3);
                      const totalPoints = priceData.length;
                      const chartWidth = screenWidth - 24 - 28 - 44 - 20;
                      const segmentWidth = chartWidth / (totalPoints - 1);
                      const xPos = 44 + idx * segmentWidth;
                      
                      return (
                        <View 
                          key={`xaxis-${idx}`} 
                          style={[styles.xAxisLabel, { left: Math.max(xPos - 22, 0), right: idx === totalPoints - 1 ? 16 : 'auto' }]}
                        >
                          <Text style={styles.xAxisLabelText}>{first3}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Peak Demand Card */}
              <View style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTitle}>Peak Demand: {peakDay}</Text>
                  <TouchableOpacity style={styles.detailsButton}>
                    <Text style={styles.detailsButtonText}>Details</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.insightDescription}>
                  The highest demand for {selectedFruit} is expected this {peakDay}, with prices
                  remaining stable.
                </Text>
              </View>
            </>
          )}

          {/* Bottom Navigation Hint */}
          <View style={styles.bottomHint}>
            <Text style={styles.hintText}>
              Swipe to view other fruits or use the tabs above
            </Text>
          </View>

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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  fruitSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: 8,
    gap: 10,
  },
  fruitPill: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e8e8e8",
    alignItems: "center",
    justifyContent: "center",
  },
  fruitPillActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  fruitPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    textAlign: "center",
  },
  fruitPillTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  forecastHeader: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 2,
  },
  forecastSubtitle: {
    fontSize: 12,
    color: "#999",
  },
  graphContainer: {
    marginHorizontal: 12,
    marginBottom: 28,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  chartWrapper: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  yAxisLabels: {
    width: 38,
    height: 220,
    justifyContent: "space-between",
    paddingVertical: 0,
    paddingRight: 6,
    alignItems: "flex-end",
    paddingBottom: 0,
  },
  yAxisLabel: {
    fontSize: 11,
    color: "#555",
    fontWeight: "500",
    textAlign: "right",
    lineHeight: 20,
  },
  chartArea: {
    flex: 1,
    position: "relative",
    height: 220,
    borderLeftWidth: 2,
    borderLeftColor: "#333",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    marginBottom: 0,
  },
  gridLine: {
    position: "absolute",
    left: -2,
    right: 0,
    height: 1,
    backgroundColor: "#ddd",
  },
  priceDot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PRIMARY_GREEN,
    borderWidth: 2,
    borderColor: "#fff",
    marginLeft: -6,
    marginTop: -6,
    zIndex: 10,
    elevation: 5,
  },
  dotLabel: {
    position: "absolute",
    fontSize: 10,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    width: 30,
    zIndex: 10,
  },
  xAxisContainer: {
    position: "relative",
    width: "100%",
    height: 40,
    marginTop: 8,
    marginHorizontal: 16,
    paddingRight: 16,
    overflow: "hidden",
  },
  xAxisLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: 45,
    height: 40,
  },
  xAxisLabelText: {
    fontSize: 9,
    fontWeight: "600",
    color: PRIMARY_GREEN,
    lineHeight: 12,
  },
  insightCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
  },
  detailsButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  insightDescription: {
    fontSize: 11,
    color: "#666",
    lineHeight: 16,
  },
  bottomHint: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: "center",
  },
  hintText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
});
