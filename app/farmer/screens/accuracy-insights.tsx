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
const LIGHT_BLUE = "#e3f2fd";

interface FruitAccuracy {
  fruit: string;
  accuracy: number;
  trend: "up" | "down" | "stable";
  change: string;
  variety?: string;
}

interface AccuracyData {
  overallAccuracy: number;
  fruitBreakdown: FruitAccuracy[];
}

export default function AccuracyInsightsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [data, setData] = useState<AccuracyData | null>(null);
  const [fruitDetails, setFruitDetails] = useState<FruitAccuracy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccuracyData();
  }, []);

  const loadAccuracyData = async () => {
    console.log("[ACCURACY] Loading accuracy insights...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[ACCURACY] No token found");
        setData(null);
        setFruitDetails([]);
        setLoading(false);
        return;
      }

      // Fetch overall accuracy insights with per-fruit breakdown
      const insightsRes = await fetch(`${BACKEND_URL}/api/farmer/accuracy/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const insightsData = await insightsRes.json();
      console.log("[ACCURACY] Insights response:", insightsRes.status, insightsData);

      if (!insightsRes.ok) {
        console.log("[ACCURACY] Error fetching insights:", insightsData.message);
        setData(null);
        setFruitDetails([]);
        setLoading(false);
        return;
      }

      // Extract per-fruit accuracies from the insights response
      const perFruitList = insightsData.perFruitAccuracyList || insightsData.individualAccuracies || [];
      console.log("[ACCURACY] Per-fruit accuracy list:", perFruitList);

      // Map per-fruit data to FruitAccuracy format
      const mappedFruits: FruitAccuracy[] = perFruitList.map((fruit: any) => ({
        fruit: fruit.fruitName || fruit.name || "",
        accuracy: fruit.accuracyPercent || fruit.accuracy || 0,
        trend: fruit.trend || "stable",
        change: `Avg Error: ${(fruit.averagePercentError || 0).toFixed(1)}%`,
        variety: fruit.variety || "",
      }));

      setData({
        overallAccuracy: insightsData.overallAccuracy || insightsData.overall || 0,
        fruitBreakdown: insightsData.perFruitBreakdown || [],
      });
      setFruitDetails(mappedFruits);
    } catch (err) {
      console.error("[ACCURACY] Unexpected error", err);
      setData(null);
      setFruitDetails([]);
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>{t("accuracy.headerTitle")}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall Accuracy Card */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_GREEN} />
              <Text style={styles.loadingText}>Loading accuracy...</Text>
            </View>
          ) : (
            <View style={styles.accuracyCard}>
              <Text style={styles.cardTitle}>Overall Prediction Accuracy</Text>
              <View style={styles.circularProgressContainer}>
                <View style={styles.circularProgress}>
                  <Text style={styles.accuracyPercent}>
                    {data?.overallAccuracy !== null ? `${data?.overallAccuracy.toFixed(1)}%` : "--"}
                  </Text>
                  <Text style={styles.accuracyLabel}>Accuracy</Text>
                </View>
              </View>
              <Text style={styles.accuracyDescription}>
                Based on price predictions across all fruits
              </Text>
              <Text style={styles.accuracySubtext}>Last 7 days analysis</Text>
            </View>
          )}

          {/* Key Metrics - Fruit-Specific Accuracy */}
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>Individual Fruit Accuracy</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={PRIMARY_GREEN} />
                <Text style={styles.loadingText}>Loading metrics...</Text>
              </View>
            ) : fruitDetails.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cloud-offline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No accuracy data available</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadAccuracyData}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.metricsGrid}>
                {fruitDetails.map((metric, idx) => (
                  <View key={idx} style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <Text style={styles.metricValue}>{metric.accuracy.toFixed(1)}%</Text>
                      <View
                        style={[
                          styles.trendIcon,
                          {
                            backgroundColor:
                              metric.trend === "up"
                                ? "#dcfce7"
                                : metric.trend === "down"
                                ? "#fee2e2"
                                : LIGHT_BLUE,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            metric.trend === "up"
                              ? "trending-up"
                              : metric.trend === "down"
                              ? "trending-down"
                              : "remove"
                          }
                          size={14}
                          color={
                            metric.trend === "up"
                              ? "#16a34a"
                              : metric.trend === "down"
                              ? "#dc2626"
                              : "#1e40af"
                          }
                        />
                      </View>
                    </View>
                    <Text style={styles.metricLabel}>{metric.fruit}</Text>
                    <Text style={styles.metricChange}>{metric.change}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.insightSection}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb" size={20} color={PRIMARY_GREEN} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Prediction Tips</Text>
                <Text style={styles.insightText}>
                  {fruitDetails.length > 0 && data 
                    ? `Your highest accuracy is ${Math.max(...fruitDetails.map(f => f.accuracy)).toFixed(1)}% with consistent predictions.`
                    : "Keep tracking prices to improve accuracy insights."}
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Button to Predictions */}
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push("/farmer/forecast")}
            >
              <Text style={styles.ctaText}>Our Predictions</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
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
  accuracyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    backgroundColor: LIGHT_GREEN,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  circularProgressContainer: {
    marginBottom: 20,
  },
  circularProgress: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderColor: PRIMARY_GREEN,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  accuracyPercent: {
    fontSize: 36,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  accuracyLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  accuracyDescription: {
    fontSize: 13,
    color: PRIMARY_GREEN,
    fontWeight: "600",
    marginBottom: 4,
  },
  accuracySubtext: {
    fontSize: 11,
    color: "#999",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  metricsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  trendIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 10,
    color: "#999",
  },
  chartSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartSubtitle: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: "row",
    height: 160,
    marginBottom: 16,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    padding: 12,
  },
  chartYAxis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 12,
    width: 35,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#999",
  },
  chartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    paddingBottom: 4,
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
  },
  barsWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 3,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  predictedBar: {
    backgroundColor: PRIMARY_GREEN,
  },
  actualBar: {
    backgroundColor: "#3b82f6",
  },
  dayLabel: {
    fontSize: 10,
    color: "#999",
    marginTop: 8,
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: "#666",
  },
  fruitPerformanceSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  fruitItem: {
    marginBottom: 16,
  },
  fruitInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  fruitEmoji: {
    fontSize: 28,
  },
  fruitName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  fruitAccuracy: {
    fontSize: 11,
    color: PRIMARY_GREEN,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  insightSection: {
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 40,
  },
  insightCard: {
    flexDirection: "row",
    padding: 18,
    borderRadius: 12,
    backgroundColor: LIGHT_GREEN,
    gap: 14,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  insightText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  ctaSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
    marginTop: 8,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
