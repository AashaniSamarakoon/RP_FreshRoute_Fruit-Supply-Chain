import { BuyerColors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Truck,
  MapPin,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
} from "lucide-react-native";

const INTRO_SEEN_KEY = "intro_seen";

export default function OnboardingTwoScreen() {
  const router = useRouter();
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;
  const flowOpacity = useRef(new Animated.Value(0)).current;
  const flowTranslate = useRef(new Animated.Value(20)).current;
  const featureOpacity = useRef(new Animated.Value(0)).current;
  const featureTranslate = useRef(new Animated.Value(20)).current;

  const handleStart = async () => {
    await AsyncStorage.setItem(INTRO_SEEN_KEY, "true");
    router.replace("/login" as any);
  };

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(flowOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(flowTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(featureOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(featureTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, [cardOpacity, cardTranslate, flowOpacity, flowTranslate, featureOpacity, featureTranslate]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom", "left", "right"]}>
      <View style={styles.bg}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
        <View style={[styles.shape, styles.shape4]} />
        <View style={[styles.shape, styles.shape5]} />
        <View style={[styles.shape, styles.shape6]} />
        <View style={[styles.blob, styles.b1]} />
        <View style={[styles.blob, styles.b2]} />
        <View style={[styles.blob, styles.b3]} />
        <View style={[styles.rect, styles.r1]} />
        <View style={[styles.rect, styles.r2]} />
        <View style={[styles.rect, styles.r3]} />
        <View style={[styles.strip, styles.st1]} />
        <View style={[styles.strip, styles.st2]} />
      </View>

      <View style={styles.pageIndicator}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <Text style={styles.pageText}>2 of 2</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslate }],
            },
          ]}
        >
          <View style={styles.iconRow}>
            <View style={styles.iconWrap}>
              <Truck size={28} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.iconWrap}>
              <MapPin size={28} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
          </View>
          <Text style={styles.title}>Track & deliver with care</Text>
          <Text style={styles.subtitle}>
            Transporters pick up and deliver your order. Follow the journey on the map, get quality verified at delivery, and raise issues anytime—we help resolve them fast.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.flowBlock,
            {
              opacity: flowOpacity,
              transform: [{ translateY: flowTranslate }],
            },
          ]}
        >
          <Text style={styles.flowTitle}>From pickup to delivery</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <PackageCheck size={18} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Pickup & grade</Text>
              <Text style={styles.stepDetail}>Fruit is graded at source; only quality produce moves forward.</Text>
            </View>
          </View>
          <View style={styles.connector} />
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Truck size={18} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>On the road</Text>
              <Text style={styles.stepDetail}>Real-time tracking and temperature monitoring en route.</Text>
            </View>
          </View>
          <View style={styles.connector} />
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <ShieldCheck size={18} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Verify at delivery</Text>
              <Text style={styles.stepDetail}>Quality checked again at your door; raise complaints if needed.</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.featureBlock,
            {
              opacity: featureOpacity,
              transform: [{ translateY: featureTranslate }],
            },
          ]}
        >
          <Text style={styles.featureTitle}>On the road</Text>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Real-time delivery tracking</Text>
              <Text style={styles.featureDetail}>See your order on the map until it arrives at your door.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Quality checks & grading</Text>
              <Text style={styles.featureDetail}>Fruit graded at pickup and at delivery for peace of mind.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Temperature monitoring</Text>
              <Text style={styles.featureDetail}>Alerts if conditions go out of range—freshness assured.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Support when you need it</Text>
              <Text style={styles.featureDetail}>Raise issues with proof; we help resolve them quickly.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>Get started</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BuyerColors.background },
  bg: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  shape: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: BuyerColors.primaryGreen,
  },
  shape1: { width: 200, height: 200, bottom: -40, right: -60, opacity: 0.08 },
  shape2: { width: 140, height: 140, top: 100, right: -30, opacity: 0.06 },
  shape3: { width: 260, height: 260, top: 220, left: -100, opacity: 0.05 },
  shape4: { width: 80, height: 80, bottom: 240, left: 24, opacity: 0.1 },
  shape5: { width: 130, height: 130, top: 40, right: 20, opacity: 0.07 },
  shape6: { width: 50, height: 50, bottom: 320, right: 100, opacity: 0.09 },
  blob: { position: "absolute", backgroundColor: BuyerColors.primaryGreen, opacity: 0.04 },
  b1: { width: 280, height: 150, borderRadius: 75, bottom: -30, left: -100 },
  b2: { width: 140, height: 80, borderRadius: 40, top: 180, right: -40 },
  b3: { width: 200, height: 110, borderRadius: 55, top: 380, left: -60 },
  rect: { position: "absolute", backgroundColor: BuyerColors.primaryGreen },
  r1: { width: 100, height: 160, borderRadius: 20, top: 160, right: -30, opacity: 0.06 },
  r2: { width: 140, height: 80, borderRadius: 18, bottom: 200, left: -50, opacity: 0.05 },
  r3: { width: 60, height: 140, borderRadius: 14, top: 480, right: 40, opacity: 0.04 },
  strip: { position: "absolute", backgroundColor: BuyerColors.primaryGreen },
  st1: { width: 240, height: 18, borderRadius: 9, top: 340, right: -80, opacity: 0.05 },
  st2: { width: 180, height: 14, borderRadius: 7, bottom: 160, left: -50, opacity: 0.06 },
  pageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(46, 125, 50, 0.25)" },
  dotActive: { backgroundColor: BuyerColors.primaryGreen, width: 10, height: 10, borderRadius: 5 },
  pageText: { fontSize: 12, color: BuyerColors.textGray, marginLeft: 4, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 28, paddingTop: 20, paddingBottom: 28 },
  card: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.08)",
  },
  iconRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: BuyerColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: BuyerColors.textBlack, marginBottom: 10 },
  subtitle: { fontSize: 15, color: BuyerColors.textGray, lineHeight: 22 },
  flowBlock: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.07)",
  },
  flowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BuyerColors.primaryGreen,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  stepRow: { flexDirection: "row", alignItems: "flex-start" },
  stepNum: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: BuyerColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stepContent: { flex: 1 },
  stepLabel: { fontSize: 15, fontWeight: "700", color: BuyerColors.textBlack, marginBottom: 2 },
  stepDetail: { fontSize: 13, color: BuyerColors.textGray, lineHeight: 18 },
  connector: {
    width: 2,
    height: 16,
    backgroundColor: "rgba(46, 125, 50, 0.2)",
    marginLeft: 19,
    marginVertical: 6,
  },
  featureBlock: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(46, 125, 50, 0.06)",
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: BuyerColors.primaryGreen,
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  featureRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 16 },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BuyerColors.primaryGreen,
    marginRight: 12,
    marginTop: 6,
    opacity: 0.9,
  },
  featureContent: { flex: 1 },
  featureText: { fontSize: 15, color: BuyerColors.textBlack, fontWeight: "600" },
  featureDetail: { fontSize: 13, color: BuyerColors.textGray, marginTop: 2, lineHeight: 18 },
  footer: { paddingHorizontal: 28, paddingBottom: 32 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 18,
    borderRadius: 14,
  },
  startBtnText: { fontSize: 18, fontWeight: "800", color: "#fff" },
});
