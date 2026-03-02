import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { BACKEND_URL } from "../../../config";
import { BuyerColors } from "../../../constants/theme";

type GradingImage = {
  id: number;
  image_base64: string;
  predicted_grade: string;
  accuracy: number;
  sequence: number;
  created_at: string;
};

type Grading = {
  grading_id: string;
  job_id: string;
  order_id: string;
  created_at: string;
  images: GradingImage[];
  images_count: number;
};

type GradingsResponse = {
  success: boolean;
  message: string;
  order_id: string;
  gradings: Grading[];
  total_gradings: number;
};

type ReVerifyResult = {
  detectedGrade: string;
  confidence: number;
};

function formatGrade(s: string): string {
  return (s || "").replace(/_/g, " ").trim() || "—";
}

export default function OrderGradingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId: string; farmerGrade?: string }>();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gradings, setGradings] = useState<Grading[]>([]);
  const [farmerGrade, setFarmerGrade] = useState<string>("Grade A");
  const [reVerifyResults, setReVerifyResults] = useState<ReVerifyResult[] | null>(null);
  const [verifyAgainLoading, setVerifyAgainLoading] = useState(false);
  const [showVerifyAgainConfirm, setShowVerifyAgainConfirm] = useState(false);

  const fetchGradings = useCallback(async () => {
    if (!orderId) {
      setError("Order ID is required");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
      const res = await fetch(`${BACKEND_URL}/api/buyer/gradings/${orderId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: GradingsResponse = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any).message || `Request failed (${res.status})`);
        setGradings([]);
        setLoading(false);
        return;
      }

      if (data.success && data.gradings) {
        setGradings(data.gradings);
        // Farmer provided grade hardcoded as Grade A
      } else {
        setGradings([]);
      }
    } catch (e) {
      setError("Failed to load gradings");
      setGradings([]);
    } finally {
      setLoading(false);
    }
  }, [orderId, params.farmerGrade, router]);

  useEffect(() => {
    fetchGradings();
  }, [fetchGradings]);

  const handleVerifyAgain = async () => {
    const grading = gradings[0];
    if (!grading?.images?.length) {
      Alert.alert("No images", "No grading images to verify again.");
      return;
    }

    setVerifyAgainLoading(true);
    setReVerifyResults(null);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const formData = new FormData();
      grading.images
        .sort((a, b) => a.sequence - b.sequence)
        .forEach((img, i) => {
          const uri = img.image_base64.startsWith("data:")
            ? img.image_base64
            : `data:image/jpeg;base64,${img.image_base64}`;
          formData.append("images", {
            uri,
            type: "image/jpeg",
            name: `img_${i + 1}.jpg`,
          } as any);
        });

      const response = await fetch(`${BACKEND_URL}/api/fruit-grading/predict`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error((errData as any).message || "Verification failed");
      }

      const data = await response.json();
      if (!data.success || !Array.isArray(data.predictions)) {
        throw new Error("Invalid response from server");
      }

      const results: ReVerifyResult[] = data.predictions.map((p: any) => ({
        detectedGrade: (p.predictedClass || "").replace(/_/g, " ").trim() || "—",
        confidence: p.confidence ?? 0,
      }));
      setReVerifyResults(results);
    } catch (e) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to verify again. Try later."
      );
    } finally {
      setVerifyAgainLoading(false);
    }
  };

  const handleBack = () => router.back();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Orders" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading gradings…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Orders" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color="#e53e3e" />
          <Text style={styles.errorTitle}>Could not load gradings</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const grading = gradings[0];
  const images = grading?.images?.sort((a, b) => a.sequence - b.sequence) ?? [];

  if (gradings.length === 0 || images.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Orders" onBack={handleBack} />
        <View style={styles.centerContainer}>
          <Ionicons name="images-outline" size={64} color="#999" />
          <Text style={styles.emptyTitle}>No grading images</Text>
          <Text style={styles.emptyText}>
            No gradings found for this order.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleBack}>
            <Text style={styles.primaryButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const farmerGradeDisplay = formatGrade(farmerGrade);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Orders" onBack={handleBack} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Farmer provided grade:</Text>
            <Text style={styles.comparisonValue}>{farmerGradeDisplay}</Text>
          </View>
          <View style={styles.comparisonGradesContainer}>
            <Text style={styles.comparisonLabel}>Verified grades:</Text>
            <View style={styles.gradesContainer}>
              {images.map((img, idx) => (
                <View key={img.id} style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeFruitNumber}>{idx + 1}</Text>
                  <Text style={styles.gradeBadgeText}>
                    {formatGrade(img.predicted_grade)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {images.map((img, index) => (
            <View
              key={img.id}
              style={[
                styles.imageCard,
                index === images.length - 1 && images.length % 2 !== 0
                  ? styles.imageCardCentered
                  : null,
              ]}
            >
              <Image
                source={{
                  uri: img.image_base64.startsWith("data:")
                    ? img.image_base64
                    : `data:image/jpeg;base64,${img.image_base64}`,
                }}
                style={styles.resultImage}
              />
              <Text style={styles.gradeLabel}>Fruit {index + 1}</Text>
              <Text style={[styles.gradeValue, styles.gradeMatch]}>
                {formatGrade(img.predicted_grade)} ({img.accuracy}%)
              </Text>
              {reVerifyResults && reVerifyResults[index] && (
                <View style={styles.newResultBox}>
                  <Text style={styles.newResultLabel}>New verification:</Text>
                  <Text style={styles.newResultValue}>
                    {reVerifyResults[index].detectedGrade} (
                    {reVerifyResults[index].confidence}%)
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyAgainButton, verifyAgainLoading && styles.buttonDisabled]}
          onPress={() => setShowVerifyAgainConfirm(true)}
          disabled={verifyAgainLoading}
        >
          {verifyAgainLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.verifyAgainButtonText}>Not sure? Verify again</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation popup before re-verify */}
      {showVerifyAgainConfirm && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmPopup}>
            <Text style={styles.confirmTitle}>Re-verify grades?</Text>
            <Text style={styles.confirmMessage}>
              Unsure about the verifications? You can use the same model and re-verify the grades. New results will be shown under each image and are not saved.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => setShowVerifyAgainConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmReverifyButton}
                onPress={() => {
                  setShowVerifyAgainConfirm(false);
                  handleVerifyAgain();
                }}
              >
                <Text style={styles.confirmReverifyText}>Re verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#666" },
  errorTitle: { fontSize: 20, fontWeight: "bold", color: "#e53e3e", marginTop: 16, textAlign: "center" },
  errorText: { fontSize: 16, color: "#666", marginTop: 8, textAlign: "center" },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#333", marginTop: 16 },
  emptyText: { fontSize: 16, color: "#666", marginTop: 8, textAlign: "center" },
  primaryButton: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 24,
  },
  primaryButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  comparisonContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
  },
  comparisonRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  comparisonLabel: { fontSize: 14, color: "#666", flexShrink: 0 },
  comparisonValue: { fontSize: 14, fontWeight: "bold", color: "#11181C", marginLeft: 8 },
  comparisonGradesContainer: { marginTop: 4 },
  gradesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
    gap: 10,
  },
  gradeBadge: {
    backgroundColor: "#e5f3ed",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2f855a",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    width: "30%",
    minWidth: 90,
  },
  gradeBadgeFruitNumber: { fontSize: 12, fontWeight: "500", color: "#666" },
  gradeBadgeText: { fontSize: 14, fontWeight: "600", color: "#2f855a" },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 24,
  },
  imageCard: {
    width: "48%",
    marginBottom: 16,
    marginRight: "2%",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  imageCardCentered: { marginRight: "auto", marginLeft: "26%" },
  resultImage: { width: "100%", height: 140, borderRadius: 8, marginBottom: 8 },
  gradeLabel: { fontSize: 12, color: "#666", marginBottom: 4, fontWeight: "500" },
  gradeValue: { fontSize: 16, fontWeight: "bold" },
  gradeMatch: { color: "#2f855a" },
  newResultBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    width: "100%",
    alignItems: "center",
  },
  newResultLabel: { fontSize: 11, color: "#666", marginBottom: 2 },
  newResultValue: { fontSize: 14, fontWeight: "600", color: "#3182ce" },

  verifyAgainButton: {
    backgroundColor: "#2f855a",
    padding: 16,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  verifyAgainButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  confirmOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  confirmPopup: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    maxWidth: 360,
    width: "100%",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmMessage: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  confirmCancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#e2e8f0",
  },
  confirmCancelText: { fontSize: 15, fontWeight: "600", color: "#4a5568" },
  confirmReverifyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#2f855a",
  },
  confirmReverifyText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
