import { BuyerColors } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Leaf } from "lucide-react-native";

export default function LandingScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const t = setTimeout(() => router.replace("/onboarding-one" as any), 2000);
    return () => clearTimeout(t);
  }, [router]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.bg}>
        <View style={[styles.shape, styles.s1]} />
        <View style={[styles.shape, styles.s2]} />
        <View style={[styles.shape, styles.s3]} />
        <View style={[styles.shape, styles.s4]} />
        <View style={[styles.shape, styles.s5]} />
        <View style={[styles.shape, styles.s6]} />
        <View style={[styles.shape, styles.s7]} />
        <View style={[styles.blob, styles.b1]} />
        <View style={[styles.blob, styles.b2]} />
        <View style={[styles.blob, styles.b3]} />
        <View style={[styles.rect, styles.r1]} />
        <View style={[styles.rect, styles.r2]} />
        <View style={[styles.strip, styles.st1]} />
        <View style={[styles.strip, styles.st2]} />
      </View>
      <Animated.View
        style={[
          styles.centered,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoBox}>
          <Leaf size={64} color={BuyerColors.primaryGreen} strokeWidth={1.8} />
        </View>
        <Text style={styles.brand}>FreshRoute</Text>
        <Text style={styles.tagline}>From farm to you</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BuyerColors.background },
  bg: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  shape: { position: "absolute", borderRadius: 9999, backgroundColor: BuyerColors.primaryGreen },
  s1: { width: 280, height: 280, top: -80, right: -100, opacity: 0.08 },
  s2: { width: 180, height: 180, bottom: 120, left: -60, opacity: 0.06 },
  s3: { width: 120, height: 120, bottom: 280, right: 40, opacity: 0.1 },
  s4: { width: 200, height: 200, top: 200, left: -70, opacity: 0.05 },
  s5: { width: 90, height: 90, top: 100, right: 60, opacity: 0.12 },
  s6: { width: 150, height: 150, bottom: 40, right: -40, opacity: 0.07 },
  s7: { width: 70, height: 70, top: 320, left: 30, opacity: 0.09 },
  blob: { position: "absolute", backgroundColor: BuyerColors.primaryGreen, opacity: 0.04 },
  b1: { width: 300, height: 160, borderRadius: 80, top: 400, right: -120 },
  b2: { width: 180, height: 100, borderRadius: 50, bottom: 200, left: -60 },
  b3: { width: 220, height: 120, borderRadius: 60, top: 80, left: -80 },
  rect: { position: "absolute", backgroundColor: BuyerColors.primaryGreen },
  r1: { width: 140, height: 200, borderRadius: 24, top: 150, right: -40, opacity: 0.06 },
  r2: { width: 100, height: 160, borderRadius: 20, bottom: 180, left: -30, opacity: 0.05 },
  strip: { position: "absolute", backgroundColor: BuyerColors.primaryGreen },
  st1: { width: 320, height: 24, borderRadius: 12, top: 280, left: -80, opacity: 0.04 },
  st2: { width: 200, height: 16, borderRadius: 8, bottom: 320, right: -60, opacity: 0.05 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logoBox: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: BuyerColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "rgba(46, 125, 50, 0.2)",
  },
  brand: { fontSize: 36, fontWeight: "800", color: BuyerColors.textBlack, letterSpacing: 0.5 },
  tagline: { fontSize: 16, color: BuyerColors.textGray, marginTop: 8, fontWeight: "500" },
});
