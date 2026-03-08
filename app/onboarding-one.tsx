import { BuyerColors } from "@/constants/theme";
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
import { Leaf, ArrowRight, ShoppingBag, CreditCard, Package } from "lucide-react-native";

export default function OnboardingOneScreen() {
  const router = useRouter();
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(24)).current;
  const flowOpacity = useRef(new Animated.Value(0)).current;
  const flowTranslate = useRef(new Animated.Value(20)).current;
  const featureOpacity = useRef(new Animated.Value(0)).current;
  const featureTranslate = useRef(new Animated.Value(20)).current;

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
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <Text style={styles.pageText}>1 of 2</Text>
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
          <View style={styles.iconWrap}>
            <Leaf size={32} color={BuyerColors.primaryGreen} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Connect farm to table</Text>
          <Text style={styles.subtitle}>
            Farmers list produce by grade and location. Buyers see matched options and place orders with transparent pricing—no guesswork, just fresh supply you can trust.
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
          <Text style={styles.flowTitle}>How it works</Text>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <ShoppingBag size={18} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Browse & match</Text>
              <Text style={styles.stepDetail}>See available fruit by grade and location; filter to what you need.</Text>
            </View>
          </View>
          <View style={styles.connector} />
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <CreditCard size={18} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Order & pay</Text>
              <Text style={styles.stepDetail}>Place your order with clear FreshRoute pricing; pay securely.</Text>
            </View>
          </View>
          <View style={styles.connector} />
          <View style={styles.stepRow}>
            <View style={styles.stepNum}>
              <Package size={18} color={BuyerColors.primaryGreen} strokeWidth={2} />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>Receive</Text>
              <Text style={styles.stepDetail}>Track delivery; quality is verified at pickup and at your door.</Text>
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
          <Text style={styles.featureTitle}>What you get</Text>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Smart matching by grade & location</Text>
              <Text style={styles.featureDetail}>Best offers aligned to your requirements and region.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Transparent FreshRoute pricing</Text>
              <Text style={styles.featureDetail}>Daily prices by fruit and grade—no hidden fees.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Secure orders and payments</Text>
              <Text style={styles.featureDetail}>Pay safely; every order tracked from farm to you.</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureDot} />
            <View style={styles.featureContent}>
              <Text style={styles.featureText}>Direct farmer–buyer link</Text>
              <Text style={styles.featureDetail}>Fewer middlemen, fairer deals, fresher produce.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.replace("/onboarding-two" as any)}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Next</Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BuyerColors.background },
  bg: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  shape: { position: "absolute", borderRadius: 9999, backgroundColor: BuyerColors.primaryGreen },
  shape1: { width: 240, height: 240, top: -60, left: -80, opacity: 0.07 },
  shape2: { width: 160, height: 160, bottom: 200, right: -50, opacity: 0.08 },
  shape3: { width: 100, height: 100, top: 180, right: 30, opacity: 0.1 },
  shape4: { width: 180, height: 180, top: 340, left: -50, opacity: 0.05 },
  shape5: { width: 60, height: 60, bottom: 280, right: 80, opacity: 0.09 },
  shape6: { width: 130, height: 130, bottom: 60, left: 20, opacity: 0.06 },
  blob: { position: "absolute", backgroundColor: BuyerColors.primaryGreen, opacity: 0.04 },
  b1: { width: 260, height: 140, borderRadius: 70, bottom: -20, right: -100 },
  b2: { width: 160, height: 90, borderRadius: 45, top: 120, right: -50 },
  b3: { width: 200, height: 110, borderRadius: 55, top: 420, left: -70, opacity: 0.035 },
  rect: { position: "absolute", backgroundColor: BuyerColors.primaryGreen },
  r1: { width: 120, height: 180, borderRadius: 22, top: 200, right: -35, opacity: 0.06 },
  r2: { width: 80, height: 120, borderRadius: 16, bottom: 240, left: -25, opacity: 0.05 },
  r3: { width: 160, height: 60, borderRadius: 30, top: 520, right: -50, opacity: 0.04 },
  strip: { position: "absolute", backgroundColor: BuyerColors.primaryGreen },
  st1: { width: 280, height: 20, borderRadius: 10, top: 300, left: -60, opacity: 0.05 },
  st2: { width: 140, height: 12, borderRadius: 6, bottom: 140, right: -40, opacity: 0.06 },
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
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: BuyerColors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextBtnText: { fontSize: 17, fontWeight: "700", color: "#fff" },
});
