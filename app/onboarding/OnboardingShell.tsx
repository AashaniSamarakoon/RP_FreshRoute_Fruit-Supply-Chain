import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// height of our fixed header area (status bar + row)
export const HEADER_HEIGHT = 44;

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useOnboarding } from "./OnboardingContext";

interface OnboardingShellProps {
  children: React.ReactNode;
  step?: number;
  footer?: React.ReactNode;
  hideBack?: boolean; // when true, back button is omitted (e.g. first/terminal steps)
}

// A simple wrapper that provides a consistent header and footer for all
// onboarding screens.  Individual steps just supply the body content and
// optionally a button group via the ``footer`` prop.
export default function OnboardingShell({
  children,
  step,
  footer,
  hideBack,
}: OnboardingShellProps) {
  const router = useRouter();
  const { farmerData, buyerData } = useOnboarding();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {!hideBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        {step != null && (
          <>
            <View style={styles.progressContainer}>
              {[1, 2, 3].map((n) => (
                <View
                  key={n}
                  style={[
                    styles.progressSegment,
                    n <= step ? styles.progressActive : styles.progressInactive,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.stepText}>Step {step}</Text>
          </>
        )}
      </View>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      {footer && <View style={styles.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 44,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  backButton: { marginRight: 16, padding: 4 },
  stepText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  progressContainer: { flexDirection: "row", flex: 1, gap: 6, marginRight: 16 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: "#2E7D32" },
  progressInactive: { backgroundColor: "#E5E7EB" },
  container: {
    paddingHorizontal: 24,
    paddingTop: HEADER_HEIGHT + 20,
    paddingBottom: 120,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
});
