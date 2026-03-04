import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
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
import { PillTabBar } from "../../../components/ui/PillTabBar";
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
  const [refreshing, setRefreshing] = useState(false);
  const [fruits, setFruits] = useState<FruitEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedFruitId, setSelectedFruitId] = useState("");
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
      // log the current session so we can troubleshoot role issues
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log(
        "[FreshroutePrices] session metadata",
        session?.user?.user_metadata,
      );

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

      // we only use the canonical endpoint. earlier code tried fallbacks,
      // but the backend has settled on this single path.
      const path = `/api/prices/freshroute?date=${selectedDate}`;
      const data = await api.get(path);
      console.log("[FreshroutePrices] fetched", path);

      const mapFromFruits = (fruitsArr: any[]): FruitEntry[] =>
        fruitsArr.map((fruit: any) => {
          const fruitKey = (fruit.name || "").toLowerCase();
          const gradesObj = fruit.grades || {};
          const grades: GradePrice[] = Object.values(gradesObj).map(
            (g: any) => ({
              grade: g.grade,
              price: g.price || 0,
            }),
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
      setSelectedFruitId(mapped[0]?.fruit_id ?? "");
    } catch (err) {
      let msg = err instanceof Error ? err.message : String(err);
      // if we see a role-related response, make it more user friendly
      if (/role/i.test(msg)) {
        msg =
          "Your account does not have buyer permissions. Please log in with a buyer profile or contact support.";
      }
      setErrorModal({
        visible: true,
        title: "Error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedFruit =
    fruits.find((f) => f.fruit_id === selectedFruitId) ?? fruits[0];

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
          <PillTabBar
            tabs={fruits.map((f) => ({
              key: f.fruit_id,
              label: (f.name || "Fruit").trim() || "Fruit",
            }))}
            activeKey={selectedFruitId}
            onPress={setSelectedFruitId}
          />
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await loadPrices();
                  setRefreshing(false);
                }}
                colors={[PRIMARY_GREEN]}
                tintColor={PRIMARY_GREEN}
              />
            }
          >
            {fruits.length > 0 && selectedFruit && (
              <View key={selectedFruit.fruit_id} style={styles.fruitCard}>
                <View style={styles.fruitHeader}>
                  <View style={styles.fruitTitleRow}>
                    <Text style={styles.fruitEmoji}>{selectedFruit.emoji}</Text>
                    <View>
                      <Text style={styles.fruitName}>{selectedFruit.name}</Text>
                      {selectedFruit.variety ? (
                        <Text style={styles.fruitVariety}>
                          {selectedFruit.variety}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                <View style={styles.gradesList}>
                  {selectedFruit.grades.map((grade) => {
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
