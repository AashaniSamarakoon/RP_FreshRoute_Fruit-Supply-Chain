import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
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
import ErrorModal from "../../../components/modals/ErrorModal";
import SuccessModal from "../../../components/modals/SuccessModal";
import { useTranslationContext } from "../../../context/TranslationContext";
import { useAddStock } from "../forms/useAddStock";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GRAY = "#f5f5f5";

// ... (SkeletonLoader kept exactly as is for brevity) ...
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
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={styles.formCard}>
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />
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
            <Animated.View
              style={[styles.skeletonLabel, { opacity: fadeAnim }]}
            />
            <Animated.View
              style={[styles.skeletonInput, { opacity: fadeAnim }]}
            />
          </View>
        </ScrollView>
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
  const { t } = useTranslationContext();
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    loading,
    formData,
    fruitItems,
    categoryItems,
    updateField,
    pickImage,
    removeImage,
    setDatePickerVisible,
    datePickerVisible,
    dateValue,
    handleDateChange,
    handleSubmit: originalHandleSubmit,
  } = useAddStock();

  const handleNavigateToHome = () => {
    // Try to go back if there's a previous screen, otherwise go to home
    if (router.canGoBack()) {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await originalHandleSubmit();
      setSuccessModalVisible(true);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to submit stock";
      setErrorMessage(msg);
      setErrorModalVisible(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Header title="Add Expected Stock" onBack={handleNavigateToHome} />

        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <View style={styles.formCard}>
            <Text style={styles.label}>{t("form.fruitType")}</Text>
            <RNPickerSelect
              onValueChange={(val) => updateField("fruit", val)}
              value={formData.fruit}
              placeholder={{ label: t("form.selectFruit"), value: null }}
              items={fruitItems}
              style={{
                inputIOS: styles.selectInput,
                inputAndroid: styles.selectInput,
                placeholder: { color: "#aaa" },
              }}
              useNativeAndroidPickerStyle={false}
            />

            <Text style={styles.label}>{t("form.category")}</Text>
            <RNPickerSelect
              onValueChange={(val) => updateField("category", val)}
              value={formData.category}
              placeholder={{ label: t("form.selectCategory"), value: null }}
              items={categoryItems}
              disabled={!formData.fruit}
              style={{
                inputIOS: [
                  styles.selectInput,
                  !formData.fruit && styles.selectDisabled,
                ],
                inputAndroid: [
                  styles.selectInput,
                  !formData.fruit && styles.selectDisabled,
                ],
                placeholder: { color: "#aaa" },
              }}
              useNativeAndroidPickerStyle={false}
            />

            <Text style={styles.label}>{t("form.expectedQuantity")}</Text>
            <View style={styles.quantityContainer}>
              <TextInput
                style={[styles.textInput, styles.quantityInput]}
                placeholder={t("form.enterQuantity")}
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

            <Text style={styles.label}>{t("form.grade")}</Text>
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

            <Text style={styles.label}>{t("form.estimatedHarvestDate")}</Text>
            <Text style={styles.helperText}>{t("form.selectDateRange")}</Text>
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
                {formData.estimatedDate || t("form.selectDate")}
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
                textColor={PRIMARY_GREEN}
                accentColor={PRIMARY_GREEN}
                onChange={handleDateChange}
              />
            )}
            {/* --- MULTIPLE IMAGE UPLOAD SECTION --- */}
            <Text style={styles.label}>Upload Photos (Optional, Max 10)</Text>
            <Text style={styles.helperText}>
              Add visuals to prove quality. ({formData.images.length}/10)
            </Text>

            <View style={styles.imageRow}>
              {/* 1. Add Button (Show only if < 10) */}
              {formData.images.length < 10 && (
                <TouchableOpacity
                  style={styles.addImageBox}
                  onPress={pickImage}
                >
                  <Ionicons name="camera-outline" size={32} color="#888" />
                  <Text style={styles.addImageText}>Add</Text>
                </TouchableOpacity>
              )}

              {/* 2. Horizontal List of Images */}
              <FlatList
                horizontal
                data={formData.images}
                keyExtractor={(_, index) => index.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 10 }}
                renderItem={({ item, index }) => (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: item }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.submitButtonFixed, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator
                  color="#fff"
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitText}>{t("form.submitting")}</Text>
              </View>
            ) : (
              <Text style={styles.submitText}>{t("form.submitStock")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <SuccessModal
          visible={successModalVisible}
          title="Stock Added Successfully"
          message="Your fruit stock has been added and is now available on the market."
          onClose={() => {
            setSuccessModalVisible(false);
            handleNavigateToHome();
          }}
          buttonText="OK"
        />

        <ErrorModal
          visible={errorModalVisible}
          title="Error"
          message={errorMessage}
          onClose={() => setErrorModalVisible(false)}
          buttonText="Try Again"
        />
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
  },
  label: { fontSize: 14, color: "#333", marginBottom: 8, marginTop: 20 },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
    fontStyle: "italic",
  },
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

  // --- Image Upload Styles (Updated for Multi) ---
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    height: 90, // Fixed height for horizontal list
  },
  addImageBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#f9f9f9",
  },
  addImageText: { fontSize: 12, color: "#888", marginTop: 4 },
  imagePreviewContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#eee",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  removeButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
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
  skeletonButton: {
    height: 56,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 27,
    marginHorizontal: 16,
  },
  skeletontabDivider: { borderLeftWidth: 1, borderLeftColor: LIGHT_GRAY },
});
