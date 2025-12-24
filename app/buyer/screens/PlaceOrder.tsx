import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
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
import { useOrderForm } from "../forms/useOrderForm";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

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
    <>
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
        <Animated.View style={[styles.skeletonButton, { opacity: fadeAnim }]} />
      </View>
    </>
  );
};

export const options = {
  headerShown: false,
};

export default function AddStock() {
  const router = useRouter(); // Add this line to declare the router
  const {
    formData,
    loading,
    datePickerVisible,
    dateValue,
    fruitItems,
    categoryItems,
    updateField,
    setDatePickerVisible,
    handleSubmit,
    handleDateChange,
  } = useOrderForm();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header - always displayed */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Place Order</Text>
          <View style={{ width: 24 }} />
        </View>

        {loading ? (
          <SkeletonLoader />
        ) : (
          <>
            <ScrollView
              style={styles.container}
              contentContainerStyle={{ paddingBottom: 140 }}
            >
              <View style={styles.formCard}>
                <Text style={styles.label}>Fruit type</Text>
                <RNPickerSelect
                  onValueChange={(val) => updateField("fruit", val)}
                  value={formData.fruit}
                  placeholder={{ label: "Select fruit", value: null }}
                  items={fruitItems}
                  style={{
                    inputIOS: [styles.selectInput, { fontSize: 18 }],
                    inputAndroid: [styles.selectInput, { fontSize: 18 }],
                    placeholder: { color: "#aaa", fontSize: 18 },
                  }}
                  useNativeAndroidPickerStyle={false}
                />

                <Text style={styles.label}>Category (variant)</Text>
                <RNPickerSelect
                  onValueChange={(val) => updateField("category", val)}
                  value={formData.category}
                  placeholder={{ label: "Select category", value: null }}
                  items={categoryItems}
                  disabled={!formData.fruit}
                  style={{
                    inputIOS: [
                      styles.selectInput,
                      !formData.fruit && styles.selectDisabled,
                      { fontSize: 18 },
                    ],
                    inputAndroid: [
                      styles.selectInput,
                      !formData.fruit && styles.selectDisabled,
                      { fontSize: 18 },
                    ],
                    placeholder: { color: "#aaa", fontSize: 18 },
                  }}
                  useNativeAndroidPickerStyle={false}
                />

                <Text style={styles.label}> Quantity Needed</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter quantity"
                  keyboardType="numeric"
                  value={formData.quantity}
                  onChangeText={(val) => updateField("quantity", val)}
                />

                <Text style={styles.label}>Grade</Text>
                <View style={styles.tabsContainer}>
                  {["A", "B", "C"].map((g, idx) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.tab,
                        formData.grade === g && styles.tabActive,
                        idx > 0 && styles.tabDivider,
                      ]}
                      onPress={() => updateField("grade", g)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          formData.grade === g && styles.tabTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Required Delivery Date</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      !formData.estimatedDate && { color: "#aaa" },
                    ]}
                  >
                    {formData.estimatedDate || "Select date"}
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
                    onChange={handleDateChange}
                  />
                )}

                <Text style={styles.label}>Delivery Location</Text>
                <View style={styles.locationContainer}>
                  <Text style={styles.locationText}>{formData.deliveryLocation}</Text>
                  <TouchableOpacity onPress={() => Alert.alert("Change Location", "Feature coming soon")}>
                    <Text style={styles.changeText}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Fixed footer submit */}
            <View style={styles.footer} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.submitButtonFixed}
                onPress={handleSubmit}
              >
                <Text style={styles.submitText}>Submit Stock</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
  label: { fontSize: 16, color: "#333", marginBottom: 8, marginTop: 12 },
  selectInput: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectText: { color: "#000", fontSize: 18 },
  selectDisabled: { opacity: 0.6 },
  textInput: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
  },

  locationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationText: { color: "#000", fontSize: 18 },
  changeText: { color: PRIMARY_GREEN, fontSize: 18, fontWeight: '600' },

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
  tabText: { color: "#333", fontWeight: "700", fontSize: 18 },
  tabTextActive: { color: "#fff", fontSize: 18 },

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