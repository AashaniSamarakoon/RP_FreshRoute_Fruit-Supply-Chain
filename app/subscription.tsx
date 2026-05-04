import {
  isPayHereSdkAvailable,
  isRunningInExpoGo,
  PAYHERE_IS_SANDBOX,
  startPayHerePaymentObject,
} from "@/services/payhereService";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { parseApiError, proApi } from "../services/proApi";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

function getEnvNumber(name: string, fallback: number): number {
  const raw = (process.env as any)?.[name];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const redirect = useMemo(() => {
    const raw = Array.isArray(params.redirect) ? params.redirect[0] : params.redirect;
    return (raw && String(raw)) || "/farmer/forecast";
  }, [params.redirect]);

  const priceLkr = getEnvNumber("EXPO_PUBLIC_PRO_PLAN_PRICE_LKR", 990);
  const durationDays = getEnvNumber("EXPO_PUBLIC_PRO_PLAN_DURATION_DAYS", 30);

  const [checking, setChecking] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await proApi.getStatus();
        const pro = !!status.isPro;
        if (!cancelled) setIsPro(pro);
      } catch (e) {
        const parsed = parseApiError(e);
        if (parsed.endpointMissing) {
          console.warn(
            "[Subscription] Pro endpoints missing",
            parsed.endpointMissing.tried || parsed.text || e,
          );
        } else {
          console.warn("[Subscription] status check failed", parsed.json || parsed.text || e);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = () => {
    router.replace(redirect as any);
  };

  const handlePurchase = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Unavailable",
        "Pro plan purchase is available on Android/iOS builds.",
      );
      return;
    }

    if (isRunningInExpoGo()) {
      Alert.alert(
        "PayHere not supported",
        "PayHere payments do not work in Expo Go. Please run an EAS Dev Build/Dev Client or a production build.",
      );
      return;
    }

    if (!isPayHereSdkAvailable()) {
      Alert.alert(
        "PayHere not available",
        "PayHere payments require a Dev Build/Dev Client and proper native linking.",
      );
      return;
    }

    setPurchasing(true);
    try {
      const init = await proApi.subscribeInit();
      const paymentObject = init.paymentObject;

      if (!paymentObject || typeof paymentObject !== "object") {
        throw new Error("Subscription init did not return a valid PayHere payment payload");
      }

      // Get user ID for order_id generation
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Generate order_id if missing: PRO_<userId>_<uuid>
      const generateOrderId = () => {
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        return `PRO_${userId}_${uuid}`;
      };

      // Ensure sandbox flag is set consistently.
      const paymentWithSandbox = {
        ...paymentObject,
        sandbox: PAYHERE_IS_SANDBOX,
        merchant_id: process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_ID,
        order_id: paymentObject.order_id || generateOrderId(),
      };

      // Validate required PayHere fields
      const requiredFields = [
        'merchant_id', 'order_id', 'items', 'amount', 'currency', 'hash',
        'notify_url', 'first_name', 'last_name', 'email', 'phone',
        'address', 'city', 'country'
      ];
      for (const field of requiredFields) {
        if (!(field in paymentWithSandbox)) {
          Alert.alert("Error", `Invalid payment configuration: missing ${field}`);
          setPurchasing(false);
          return;
        }
      }

      startPayHerePaymentObject(
        paymentWithSandbox,
        async (_paymentId) => {
          try {
            // Wait briefly for backend webhook/verification to activate Pro.
            const startedAt = Date.now();
            const maxWaitMs = 20_000;
            const pollIntervalMs = 2_000;

            while (Date.now() - startedAt < maxWaitMs) {
              const status = await proApi.getStatus();
              if (status.isPro) {
                Alert.alert("Success", "You are now a Pro user!");
                router.replace(redirect as any);
                return;
              }
              await new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));
            }

            Alert.alert(
              "Payment received",
              "Thanks! Your Pro status is still being confirmed. Please wait a moment and try again.",
            );
          } catch (e: any) {
            Alert.alert(
              "Payment received",
              e?.message || "Thanks! Please try again in a moment to refresh your Pro status.",
            );
          } finally {
            setPurchasing(false);
          }
        },
        (error) => {
          setPurchasing(false);
          Alert.alert("Payment failed", error || "Unknown error");
        },
        () => {
          setPurchasing(false);
        },
      );
    } catch (e: any) {
      setPurchasing(false);
      const parsed = parseApiError(e);
      if (parsed.endpointMissing) {
        Alert.alert(
          "Pro temporarily unavailable",
          "Your server does not expose the Pro subscription endpoints yet. Please check the backend deployment.",
        );
      } else {
        Alert.alert("Error", parsed.json?.message || e?.message || String(e));
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pro Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      {checking ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="sparkles" size={14} color={PRIMARY_GREEN} />
                <Text style={styles.badgeText}>Personal Market Forecast</Text>
              </View>
              {isPro ? (
                <View style={[styles.badge, styles.badgePro]}>
                  <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  <Text style={[styles.badgeText, { color: "#fff" }]}>Active</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.titleRow}>
              <Ionicons name="star" size={24} color={PRIMARY_GREEN} />
              <Text style={styles.title}>Upgrade to Pro</Text>
            </View>
            <Text style={styles.subtitle}>
              Get personalized forecasts using your crops plus live market prices, with clear graphs and actionable hints.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Ionicons name="analytics" size={18} color={PRIMARY_GREEN} />
                <Text style={styles.featureText}>7-day price forecast per crop</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="trending-up" size={18} color={PRIMARY_GREEN} />
                <Text style={styles.featureText}>Live market price comparison</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons name="bulb" size={18} color={PRIMARY_GREEN} />
                <Text style={styles.featureText}>Personal hints (best selling days)</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.price}>Rs. {priceLkr.toLocaleString()}</Text>
              <Text style={styles.priceHint}>/ {durationDays} days</Text>
            </View>

            {isPro ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={handleContinue}>
                <Text style={styles.primaryBtnText}>Go to Personal Forecast</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryBtn, purchasing && { opacity: 0.7 }]}
                onPress={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Subscribe & Unlock</Text>
                    <Ionicons name="card" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryBtnText}>Not now</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footnote}>
            Note: Pro activation is linked to your account and may take a moment after payment.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export const options = { headerShown: false };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  headerBtn: { padding: 8, marginHorizontal: -8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 28 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgePro: { backgroundColor: PRIMARY_GREEN },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#111827" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  subtitle: {
    marginBottom: 20,
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 22,
  },
  featureList: { marginBottom: 20 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  featureText: { fontSize: 16, color: "#374151", flex: 1 },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    marginBottom: 20,
  },
  price: { fontSize: 28, fontWeight: "800", color: PRIMARY_GREEN },
  priceHint: { fontSize: 16, color: "#6b7280", marginLeft: 4 },
  primaryBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 20,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  secondaryBtnText: { color: "#6b7280", fontSize: 16, fontWeight: "600" },
  footnote: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 16,
  },
});
