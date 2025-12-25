import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const RED = "#e53e3e";
const LIGHT_RED = "#fef2f2";

interface FruitPrediction {
  name: string;
  emoji: string;
  days: {
    day: string;
    trend: "up" | "down" | "stable";
    trendText: string;
    value: string;
    unit: "units" | "kg";
  }[];
}

const mockData: FruitPrediction[] = [
  {
    name: " TJC Mango",
    emoji: "🥭",
    days: [
      {
        day: "Monday",
        trend: "up",
        trendText: "Price Demand",
        value: "600",
        unit: "units",
      },
      {
        day: "Tuesday",
        trend: "up",
        trendText: "Price Demand",
        value: "620",
        unit: "units",
      },
      {
        day: "Wednesday",
        trend: "down",
        trendText: "Slight Dip",
        value: "480",
        unit: "units",
      },
    ],
  },
  {
    name: "Pineapple",
    emoji: "🍍",
    days: [
      {
        day: "Monday",
        trend: "up",
        trendText: "Price Increase",
        value: "$2.50",
        unit: "kg",
      },
      {
        day: "Tuesday",
        trend: "stable",
        trendText: "Stable",
        value: "$2.55",
        unit: "kg",
      },
      {
        day: "Wednesday",
        trend: "down",
        trendText: "Dip",
        value: "$2.40",
        unit: "kg",
      },
    ],
  },
  {
    name: "Banana",
    emoji: "🍌",
    days: [
      {
        day: "Monday",
        trend: "stable",
        trendText: "Constant Demand",
        value: "1200",
        unit: "units",
      },
      {
        day: "Tuesday",
        trend: "up",
        trendText: "Rising Demand",
        value: "1250",
        unit: "units",
      },
      {
        day: "Wednesday",
        trend: "up",
        trendText: "Rising Demand",
        value: "1280",
        unit: "units",
      },
    ],
  },
];

export default function ForecastScreen() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<"Demand" | "Price">("Demand");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>7-Day Prediction</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Demand" && styles.tabActive]}
            onPress={() => setSelectedTab("Demand")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Demand" && styles.tabTextActive,
              ]}
            >
              Demand
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "Price" && styles.tabActive]}
            onPress={() => setSelectedTab("Price")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "Price" && styles.tabTextActive,
              ]}
            >
              Price
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {mockData.map((fruit, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fruitCard}
              onPress={() =>
                router.push(`/farmer/screens/fruit-forecast?fruit=TJC ${fruit.name}`)
              }
            >
              {/* Fruit Header */}
              <View style={styles.fruitHeader}>
                <View style={styles.fruitIcon}>
                  <Text style={styles.fruitEmoji}>{fruit.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fruitLabel}>Fruit Prediction</Text>
                  <Text style={styles.fruitName}> {fruit.name}</Text>
                </View>
              </View>

              {/* Tab Switcher for this fruit */}
              <View style={styles.fruitTabContainer}>
                <TouchableOpacity
                  style={[
                    styles.fruitTab,
                    selectedTab === "Demand" && styles.fruitTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.fruitTabText,
                      selectedTab === "Demand" && styles.fruitTabTextActive,
                    ]}
                  >
                    Demand
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.fruitTab,
                    selectedTab === "Price" && styles.fruitTabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.fruitTabText,
                      selectedTab === "Price" && styles.fruitTabTextActive,
                    ]}
                  >
                    Price
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Days List */}
              {fruit.days.map((day, dayIndex) => (
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
                        {day.trendText}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dayValue}>
                    {day.value} {day.unit}
                  </Text>
                </View>
              ))}

              {/* Last Updated */}
              {index === mockData.length - 1 && (
                <Text style={styles.lastUpdated}>Last update: Just now</Text>
              )}
            </TouchableOpacity>
          ))}

          {/* Bottom spacing */}
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
  fruitCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  fruitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fruitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  fruitEmoji: {
    fontSize: 20,
  },
  fruitLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 2,
  },
  fruitName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
  },
  fruitTabContainer: {
    flexDirection: "row",
    marginBottom: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 6,
    padding: 3,
  },
  fruitTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 4,
  },
  fruitTabActive: {
    backgroundColor: "#fff",
  },
  fruitTabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  fruitTabTextActive: {
    color: PRIMARY_GREEN,
    fontWeight: "600",
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
  },
  trendIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dayName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginBottom: 2,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "500",
  },
  dayValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
  },
  lastUpdated: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
});
