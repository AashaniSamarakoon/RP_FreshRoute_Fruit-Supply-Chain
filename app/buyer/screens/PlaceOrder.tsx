import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import Header from "../../../components/Header";
import SuccessModal from "../../../components/modals/SuccessModal";
import { useOrderForm } from "../forms/useOrderForm";

const PRIMARY_GREEN = "#2E7D32";
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
          <View style={styles.skeletontabsContainer}>
            {[1, 2, 3].map((_, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.skeletonTab,
                  { opacity: fadeAnim },
                  idx > 0 && styles.skeletontabDivider,
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
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    farmersFound: false,
  });

  const {
    formData,
    loading,
    datePickerVisible,
    dateValue,
    fruitItems,
    categoryItems,
    updateField,
    setDatePickerVisible,
    handleSubmit: originalHandleSubmit,
    handleDateChange,
  } = useOrderForm();

  const handleSubmit = async () => {
    // Submit the form using the hook's handler
    const result = await originalHandleSubmit();

    if (result?.success) {
      // Show success modal with appropriate message
      setModalData({
        title: "Order Submitted",
        message: "",
        // message: result.farmersFound
        //   ? "We've found matching suppliers for your order. Let's explore your options."
        //   : "Your order has been submitted successfully. We're searching for the best suppliers and will notify you shortly.",
        farmersFound: result.farmersFound || false,
      });
      setShowModal(true);

      // Auto-close modal and navigate to MatchedStocks after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setTimeout(() => {
          router.push({
            pathname: "/buyer/screens/MatchedStocks",
            params: result.orderId ? { orderId: result.orderId } : {},
          });
        }, 100); // Small delay to ensure modal closes before navigation
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Place Order" onBack={() => router.back()} />


      {/* Success Modal */}
      {showModal && (
        <SuccessModal
          visible={showModal}
          title={modalData.title}
          message={modalData.message}
          onClose={() => setShowModal(false)}
        />
      )}

      <View style={styles.container}>
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

                <Text style={styles.label}>Quantity Needed</Text>
                <View style={styles.quantityContainer}>
                  <TextInput
                    style={[styles.textInput, styles.quantityInput]}
                    placeholder="Enter quantity"
                    keyboardType="numeric"
                    value={formData.quantity}
                    onChangeText={(val) => updateField("quantity", val)}
                  />
                  <View style={styles.unitTabs}>
                    {["kg", "ton"].map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[
                          styles.unitTab,
                          formData.unit === u && styles.unitTabActive,
                        ]}
                        onPress={() => updateField("unit", u)}
                      >
                        <Text
                          style={[
                            styles.unitTabText,
                            formData.unit === u && styles.unitTabTextActive,
                          ]}
                        >
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

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
                    maximumDate={(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 7);
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
                  <Text style={styles.locationText}>
                    {formData.deliveryLocation}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Change Location", "Feature coming soon")
                    }
                  >
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
                <Text style={styles.submitText}>Place Order</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff", paddingTop: 40 },
  container: { flex: 1, backgroundColor: "#fff" },

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

  quantityContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  quantityInput: {
    flex: 1,
  },
  unitTabs: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    borderRadius: 8,
    height: 42,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  unitTab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: PRIMARY_GREEN,
  },
  unitTabActive: {
    backgroundColor: PRIMARY_GREEN,
  },
  unitTabText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
  unitTabTextActive: {
    color: "#fff",
  },

  locationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationText: { color: "#000", fontSize: 18 },
  changeText: { color: PRIMARY_GREEN, fontSize: 18, fontWeight: "600" },

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

  skeletontabsContainer: {
    flexDirection: "row",
    marginTop: 12,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  skeletonTab: {
    flex: 1,
    height: 48,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 16,
  },
  skeletontabDivider: { borderLeftWidth: 1, borderLeftColor: LIGHT_GRAY },

  skeletonButton: {
    height: 56,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 27,
    marginHorizontal: 16,
  },
});
