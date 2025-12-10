import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface VerificationResult {
  imageUri: string;
  detectedGrade: string;
  confidence?: number;
}

export default function VerificationResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [farmerGrade, setFarmerGrade] = useState<string>("");
  const [isMatch, setIsMatch] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const paramsProcessed = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        if (user.role !== "transporter") {
          router.replace("/transporter");
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated || checkingAuth || paramsProcessed.current) return;

    try {
      const errorParam = params.error;
      const resultsParam = params.results;
      const farmerGradeParam = params.farmerGrade;

      if (errorParam === "true") {
        setHasError(true);
        paramsProcessed.current = true;
        return;
      }

      if (!resultsParam) {
        // Wait for params to be available
        return;
      }

      const resultsData = JSON.parse(resultsParam as string);
      const farmerGradeData = (farmerGradeParam as string) || "Grade A";

      setResults(resultsData);
      setFarmerGrade(farmerGradeData);

      // Check if all detected grades match farmer's declared grade
      const allMatch = resultsData.every(
        (result: VerificationResult) => result.detectedGrade === farmerGradeData
      );
      setIsMatch(allMatch);
      paramsProcessed.current = true;
    } catch (error) {
      console.error("Error parsing results:", error);
      setHasError(true);
      paramsProcessed.current = true;
    }
  }, [isAuthenticated, checkingAuth, params.error, params.results, params.farmerGrade]);

  const handleContinue = () => {
    router.push("/transporter/final-order");
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#e53e3e" />
          <Text style={styles.errorTitle}>Verification Failed</Text>
          <Text style={styles.errorText}>
            An error occurred during verification. Please try again.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verification Results</Text>

        <View style={styles.comparisonContainer}>
          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>Farmer's Declared Grade:</Text>
            <Text style={styles.comparisonValue}>{farmerGrade}</Text>
          </View>
          <View style={styles.comparisonGradesContainer}>
            <Text style={styles.comparisonLabel}>AI Detected Grades:</Text>
            <View style={styles.gradesContainer}>
              {results.map((r, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.gradeBadge,
                    idx >= 4 ? styles.gradeBadgeSecondRow : null,
                  ]}
                >
                  <Text style={styles.gradeBadgeFruitNumber}>{idx + 1}</Text>
                  <Text style={styles.gradeBadgeText}>{r.detectedGrade}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.gridContainer}>
          {results.map((result, index) => (
            <View
              key={index}
              style={[
                styles.imageCard,
                index === results.length - 1 && results.length % 2 !== 0
                  ? styles.imageCardCentered
                  : null,
              ]}
            >
              <Image
                source={{ uri: result.imageUri }}
                style={styles.resultImage}
              />
              <Text style={styles.gradeLabel}>Fruit {index + 1}</Text>
              <Text
                style={[
                  styles.gradeValue,
                  result.detectedGrade === farmerGrade
                    ? styles.gradeMatch
                    : styles.gradeMismatch,
                ]}
              >
                {result.detectedGrade}
              </Text>
            </View>
          ))}
        </View>

        {isMatch ? (
          <View style={styles.matchContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#2f855a" />
            <Text style={styles.matchText}>
              All AI-verified grades match the farmer&apos;s declared grade ({farmerGrade})
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mismatchContainer}>
            <Ionicons name="warning" size={64} color="#e53e3e" />
            <Text style={styles.mismatchText}>
              Grade mismatch detected. Some AI-verified grades do not match the farmer&apos;s declared grade ({farmerGrade}).
            </Text>
            <TouchableOpacity
              style={styles.continueButtonWarning}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  comparisonContainer: {
    backgroundColor: "#f5f5f5",
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
  },
  comparisonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  comparisonLabel: {
    fontSize: 14,
    color: "#666",
    flexShrink: 0,
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#11181C",
    flexShrink: 1,
    marginLeft: 8,
  },
  comparisonGradesContainer: {
    marginTop: 4,
  },
  gradesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  gradeBadge: {
    backgroundColor: "#e5f3ed",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2f855a",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    width: "23%",
    minWidth: 70,
  },
  gradeBadgeSecondRow: {
    marginLeft: "auto",
    marginRight: "auto",
  },
  gradeBadgeFruitNumber: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  gradeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2f855a",
  },
  matchContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f0f9f4",
    borderRadius: 10,
    marginTop: 8,
  },
  matchText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#2f855a",
    fontWeight: "600",
    textAlign: "center",
  },
  mismatchContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    marginTop: 8,
  },
  mismatchText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: "#e53e3e",
    fontWeight: "600",
    textAlign: "center",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    marginBottom: 16,
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
  imageCardCentered: {
    marginRight: "auto",
    marginLeft: "26%",
  },
  resultImage: {
    width: "100%",
    height: 140,
    borderRadius: 8,
    marginBottom: 12,
  },
  gradeLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  gradeMatch: {
    color: "#2f855a",
  },
  gradeMismatch: {
    color: "#e53e3e",
  },
  continueButton: {
    backgroundColor: "#2f855a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  continueButtonWarning: {
    backgroundColor: "#e53e3e",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e53e3e",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#2f855a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 200,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

