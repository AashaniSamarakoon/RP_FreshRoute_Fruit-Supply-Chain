import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { BACKEND_URL } from "../../../config";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

interface FruitPropertyRow {
  id: number;
  fruit_name: string;
  variant: string;
  // other columns exist but not used here
}

const SkeletonLoader = () => {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [fadeAnim]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Skeleton */}
        <View style={styles.header}>
          <Animated.View style={[styles.skeletonIcon, { opacity: fadeAnim }]} />
          <Animated.View
            style={[styles.skeletonTitle, { opacity: fadeAnim }]}
          />
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={styles.formCard}>
            {/* Fruit type */}
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />

            {/* Category */}
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />

            {/* Quantity */}
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />

            {/* Grade */}
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <View style={styles.tabsContainer}>
              {[1, 2, 3].map((_, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.skeletonTab,
                    { opacity: fadeAnim },
                    idx > 0 && styles.tabDivider,
                  ]}
                />
              ))}
            </View>

            {/* Date */}
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />
          </View>
        </ScrollView>

        {/* Footer Skeleton */}
        <View style={styles.footer}>
          <Animated.View
            style={[styles.skeletonButton, { opacity: fadeAnim }]}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default function AddStock() {
  const router = useRouter();

  const [rows, setRows] = useState<FruitPropertyRow[]>([]);
  const [fruitItems, setFruitItems] = useState<
    { label: string; value: string }[]
  >([]);
  const [categoryItems, setCategoryItems] = useState<
    { label: string; value: string }[]
  >([]);

  const [fruit, setFruit] = useState<string | null>(null); // fruit_name
  const [category, setCategory] = useState<string | null>(null); // variant string
  const [quantity, setQuantity] = useState("");
  const [grade, setGrade] = useState<string>("A");
  const [estimatedDate, setEstimatedDate] = useState("");

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateValue, setDateValue] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/fruit-properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Read text and attempt to parse JSON
        const text = await res.text();
        let raw: any = text;
        try {
          raw = text ? JSON.parse(text) : text;
        } catch (parseErr) {
          // fall back to raw text
        }

        if (!res.ok) {
          Alert.alert(
            "Error",
            `Failed to load fruit properties (${res.status})`
          );
          setLoading(false);
          return;
        }

        const data: FruitPropertyRow[] = Array.isArray(raw)
          ? raw
          : raw?.fruits ?? raw?.data ?? raw?.items ?? [];

        if (!Array.isArray(data)) {
          Alert.alert("Error", "Unexpected data format from server");
          setLoading(false);
          return;
        }

        setRows(data);

        // unique fruit names
        const unique = Array.from(new Set(data.map((r) => r.fruit_name)));
        setFruitItems(unique.map((name) => ({ label: name, value: name })));
      } catch (e) {
        console.error(
          "[AddStock] exception while loading fruit properties:",
          e
        );
        Alert.alert("Error", "Could not load fruit properties");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!fruit) {
      setCategoryItems([]);
      setCategory(null);
      return;
    }
    // filter rows for selected fruit_name and map variants -> variant string
    const filtered = rows.filter((r) => r.fruit_name === fruit);
    setCategoryItems(
      filtered.map((r) => ({ label: r.variant, value: r.variant }))
    );
    setCategory(null);
  }, [fruit, rows]);

  const isFutureDate = (dateStr: string) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  };

  const onSubmit = async () => {
    if (!fruit || !category || !quantity) {
      return Alert.alert("Error", "Please fill fruit, category and quantity");
    }
    // require a future date (tomorrow or later)
    if (!estimatedDate || !isFutureDate(estimatedDate)) {
      return Alert.alert(
        "Error",
        "Please select a future estimated harvest date (tomorrow or later)"
      );
    }
    try {
      const token = await AsyncStorage.getItem("token");
      const masked = token
        ? token.length > 10
          ? `${token.slice(0, 6)}...${token.slice(-4)}`
          : token
        : null;
      if (!token) return Alert.alert("Error", "Not authenticated");

      const payload = {
        fruit_type: fruit,
        variant: category,
        quantity: parseInt(quantity, 10),
        grade,
        estimated_harvest_date: estimatedDate,
      };
      console.log(
        "[AddStock] submitting stock, Authorization: Bearer",
        masked,
        "payload:",
        payload
      );

      const res = await fetch(`${BACKEND_URL}/api/farmer/add-predict-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      if (!res.ok) {
        console.error("Submit error:", body);
        return Alert.alert("Error", body.message || "Failed to submit stock");
      }

      Alert.alert("Success", "Stock submitted successfully");
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not submit stock");
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expected Stock</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={styles.formCard}>
            <Text style={styles.label}>Fruit type</Text>
            <RNPickerSelect
              onValueChange={(val) => setFruit(val)}
              value={fruit}
              placeholder={{ label: "Select fruit", value: null }}
              items={fruitItems}
              style={{
                inputIOS: styles.selectInput,
                inputAndroid: styles.selectInput,
                placeholder: { color: "#aaa" },
              }}
              useNativeAndroidPickerStyle={false}
            />

            <Text style={styles.label}>Category (variant)</Text>
            <RNPickerSelect
              onValueChange={(val) => setCategory(val)}
              value={category}
              placeholder={{ label: "Select category", value: null }}
              items={categoryItems}
              disabled={!fruit}
              style={{
                inputIOS: [styles.selectInput, !fruit && styles.selectDisabled],
                inputAndroid: [
                  styles.selectInput,
                  !fruit && styles.selectDisabled,
                ],
                placeholder: { color: "#aaa" },
              }}
              useNativeAndroidPickerStyle={false}
            />

            <Text style={styles.label}>Expected Harvest Quantity</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter quantity"
              keyboardType="numeric"
              value={quantity}
              onChangeText={setQuantity}
            />

            <Text style={styles.label}>Grade</Text>
            <View style={styles.tabsContainer}>
              {["A", "B", "C"].map((g, idx) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.tab,
                    grade === g && styles.tabActive,
                    idx > 0 && styles.tabDivider,
                  ]}
                  onPress={() => setGrade(g)}
                >
                  <Text
                    style={[
                      styles.tabText,
                      grade === g && styles.tabTextActive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Estimated harvest date</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text
                style={[styles.selectText, !estimatedDate && { color: "#aaa" }]}
              >
                {estimatedDate || "Select date"}
              </Text>
              <Ionicons name="calendar" size={18} color="#666" />
            </TouchableOpacity>

            {datePickerVisible && (
              <DateTimePicker
                value={dateValue || new Date()}
                mode="date"
                display={Platform.OS === "android" ? "calendar" : "spinner"}
                minimumDate={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(0, 0, 0, 0);
                  return d;
                })()}
                textColor={PRIMARY_GREEN} // iOS
                accentColor={PRIMARY_GREEN} // Android (supported in newer versions)
                onChange={(event, selectedDate) => {
                  if (Platform.OS === "android") setDatePickerVisible(false);
                  const current = selectedDate || dateValue || new Date();
                  setDateValue(current);
                  setEstimatedDate(current.toISOString().slice(0, 10));
                }}
              />
            )}
          </View>
        </ScrollView>

        {/* Fixed footer submit */}
        <View style={styles.footer} pointerEvents="box-none">
          <TouchableOpacity style={styles.submitButtonFixed} onPress={onSubmit}>
            <Text style={styles.submitText}>Submit Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, backgroundColor: "#fff" },
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
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000" },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    // margin: 16,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 8, marginTop: 12 },
  selectInput: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: { color: "#000", fontSize: 16 },
  selectDisabled: { opacity: 0.6 },
  textInput: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  tabsContainer: {
    flexDirection: "row",
    marginTop: 12,
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  tabDivider: { borderLeftWidth: 1, borderLeftColor: PRIMARY_GREEN },
  tabActive: { backgroundColor: PRIMARY_GREEN },
  tabText: { color: "#333", fontWeight: "700", fontSize: 16 },
  tabTextActive: { color: "#fff", fontSize: 16 },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  submitButtonFixed: {
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 27,
    alignItems: "center",
    // marginHorizontal: 16,
  },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 18 },

  // Skeleton styles
  skeletonIcon: {
    width: 24,
    height: 24,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 18,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 16,
  },
  skeletonLabel: {
    height: 14,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    marginBottom: 8,
    marginTop: 12,
  },
  skeletonInput: {
    height: 48,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    marginBottom: 12,
  },
  skeletonTab: {
    flex: 1,
    height: 48,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 16,
  },
  skeletonButton: {
    height: 56,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 27,
    marginHorizontal: 16,
  },
});
