import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
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
const LIGHT_BLUE = "#e3f2fd";

interface AccuracyMetric {
  label: string;
  value: number;
  trend: "up" | "down" | "stable";
  change: string;
}

const mockMetrics: AccuracyMetric[] = [
  { label: "Overall Accuracy", value: 92, trend: "up", change: "+4% this week" },
  { label: "Price Prediction", value: 88, trend: "up", change: "+2% this week" },
  { label: "Demand Forecast", value: 95, trend: "stable", change: "Stable" },
];

const mockPerformanceData = [
  { day: "Mon", predicted: 45, actual: 42 },
  { day: "Tue", predicted: 48, actual: 50 },
  { day: "Wed", predicted: 52, actual: 51 },
  { day: "Thu", predicted: 58, actual: 60 },
  { day: "Fri", predicted: 62, actual: 65 },
  { day: "Sat", predicted: 55, actual: 52 },
  { day: "Sun", predicted: 50, actual: 48 },
];

interface FruitPerformance {
  name: string;
  accuracy: number;
  emoji: string;
  color: string;
}

const fruitPerformance: FruitPerformance[] = [
  { name: "Mango", accuracy: 94, emoji: "🥭", color: "#FFA500" },
  { name: "Pineapple", accuracy: 89, emoji: "🍍", color: "#FFD700" },
  { name: "Banana", accuracy: 92, emoji: "🍌", color: "#FFEB3B" },
];

export default function AccuracyInsightsScreen() {
  const router = useRouter();
  const screenWidth = Dimensions.get("window").width;
  const chartWidth = screenWidth - 60;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Accuracy Insights</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Overall Accuracy Card */}
          <View style={styles.accuracyCard}>
            <Text style={styles.cardTitle}>Prediction Progress & Accuracy</Text>
            <View style={styles.circularProgressContainer}>
              <View style={styles.circularProgress}>
                <Text style={styles.accuracyPercent}>92%</Text>
                <Text style={styles.accuracyLabel}>Overall Accuracy</Text>
              </View>
            </View>
            <Text style={styles.accuracyDescription}>
              High accuracy achieved this week
            </Text>
            <Text style={styles.accuracySubtext}>Last 7 Days</Text>
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              {mockMetrics.map((metric, idx) => (
                <View key={idx} style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Text style={styles.metricValue}>{metric.value}%</Text>
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
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricChange}>{metric.change}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Performance Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Price Performance</Text>
            <Text style={styles.chartSubtitle}>Predicted vs. Actual</Text>

            <View style={styles.chartContainer}>
              <View style={styles.chartYAxis}>
                <Text style={styles.yAxisLabel}>70</Text>
                <Text style={styles.yAxisLabel}>50</Text>
                <Text style={styles.yAxisLabel}>30</Text>
              </View>

              <View style={styles.chartBars}>
                {mockPerformanceData.map((data, idx) => {
                  const maxValue = 70;
                  const predictedHeight = (data.predicted / maxValue) * 100;
                  const actualHeight = (data.actual / maxValue) * 100;

                  return (
                    <View key={idx} style={styles.barGroup}>
                      <View style={styles.barsWrapper}>
                        <View
                          style={[
                            styles.bar,
                            styles.predictedBar,
                            { height: `${predictedHeight}%` },
                          ]}
                        />
                        <View
                          style={[
                            styles.bar,
                            styles.actualBar,
                            { height: `${actualHeight}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.dayLabel}>{data.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#3b82f6" }]}
                />
                <Text style={styles.legendText}>Actual</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: PRIMARY_GREEN }]}
                />
                <Text style={styles.legendText}>Predicted</Text>
              </View>
            </View>
          </View>

          {/* Fruit-wise Performance */}
          <View style={styles.fruitPerformanceSection}>
            <Text style={styles.sectionTitle}>Fruit-wise Performance</Text>
            {fruitPerformance.map((fruit, idx) => (
              <View key={idx} style={styles.fruitItem}>
                <View style={styles.fruitInfo}>
                  <Text style={styles.fruitEmoji}>{fruit.emoji}</Text>
                  <View>
                    <Text style={styles.fruitName}>{fruit.name}</Text>
                    <Text style={styles.fruitAccuracy}>
                      {fruit.accuracy}% Accuracy
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${fruit.accuracy}%`,
                        backgroundColor: fruit.color,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Insights Card */}
          <View style={styles.insightSection}>
            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Ionicons name="bulb" size={20} color={PRIMARY_GREEN} />
              </View>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Performance Insight</Text>
                <Text style={styles.insightText}>
                  Your demand forecasts are performing exceptionally well this
                  week. Consider using this model for other produce categories.
                </Text>
              </View>
            </View>
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
    margin: 16,
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
  metricsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 12,
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
    marginBottom: 24,
  },
  insightCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    backgroundColor: LIGHT_GREEN,
    gap: 12,
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
});
