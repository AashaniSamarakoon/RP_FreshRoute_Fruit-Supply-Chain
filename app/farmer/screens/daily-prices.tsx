import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../../config";
import { useTranslation } from "../../../hooks/farmer/useTranslation";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";

interface DailyFruit {
  name: string;
  variety: string;
  price: string;
  unit: string;
  image: string;
  delta?: string;
  deltaColor?: string;
  status?: string;
  statusColor?: string;
}

export default function DailyPricesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [fruits, setFruits] = useState<DailyFruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    loadDailyPrices();
  }, []);

  const loadDailyPrices = async () => {
    console.log("[DAILY-PRICES] Loading prices...");
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("[DAILY-PRICES] No token found");
        setFruits([]);
        setLoading(false);
        return;
      }

      console.log("[DAILY-PRICES] Fetching:", `${BACKEND_URL}/api/farmer/prices/daily-v2`);
      const res = await fetch(`${BACKEND_URL}/api/farmer/prices/daily-v2`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("[DAILY-PRICES] Response status:", res.status);
      const data = await res.json();
      console.log("[DAILY-PRICES] Response data:", data);

      if (!res.ok) {
        console.log("[DAILY-PRICES] Error:", data.message);
        Alert.alert("Error", data.message || "Failed to load prices");
        return;
      }

      setFruits(data.fruits || []);
      setDate(data.date || new Date().toISOString().split('T')[0]);
      console.log("[DAILY-PRICES] Loaded", data.fruits?.length || 0, "fruits");
    } catch (err) {
      console.error("[DAILY-PRICES] Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", "Failed to load daily prices: " + errorMsg);
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
          <Text style={styles.headerTitle}>{t("dailyPrices.headerTitle")}</Text>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Date */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={18} color="#000" />
          </TouchableOpacity>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>{t("dailyPrices.today")}</Text>
            <Text style={styles.dateValue}>
              {date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity style={styles.dateArrow}>
            <Ionicons name="chevron-forward" size={18} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading prices...</Text>
          </View>
        ) : fruits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No prices available for today</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadDailyPrices}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#7b8b9a" />
              <TextInput
                placeholder={t("dailyPrices.searchPlaceholder")}
                placeholderTextColor="#7b8b9a"
                style={styles.searchInput}
              />
            </View>

            {/* Sort Row */}
            <View style={styles.sortRow}>
              {[t("dailyPrices.sortPrice"), t("dailyPrices.sortName"), t("dailyPrices.sortDemand")].map((label) => (
                <TouchableOpacity key={label} style={styles.sortChip}>
                  <Text style={styles.sortChipText}>{label}</Text>
                  <Ionicons name="chevron-down" size={14} color="#637381" />
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {fruits.map((fruit, idx) => (
            <View key={idx} style={styles.card}>
              <View style={styles.cardLeft}>
                <Image source={{ uri: fruit.image }} style={styles.cardImage} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{fruit.name}</Text>
                  <Text style={styles.cardVariety}>{fruit.variety}</Text>
                  <View style={[styles.badge, { backgroundColor: fruit.statusColor }]}>
                    <Text style={styles.badgeText}>
                      {fruit.status === "High Demand"
                        ? t("dailyPrices.status.highDemand")
                        : t("dailyPrices.status.stable")}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardPrice}>{fruit.price}</Text>
                <Text style={styles.cardUnit}>{fruit.unit}</Text>
                <Text style={[styles.cardDelta, { color: fruit.deltaColor }]}>
                  {fruit.delta}
                </Text>
              </View>
            </View>
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>
          </>
        )}

        {/* Bottom CTA */}
        <TouchableOpacity style={styles.ctaButton}>
          <Ionicons name="storefront" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.ctaText}>{t("dailyPrices.cta")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    gap: 12,
  },
  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GREEN,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  sortChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sortChipText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },
  cardImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: LIGHT_GRAY,
  },
  cardName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardVariety: {
    fontSize: 12,
    color: PRIMARY_GREEN,
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "700",
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
    minWidth: 90,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  cardUnit: {
    fontSize: 11,
    color: "#6b7280",
  },
  cardDelta: {
    fontSize: 11,
    fontWeight: "700",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  ctaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
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
  dateBox: {
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
});
