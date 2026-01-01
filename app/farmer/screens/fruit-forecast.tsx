import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslation } from "../../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const ORANGE = "#f59e0b";

const screenWidth = Dimensions.get("window").width;

export default function FruitForecastScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedFruit, setSelectedFruit] = useState(params.fruit || "TJC Mango");
  const { t } = useTranslation();

  const fruits = ["TJC Mango", "Pineapple", "Banana"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("fruitForecast.headerTitle")}</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="#000" />
          </TouchableOpacity>
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
            <Text style={styles.forecastTitle}>{t("fruitForecast.forecastTitle", { fruit: selectedFruit })}</Text>
            <Text style={styles.forecastSubtitle}>{t("fruitForecast.forecastSubtitle")}</Text>
          </View>

          {/* Graph Placeholder */}
          <View style={styles.graphContainer}>
            <View style={styles.graphLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                <Text style={styles.legendText}>{t("fruitForecast.legendDemand")}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ORANGE }]} />
                <Text style={styles.legendText}>{t("fruitForecast.legendPrice")}</Text>
              </View>
            </View>

            {/* Simple Graph Visualization */}
            <View style={styles.graph}>
              {/* Y-axis labels */}
              <View style={styles.yAxisLabels}>
                <Text style={styles.axisLabel}>{t("fruitForecast.axisHigh")}</Text>
                <Text style={styles.axisLabel}>{t("fruitForecast.axisMed")}</Text>
                <Text style={styles.axisLabel}>{t("fruitForecast.axisLow")}</Text>
              </View>

              {/* Graph area with curves */}
              <View style={styles.graphArea}>
                {/* Blue wave (Demand) */}
                <View style={styles.demandWave}>
                  <View style={[styles.waveSegment, { height: 40, backgroundColor: "#3b82f6" }]} />
                  <View style={[styles.waveSegment, { height: 60, backgroundColor: "#3b82f6" }]} />
                  <View style={[styles.waveSegment, { height: 45, backgroundColor: "#3b82f6" }]} />
                  <View style={[styles.waveSegment, { height: 70, backgroundColor: "#3b82f6" }]} />
                  <View style={[styles.waveSegment, { height: 55, backgroundColor: "#3b82f6" }]} />
                  <View style={[styles.waveSegment, { height: 50, backgroundColor: "#3b82f6" }]} />
                  <View style={[styles.waveSegment, { height: 65, backgroundColor: "#3b82f6" }]} />
                </View>

                {/* Orange wave (Price) */}
                <View style={styles.priceWave}>
                  <View style={[styles.waveSegment, { height: 50, backgroundColor: ORANGE }]} />
                  <View style={[styles.waveSegment, { height: 55, backgroundColor: ORANGE }]} />
                  <View style={[styles.waveSegment, { height: 60, backgroundColor: ORANGE }]} />
                  <View style={[styles.waveSegment, { height: 45, backgroundColor: ORANGE }]} />
                  <View style={[styles.waveSegment, { height: 65, backgroundColor: ORANGE }]} />
                  <View style={[styles.waveSegment, { height: 50, backgroundColor: ORANGE }]} />
                  <View style={[styles.waveSegment, { height: 70, backgroundColor: ORANGE }]} />
                </View>
              </View>

              {/* X-axis labels */}
              <View style={styles.xAxisLabels}>
                <Text style={styles.axisLabel}>{t("forecast.days.mon")}</Text>
                <Text style={styles.axisLabel}>{t("forecast.days.tue")}</Text>
                <Text style={styles.axisLabel}>{t("forecast.days.wed")}</Text>
                <Text style={styles.axisLabel}>{t("forecast.days.thu")}</Text>
                <Text style={styles.axisLabel}>{t("forecast.days.fri")}</Text>
                <Text style={styles.axisLabel}>{t("forecast.days.sat")}</Text>
                <Text style={styles.axisLabel}>{t("forecast.days.sun")}</Text>
              </View>
            </View>
          </View>

          {/* Peak Demand Card */}
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightTitle}>{t("fruitForecast.insightTitle")}</Text>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>{t("fruitForecast.details")}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.insightDescription}>
              {t("fruitForecast.insightDescription", { fruit: selectedFruit })}
            </Text>
          </View>

          {/* Bottom Navigation Hint */}
          <View style={styles.bottomHint}>
            <Text style={styles.hintText}>
              {t("fruitForecast.bottomHint")}
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
  fruitSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  fruitPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  fruitPillActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  fruitPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#666",
  },
  fruitPillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  forecastHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  forecastSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  graphContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
  },
  graphLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  graph: {
    flexDirection: "row",
  },
  yAxisLabels: {
    justifyContent: "space-between",
    paddingRight: 8,
    paddingVertical: 10,
  },
  axisLabel: {
    fontSize: 10,
    color: "#999",
  },
  graphArea: {
    flex: 1,
    height: 120,
    position: "relative",
  },
  demandWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    opacity: 0.7,
  },
  priceWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    opacity: 0.6,
  },
  waveSegment: {
    width: 8,
    borderRadius: 4,
  },
  xAxisLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
    position: "absolute",
    bottom: -20,
    left: 40,
    right: 0,
  },
  insightCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 12,
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  detailsButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  insightDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
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
