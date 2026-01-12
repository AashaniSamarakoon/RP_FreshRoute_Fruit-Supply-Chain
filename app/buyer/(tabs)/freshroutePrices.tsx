import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import ErrorModal from "../../../components/modals/ErrorModal";
import SuccessModal from "../../../components/modals/SuccessModal";
import { BACKEND_URL } from "../../../config";
import { BuyerColors } from "../../../constants/theme";

const PRIMARY_GREEN = BuyerColors.primaryGreen || "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";

const GRADE_COLORS: Record<
  string,
  { bg: string; text: string; badge: string }
> = {
  A: { bg: "#dcfce7", text: "#15803d", badge: "#86efac" },
  B: { bg: "#fef3c7", text: "#b45309", badge: "#fcd34d" },
  C: { bg: "#fed7aa", text: "#92400e", badge: "#fdba74" },
  D: { bg: "#fee2e2", text: "#991b1b", badge: "#fca5a5" },
};

interface GradePrice {
  grade: string;
  price: number;
}

interface FruitEntry {
  fruit_id: string;
  name: string;
  variety?: string;
  emoji: string;
  grades: GradePrice[];
}

const FRUIT_IMAGES: Record<string, string> = {
  mango: "🥭",
  banana: "🍌",
  pineapple: "🍍",
  apple: "🍎",
  orange: "🍊",
  strawberry: "🍓",
  blueberry: "🫐",
  watermelon: "🍉",
  grape: "🍇",
};

export default function FreshroutePricesForBuyer() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fruits, setFruits] = useState<FruitEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedFruitIdx, setSelectedFruitIdx] = useState(0);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const [successModal, setSuccessModal] = useState({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    loadPrices();
  }, [selectedDate]);

  const loadPrices = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setErrorModal({
          visible: true,
          title: "Authentication Error",
          message: "Authentication required. Please log in again.",
        });
        setLoading(false);
        return;
      }

      const candidateUrls = [
        `${BACKEND_URL}/api/buyer/prices/freshroute?date=${selectedDate}`,
        `${BACKEND_URL}/api/farmer/prices/freshroute?date=${selectedDate}`,
      ];

      let data: any = null;
      let ok = false;
      let lastErrorMsg = "";

      for (const url of candidateUrls) {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const body = await res.json().catch(() => null);
        if (res.ok) {
          data = body;
          ok = true;
          break;
        }
        lastErrorMsg =
          body?.message || body?.error || `Request failed (${res.status})`;
        // If forbidden, try next URL
        if (res.status === 403) {
          continue;
        } else {
          break;
        }
      }

      if (!ok) {
        setErrorModal({
          visible: true,
          title: "Error",
          message: lastErrorMsg || "Failed to load FreshRoute prices",
        });
        setLoading(false);
        return;
      }

      const mapFromFruits = (fruitsArr: any[]): FruitEntry[] =>
        fruitsArr.map((fruit: any) => {
          const fruitKey = (fruit.name || "").toLowerCase();
          const gradesObj = fruit.grades || {};
          const grades: GradePrice[] = Object.values(gradesObj).map(
            (g: any) => ({
              grade: g.grade,
              price: g.price || 0,
            })
          );

          return {
            fruit_id: fruit.fruit_id || fruit.id || fruit.name,
            name: fruit.name,
            variety: fruit.variety,
            emoji: FRUIT_IMAGES[fruitKey] || "🍎",
            grades: grades.sort((a, b) => a.grade.localeCompare(b.grade)),
          };
        });

      const mapFromFlatPrices = (pricesArr: any[]): FruitEntry[] => {
        const byFruit: Record<string, FruitEntry> = {};
        pricesArr.forEach((p: any) => {
          const fruitName = p.fruit_name || p.fruit || "Unknown";
          const fruitKey = (fruitName || "").toLowerCase();
          const key = p.fruit_id || fruitName;
          if (!byFruit[key]) {
            byFruit[key] = {
              fruit_id: key,
              name: fruitName,
              variety: p.variety,
              emoji: FRUIT_IMAGES[fruitKey] || "🍎",
              grades: [],
            };
          }
          if (p.grade) {
            byFruit[key].grades.push({ grade: p.grade, price: p.price || 0 });
          }
        });
        return Object.values(byFruit).map((f) => ({
          ...f,
          grades: f.grades.sort((a, b) => a.grade.localeCompare(b.grade)),
        }));
      };

      const fruitsData = data.fruits || data.data?.fruits || null;
      const pricesData = Array.isArray(data.prices) ? data.prices : [];

      const mapped: FruitEntry[] =
        Array.isArray(fruitsData) && fruitsData.length > 0
          ? mapFromFruits(fruitsData)
          : mapFromFlatPrices(pricesData);

      setFruits(mapped);
      setSelectedFruitIdx(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorModal({
        visible: true,
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SafeAreaView style={styles.container}>
        <Header
          title="FreshRoute Prices"
          showNotification={true}
          onNotificationPress={() => router.push("/buyer/(tabs)/profile")}
        />

        {/* Date pill */}
        <View style={styles.datePill}>
          <Ionicons name="calendar" size={16} color={PRIMARY_GREEN} />
          <Text style={styles.datePillText}>
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </View>

        {/* Fruit tabs */}
        {fruits.length > 0 && (
          <View style={styles.fruitTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.fruitTabsRow}
            >
              {fruits.map((fruit, idx) => {
                const selected = idx === selectedFruitIdx;
                const label = (fruit.name || "Fruit").trim() || "Fruit";
                return (
                  <TouchableOpacity
                    key={fruit.fruit_id}
                    style={[styles.fruitTab, selected && styles.fruitTabActive]}
                    onPress={() => setSelectedFruitIdx(idx)}
                  >
                    <Text
                      style={[
                        styles.fruitTabText,
                        selected && styles.fruitTabTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading prices...</Text>
          </View>
        ) : fruits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No prices found</Text>
            <Text style={styles.emptySubtitle}>
              FreshRoute prices are not available right now.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {fruits.length > 0 && (
              <View
                key={fruits[selectedFruitIdx]?.fruit_id || selectedFruitIdx}
                style={styles.fruitCard}
              >
                <View style={styles.fruitHeader}>
                  <View style={styles.fruitTitleRow}>
                    <Text style={styles.fruitEmoji}>
                      {fruits[selectedFruitIdx].emoji}
                    </Text>
                    <View>
                      <Text style={styles.fruitName}>
                        {fruits[selectedFruitIdx].name}
                      </Text>
                      {fruits[selectedFruitIdx].variety ? (
                        <Text style={styles.fruitVariety}>
                          {fruits[selectedFruitIdx].variety}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.gradesList}>
                  {fruits[selectedFruitIdx].grades.map((grade) => {
                    const color = GRADE_COLORS[grade.grade] || GRADE_COLORS.A;
                    return (
                      <View key={grade.grade} style={styles.gradeRow}>
                        <View
                          style={[
                            styles.gradeBadge,
                            { backgroundColor: color.badge },
                          ]}
                        >
                          <Text
                            style={[
                              styles.gradeBadgeText,
                              { color: color.text },
                            ]}
                          >
                            Grade {grade.grade}
                          </Text>
                        </View>
                        <Text style={styles.gradePrice}>
                          Rs.{" "}
                          {grade.price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          <Text style={styles.logisticText}>
                            {" "}
                            + Logistic Cost
                          </Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>
        )}

        {!loading && fruits.length > 0 && (
          <View style={styles.placeOrderContainer}>
            <TouchableOpacity
              style={styles.placeOrderButton}
              onPress={() => router.push("/buyer/screens/PlaceOrder")}
            >
              <Text style={styles.placeOrderText}>Place Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Error Modal - positioned outside SafeAreaView to cover notification bar */}
      <ErrorModal
        visible={errorModal.visible}
        onClose={() =>
          setErrorModal({ visible: false, title: "", message: "" })
        }
        title={errorModal.title}
        message={errorModal.message}
      />

      {/* Success Modal - positioned outside SafeAreaView to cover notification bar */}
      <SuccessModal
        visible={successModal.visible}
        onClose={() =>
          setSuccessModal({ visible: false, title: "", message: "" })
        }
        title={successModal.title}
        message={successModal.message}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: "#555",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LIGHT_GREEN,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  datePillText: {
    fontSize: 14,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  fruitTabsContainer: {
    marginBottom: 16,
    height: 56,
  },
  fruitTabsRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingVertical: 8,
  },
  fruitTab: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  fruitTabActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  fruitTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
    textAlign: "center",
  },
  fruitTabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  fruitCard: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 18,
    overflow: "hidden",
  },
  fruitHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  fruitTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  fruitEmoji: {
    fontSize: 30,
  },
  fruitName: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  fruitVariety: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  gradesList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  gradeRow: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  gradePrice: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY_GREEN,
    textAlign: "right",
    flex: 1,
  },
  logisticText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  placeOrderButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  placeOrderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  placeOrderContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
});
