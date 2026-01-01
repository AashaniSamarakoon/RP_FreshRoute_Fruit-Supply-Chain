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

export default function AccuracyInsightsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<AccuracyMetric[]>([]);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccuracy();
  }, []);

  const loadAccuracy = async () => {
    console.log("[ACCURACY] Loading accuracy insights...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[ACCURACY] No token found");
        setMetrics([]);
        setAccuracy(null);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/farmer/accuracy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        console.log("[ACCURACY] Error:", data.message);
        setMetrics([]);
        setAccuracy(null);
        return;
      }

      setAccuracy(typeof data.accuracy === "number" ? data.accuracy : null);
      const formatted: AccuracyMetric[] = (data.metrics || []).map((m: any) => ({
        label: m.label || m.labelKey || "",
        value: m.value ?? 0,
        trend: (m.trend as AccuracyMetric["trend"]) || "stable",
        change: m.change || m.changeKey || "",
      }));
      setMetrics(formatted);
    } catch (err) {
      console.error("[ACCURACY] Unexpected error", err);
      setMetrics([]);
      setAccuracy(null);
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
              <Text style={styles.cardTitle}>{t("accuracy.cardTitle")}</Text>
              <View style={styles.circularProgressContainer}>
                <View style={styles.circularProgress}>
                  <Text style={styles.accuracyPercent}>
                    {accuracy !== null ? `${accuracy}%` : "--"}
                  </Text>
                  <Text style={styles.accuracyLabel}>{t("accuracy.accuracyLabel")}</Text>
                </View>
              </View>
              <Text style={styles.accuracyDescription}>
                {t("accuracy.accuracyDescription")}
              </Text>
              <Text style={styles.accuracySubtext}>{t("accuracy.accuracySubtext")}</Text>
            </View>
          )}

          {/* Key Metrics */}
          <View style={styles.metricsSection}>
            <Text style={styles.sectionTitle}>{t("accuracy.sectionTitle")}</Text>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={PRIMARY_GREEN} />
                <Text style={styles.loadingText}>Loading metrics...</Text>
              </View>
            ) : metrics.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cloud-offline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No accuracy data available</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadAccuracy}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.metricsGrid}>
                {metrics.map((metric, idx) => (
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
                    <Text style={styles.metricLabel}>{metric.label || t("accuracy.metricLabels.overall")}</Text>
                    <Text style={styles.metricChange}>{metric.change || t("accuracy.metricChanges.stable")}</Text>
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
                <Text style={styles.insightTitle}>{t("accuracy.insightTitle")}</Text>
                <Text style={styles.insightText}>{t("accuracy.insightText")}</Text>
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
