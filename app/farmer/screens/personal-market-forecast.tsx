import api from "@/services/api";
import { logger } from "@/utils/logger";
import { parseApiError, proApi } from "@/services/proApi";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ForecastPriceChart, {
    type ForecastPoint,
} from "../components/ForecastPriceChart";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

type CropForecast = {
  id: string;
  name: string;
  series: ForecastPoint[];
  marketSeries?: ForecastPoint[];
  liveToday?: number;
  unit?: string;
  hints: string[];
};

function formatCurrencyLkr(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString();
}

function computeBestPoint(series: ForecastPoint[]):
  | { idx: number; point: ForecastPoint }
  | null {
  if (!series || series.length === 0) return null;
  let bestIdx = 0;
  let bestVal = Number(series[0]?.value);
  if (!Number.isFinite(bestVal)) bestVal = -Infinity;

  series.forEach((p, idx) => {
    const v = Number(p.value);
    if (Number.isFinite(v) && v > bestVal) {
      bestVal = v;
      bestIdx = idx;
    }
  });

  const point = series[bestIdx];
  return point ? { idx: bestIdx, point } : null;
}

function computeTrend(series: ForecastPoint[]):
  | { direction: "up" | "down" | "flat"; pct: number }
  | null {
  if (!series || series.length < 2) return null;
  const first = Number(series[0]?.value);
  const last = Number(series[series.length - 1]?.value);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
  const pct = ((last - first) / Math.abs(first)) * 100;
  const abs = Math.abs(pct);
  const direction: "up" | "down" | "flat" = abs < 1 ? "flat" : pct > 0 ? "up" : "down";
  return { direction, pct };
}

type FreshRoutePriceLookup = {
  normalizedName: string;
  price: number;
  unit: string;
};

function normalizeName(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

function titleizeFruitKey(key: string): string {
  // keys like "mango" -> "Mango"; leaves already titled names unchanged.
  const cleaned = (key || "").trim();
  if (!cleaned) return cleaned;
  if (/[A-Z]/.test(cleaned)) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function parsePrimaryCrops(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      // ignore
    }
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

async function loadFarmerPrimaryCrops(): Promise<string[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from("farmers")
    .select("primary_crops")
    .eq("user_id", userId)
    .single();

  if (error) return [];
  return parsePrimaryCrops((data as any)?.primary_crops);
}

function filterAndOrderCropsByPrimary(
  crops: CropForecast[],
  primaryCrops: string[],
): CropForecast[] {
  const keys = primaryCrops.map(normalizeName).filter(Boolean);
  if (keys.length === 0) return crops;

  const keySet = new Set(keys);
  const filtered = crops.filter((c) => {
    const nameKey = normalizeName(c.name);
    if (keySet.has(nameKey)) return true;
    // allow partial matches (e.g., "mango" vs "mango karuthakolomban")
    return keys.some((k) => nameKey.includes(k) || k.includes(nameKey));
  });

  // Order using primary_crops order.
  const rank = (name: string) => {
    const nk = normalizeName(name);
    const idx = keys.findIndex((k) => nk === k || nk.includes(k) || k.includes(nk));
    return idx === -1 ? 999 : idx;
  };

  return filtered.sort((a, b) => rank(a.name) - rank(b.name));
}

async function loadMarketPriceForecast7d(fruitName: string): Promise<ForecastPoint[]> {
   const path = `/api/forecast/7day?fruit=${encodeURIComponent(
     fruitName,
   )}&target=price`;
   logger.log("[loadMarketPriceForecast7d] fetching:", path);
   const json: any = await api.get(path);
   logger.log("[loadMarketPriceForecast7d] response:", JSON.stringify(json).slice(0, 400));
   const days = Array.isArray(json?.days) ? json.days : [];
   const parsed = days
     .map((d: any, idx: number) => ({
       day: String(d.day ?? d.label ?? `D${idx + 1}`),
       value: Number(d.value ?? d.price ?? d.y ?? 0),
     }))
     .filter((p: ForecastPoint) => Number.isFinite(p.value));
   logger.log("[loadMarketPriceForecast7d] parsed", parsed.length, "valid points from", days.length, "raw");
   return parsed;
 }

function buildFallbackHints(crop: CropForecast): string[] {
  const best = computeBestPoint(crop.series);
  const trend = computeTrend(crop.series);
  const hints: string[] = [];
  if (best) {
    hints.push(
      `Best selling window looks like ${String(best.point.day).slice(0, 16)} (peak ~Rs. ${formatCurrencyLkr(
        best.point.value,
      )}${crop.unit || "/kg"}).`,
    );
  }
  if (trend) {
    if (trend.direction === "up") hints.push(`Your forecast trend is rising (~+${Math.abs(trend.pct).toFixed(0)}%). Consider holding for a better day if quality/storage allows.`);
    else if (trend.direction === "down") hints.push(`Your forecast trend is falling (~-${Math.abs(trend.pct).toFixed(0)}%). Earlier selling may reduce risk of a drop.`);
    else hints.push("Your forecast is relatively stable for the next two weeks.");
  }
  if (crop.liveToday != null && best) {
    const gap = Math.round(best.point.value - crop.liveToday);
    if (gap > 0) {
      hints.push(`Today’s live price is about Rs. ${gap.toLocaleString()} below the best day.`);
    }
  }
  return hints;
}

function pickBestGradePrice(gradesObj: any): number | undefined {
  const grades = gradesObj && typeof gradesObj === "object" ? gradesObj : {};
  const byKey = (k: string) => {
    const g = grades[k] ?? grades[k.toLowerCase()] ?? grades[k.toUpperCase()];
    const p = Number(g?.price ?? g?.value);
    return Number.isFinite(p) ? p : undefined;
  };
  // Prefer A if available (most common “reference” grade), then B/C/D.
  return byKey("A") ?? byKey("B") ?? byKey("C") ?? byKey("D");
}

async function loadTodayFreshRoutePrices(): Promise<FreshRoutePriceLookup[]> {
  const date = new Date().toISOString().split("T")[0];
  let data: any = null;
  try {
    data = await api.get(`/api/prices/freshroute?date=${date}`);
  } catch {
    // Some backends ignore date filtering; fall back to the canonical endpoint.
    data = await api.get("/api/prices/freshroute");
  }

  const fruits =
    (Array.isArray(data?.fruits) ? data.fruits : null) ||
    (Array.isArray(data?.data?.fruits) ? data.data.fruits : null) ||
    [];

  const lookups: FreshRoutePriceLookup[] = fruits
    .map((fruit: any) => {
      const name = String(fruit?.name ?? fruit?.fruit_name ?? fruit?.fruit ?? "");
      const normalizedName = normalizeName(name);
      const unit = String(fruit?.unit ?? "/kg");
      const priceFromGrades = pickBestGradePrice(fruit?.grades);
      const fallback = Number(fruit?.price ?? fruit?.min_price ?? fruit?.max_price ?? NaN);
      const price =
        priceFromGrades ?? (Number.isFinite(fallback) ? fallback : undefined);
      if (!normalizedName || price == null) return null;
      return { normalizedName, price, unit };
    })
    .filter(Boolean) as FreshRoutePriceLookup[];

  return lookups;
}

function findLivePriceForCrop(
  cropName: string,
  lookups: FreshRoutePriceLookup[],
): FreshRoutePriceLookup | null {
  const key = normalizeName(cropName);
  if (!key) return null;
  // exact match first
  const exact = lookups.find((l) => l.normalizedName === key);
  if (exact) return exact;
  // partial match as fallback (handles "Mango (Karuthakolomban)" vs "Mango")
  const partial = lookups.find(
    (l) => l.normalizedName.includes(key) || key.includes(l.normalizedName),
  );
  return partial ?? null;
}

function toForecastPoints(raw: any): ForecastPoint[] {
   if (!raw) return [];
   logger.log("[toForecastPoints] raw input:", JSON.stringify(raw).slice(0, 200));

   // Common shapes:
   // - [{ day, value }]
   // - [{ x, y }]
   // - { points: [...] }
   // - { days: [...] }
   const points: any[] = Array.isArray(raw)
     ? raw
     : Array.isArray(raw.points)
       ? raw.points
       : Array.isArray(raw.days)
         ? raw.days
         : Array.isArray(raw.data)
           ? raw.data
           : [];
   logger.log("[toForecastPoints] extracted", points.length, "points");

   return points
     .map((p: any, idx: number) => {
       const day = String(p.day ?? p.x ?? p.label ?? `D${idx + 1}`);
       const value = Number(p.value ?? p.y ?? p.price ?? p.v ?? 0);
       if (idx === 0 || idx === points.length - 1) {
         logger.log(`[toForecastPoints] point[${idx}]:`, { day, value });
       }
       return { day, value };
     })
     .filter((p: ForecastPoint) => Number.isFinite(p.value));
 }

function pickSeries(rawCrop: any): ForecastPoint[] {
  // Prefer combined series if present, else forecast/price series.
  const candidates = [
    rawCrop?.combined,
    rawCrop?.series?.combined,
    rawCrop?.forecast,
    rawCrop?.series?.forecast,
    rawCrop?.price,
    rawCrop?.series?.price,
    rawCrop?.days,
    rawCrop?.series?.days,
    rawCrop?.points,
    rawCrop?.series,
  ];

  for (const c of candidates) {
    const pts = toForecastPoints(c);
    if (pts.length > 0) return pts;
  }
  return [];
}

function looksLikeGeneratedLabel(value: string): boolean {
  const v = (value || "").trim().toLowerCase();
  return (
    v === "unknown" ||
    /^crop-\d+$/.test(v) ||
    /^fruit-\d+$/.test(v) ||
    /^item-\d+$/.test(v)
  );
}

function applyPrimaryCropNames(
  crops: CropForecast[],
  primaryCrops: string[],
): CropForecast[] {
  if (!primaryCrops || primaryCrops.length === 0) return crops;

  const titled = primaryCrops.map(titleizeFruitKey);
  const allGenerated = crops.every(
    (c) => looksLikeGeneratedLabel(c.name) || normalizeName(c.name) === normalizeName(c.id),
  );

  // If backend returned nameless objects, map by index to the farmer's selected crops.
  if (allGenerated) {
    return crops.map((c, idx) => {
      const name = titled[idx] ?? c.name;
      return {
        ...c,
        name,
        id: c.id && !looksLikeGeneratedLabel(c.id) ? c.id : `fruit-${idx}`,
      };
    });
  }

  // Otherwise, only replace labels that look generated.
  const nameByKey = new Map<string, string>();
  titled.forEach((t) => nameByKey.set(normalizeName(t), t));

  let unnamedIdx = 0;
  return crops.map((c) => {
    if (!looksLikeGeneratedLabel(c.name)) return c;
    const fallback = titled[unnamedIdx++] ?? c.name;
    const matched = nameByKey.get(normalizeName(fallback));
    return { ...c, name: matched ?? fallback };
  });
}

function normalizeCrops(resp: any): CropForecast[] {
   logger.log("[normalizeCrops] input resp keys:", Object.keys(resp || {}).slice(0, 10));
   const raw =
     resp?.crops ??
     resp?.items ??
     resp?.data ??
     resp?.results ??
     resp?.forecasts ??
     resp?.forecast ??
     resp;

   const crops: any[] = Array.isArray(raw)
     ? raw
     : raw && typeof raw === "object"
       ? Object.values(raw)
       : [];

   logger.log("[normalizeCrops] extracted", crops.length, "crop objects");
   if (crops.length > 0) {
     logger.log("[normalizeCrops] first crop keys:", Object.keys(crops[0] || {}).slice(0, 15));
   }

   return crops.map((c: any, idx: number) => {
     const id = String(
       c.id ?? c.fruitId ?? c.fruit_id ?? c.cropId ?? c.crop ?? c.name ?? `fruit-${idx}`,
     );
     const name = String(
       c.name ?? c.fruit_name ?? c.fruit ?? c.cropName ?? c.crop ?? id,
     );

     const series = pickSeries(c);

     // Attempt to read today's live price.
     const liveToday = Number(
       c.liveToday ??
         c.live_today ??
         c.live_price ??
         c.livePrice ??
         c.todayLive ??
         c.today_live ??
         c.today_price ??
         NaN,
     );

     const unit =
       (c.unit || c.priceUnit || c.currencyUnit || c.u || "/kg") as string;

     const hintsRaw = c.hints ?? c.advice ?? c.insights ?? [];
     const hints = Array.isArray(hintsRaw)
       ? hintsRaw.map((h) => String(h))
       : typeof hintsRaw === "string"
         ? [hintsRaw]
         : [];

     return {
       id,
       name,
       series,
       marketSeries: undefined,
       liveToday: Number.isFinite(liveToday) ? liveToday : undefined,
       unit,
       hints,
     };
   });
 }

export default function PersonalMarketForecastScreen() {
  const router = useRouter();

  const [checkingPro, setCheckingPro] = useState(true);
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState<CropForecast[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [primaryCrops, setPrimaryCrops] = useState<string[]>([]);
  const [chartMode, setChartMode] = useState<"all" | "personal" | "market">("all");

  const selected = useMemo(() => crops[selectedIdx], [crops, selectedIdx]);
  const best = useMemo(
    () => (selected ? computeBestPoint(selected.series) : null),
    [selected],
  );
  const trend = useMemo(
    () => (selected ? computeTrend(selected.series) : null),
    [selected],
  );

  const ensurePrimary = async (): Promise<string[]> => {
    if (primaryCrops.length > 0) return primaryCrops;
    const crops = await loadFarmerPrimaryCrops();
    setPrimaryCrops(crops);
    return crops;
  };

  const load = async () => {
    setLoading(true);
    try {
      const status = await proApi.getStatus();
      if (!status.isPro) {
        router.replace(
          "/subscription?redirect=%2Ffarmer%2Fscreens%2Fpersonal-market-forecast" as any,
        );
        return;
      }

       const resp = await proApi.getPersonalMarketForecast({
         days: 14,
         target: "price",
       });
       logger.log("[PersonalMarketForecast] Pro API response:", JSON.stringify(resp).slice(0, 800));
       const primary = await ensurePrimary();
       const parsed = normalizeCrops(resp);
       logger.log("[PersonalMarketForecast] parsed crops:", parsed.length, "items");
       parsed.forEach((c, i) => {
         logger.log(`[PersonalMarketForecast] crop[${i}]: name="${c.name}", series=${c.series.length} points, live=${c.liveToday}`);
       });
      const named = applyPrimaryCropNames(parsed, primary);
      const filtered = filterAndOrderCropsByPrimary(named, primary);

      // If Pro endpoint doesn't provide today's live price per crop,
      // hydrate from the existing FreshRoute live prices endpoint.
      let hydrated = filtered;
      if (filtered.some((c) => c.liveToday == null)) {
        try {
          const lookups = await loadTodayFreshRoutePrices();
          hydrated = filtered.map((c) => {
            if (c.liveToday != null) return c;
            const match = findLivePriceForCrop(c.name, lookups);
            return match
              ? {
                  ...c,
                  liveToday: match.price,
                  unit: c.unit || match.unit || "/kg",
                }
              : c;
          });
        } catch {
          // If live prices fail, still show the forecast.
          hydrated = filtered;
        }
      }

      // Fetch market (general) 7-day forecast per fruit for comparison.
      // Best-effort: if it fails for one fruit, still render the personal forecast.
      const withMarket = await Promise.all(
        hydrated.map(async (c) => {
          try {
            const marketSeries = await loadMarketPriceForecast7d(c.name);
            console.log(`[load] market forecast for "${c.name}": ${marketSeries.length} points`);
            // If personal forecast is empty but market forecast has data, use market as primary for display.
            if (c.series.length === 0 && marketSeries.length > 0) {
              console.log(`[load] No personal forecast for "${c.name}", using market forecast as primary`);
              return {
                ...c,
                series: marketSeries,
                marketSeries: undefined,
              };
            }
            return { ...c, marketSeries };
          } catch (err) {
            console.warn(`[load] market forecast failed for "${c.name}":`, err);
            return c;
          }
        }),
      );

      setCrops(withMarket);
      setSelectedIdx(0);
    } catch (e: any) {
      const parsed = parseApiError(e);
      if (parsed.proRequired) {
        router.replace(
          "/subscription?redirect=%2Ffarmer%2Fscreens%2Fpersonal-market-forecast" as any,
        );
        return;
      }

      if (parsed.endpointMissing) {
        Alert.alert(
          "Pro temporarily unavailable",
          "Your server does not expose the Pro endpoints yet. Please check the backend deployment or set EXPO_PUBLIC_PRO_BACKEND_URL to the server that has Pro enabled.",
        );
        router.back();
        return;
      }

      Alert.alert("Error", parsed.json?.message || e?.message || "Failed to load forecast");
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await proApi.getStatus();
        if (cancelled) return;
        if (!status.isPro) {
          router.replace(
            "/subscription?redirect=%2Ffarmer%2Fscreens%2Fpersonal-market-forecast" as any,
          );
          return;
        }
      } catch (e: any) {
        if (cancelled) return;
        const parsed = parseApiError(e);
        if (parsed.endpointMissing) {
          Alert.alert(
            "Pro temporarily unavailable",
            "Your server does not expose the Pro endpoints yet. Please check the backend deployment or set EXPO_PUBLIC_PRO_BACKEND_URL to the server that has Pro enabled.",
          );
          router.back();
          return;
        }

        router.replace(
          "/subscription?redirect=%2Ffarmer%2Fscreens%2Fpersonal-market-forecast" as any,
        );
        return;
      } finally {
        if (!cancelled) setCheckingPro(false);
      }

      // Load farmer primary crops so this page only shows relevant fruits,
      // then load forecasts (so we never render crop-0/crop-1 labels).
      try {
        const crops = await loadFarmerPrimaryCrops();
        if (!cancelled) setPrimaryCrops(crops);
      } catch {
        if (!cancelled) setPrimaryCrops([]);
      }

      if (!cancelled) await load();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checkingPro) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.muted}>Checking Pro status…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Personal Market Forecast</Text>
          <Text style={styles.headerSubtitle}>Pro • Live + forecast combined</Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.headerBtn}>
          <Ionicons name="refresh" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.muted}>Loading your forecast…</Text>
        </View>
      ) : crops.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="file-tray-outline" size={64} color="#c7c7c7" />
          <Text style={styles.emptyTitle}>No data available</Text>
          <Text style={styles.muted}>Try again in a moment.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.pillsRow}>
            {crops.map((c, idx) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => setSelectedIdx(idx)}
                style={[styles.pill, idx === selectedIdx && styles.pillActive]}
              >
                <Text
                  style={[styles.pillText, idx === selectedIdx && styles.pillTextActive]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selected ? (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle}>{selected.name}</Text>
                {selected.liveToday != null ? (
                  <View style={styles.livePill}>
                    <Ionicons name="flash" size={14} color={PRIMARY_GREEN} />
                    <Text style={styles.liveText}>
                      Today: {Math.round(selected.liveToday).toLocaleString()}{selected.unit}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Best day</Text>
                  <Text style={styles.summaryValue}>
                    {best ? `Rs. ${formatCurrencyLkr(best.point.value)}` : "—"}
                  </Text>
                  <Text style={styles.summaryHint}>
                    {best ? String(best.point.day).slice(0, 16) : "No data"}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>14-day trend</Text>
                  <Text style={styles.summaryValue}>
                    {trend
                      ? `${trend.direction === "up" ? "+" : trend.direction === "down" ? "-" : ""}${Math.abs(
                          trend.pct,
                        ).toFixed(0)}%`
                      : "—"}
                  </Text>
                  <Text style={styles.summaryHint}>
                    {trend
                      ? trend.direction === "flat"
                        ? "Stable"
                        : trend.direction === "up"
                          ? "Rising"
                          : "Falling"
                      : "No data"}
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Today vs best</Text>
                  <Text style={styles.summaryValue}>
                    {selected.liveToday != null && best
                      ? `${Math.max(
                          0,
                          Math.round(best.point.value - selected.liveToday),
                        ).toLocaleString()}`
                      : "—"}
                  </Text>
                  <Text style={styles.summaryHint}>Rs. gap</Text>
                </View>
              </View>

              <View style={styles.chartModeRow}>
                <TouchableOpacity
                  onPress={() => setChartMode("all")}
                  style={[styles.chartModeBtn, chartMode === "all" && styles.chartModeBtnActive]}
                >
                  <Text style={[styles.chartModeText, chartMode === "all" && styles.chartModeTextActive]}>All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setChartMode("personal")}
                  style={[styles.chartModeBtn, chartMode === "personal" && styles.chartModeBtnActive]}
                >
                  <Text style={[styles.chartModeText, chartMode === "personal" && styles.chartModeTextActive]}>Your Forecast</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setChartMode("market")}
                  style={[styles.chartModeBtn, chartMode === "market" && styles.chartModeBtnActive]}
                >
                  <Text style={[styles.chartModeText, chartMode === "market" && styles.chartModeTextActive]}>Market Forecast</Text>
                </TouchableOpacity>
              </View>

              <ForecastPriceChart
                data={chartMode === "market" ? (selected.marketSeries ?? []) : selected.series}
                referenceValue={selected.liveToday}
                yLabelPrefix="Rs. "
                highlightIndex={best?.idx}
                comparisonData={chartMode === "personal" ? undefined : chartMode === "all" ? selected.marketSeries : undefined}
              />

              {selected.liveToday != null ? (
                <Text style={styles.chartHint}>
                  Dashed line is today’s live price.
                </Text>
              ) : null}

              {selected.hints.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Personal hints</Text>
                  <View style={styles.hintsBox}>
                    {selected.hints.slice(0, 6).map((h, idx) => (
                      <View key={`${selected.id}-h-${idx}`} style={styles.hintRow}>
                        <Ionicons name="sparkles" size={16} color={PRIMARY_GREEN} />
                        <Text style={styles.hintText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Personal hints</Text>
                  <View style={styles.hintsBox}>
                    {buildFallbackHints(selected).slice(0, 6).map((h, idx) => (
                      <View key={`${selected.id}-fh-${idx}`} style={styles.hintRow}>
                        <Ionicons name="sparkles" size={16} color={PRIMARY_GREEN} />
                        <Text style={styles.hintText}>{h}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export const options = { headerShown: false };

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fafafa",
  },
  headerBtn: { padding: 8, marginHorizontal: -8 },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#111827" },
  headerSubtitle: { fontSize: 12, fontWeight: "600", color: "#6b7280", marginTop: 2 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  muted: { marginTop: 8, fontSize: 12, color: "#6b7280", textAlign: "center" },

  content: { padding: 16, paddingBottom: 28 },

  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  infoPillText: { fontSize: 12, fontWeight: "700", color: "#111827" },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  pill: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: PRIMARY_GREEN },
  pillText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  pillTextActive: { color: "#fff" },

  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#111827" },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveText: { fontSize: 11, fontWeight: "800", color: "#111827" },

  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
  },
  summaryLabel: { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  summaryValue: { marginTop: 4, fontSize: 14, fontWeight: "900", color: "#111827" },
  summaryHint: { marginTop: 2, fontSize: 11, fontWeight: "600", color: "#6b7280" },

  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
    marginBottom: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 999 },
  legendDash: {
    width: 14,
    height: 2,
    backgroundColor: "#9CA3AF",
    borderRadius: 2,
  },
  legendText: { fontSize: 11, fontWeight: "700", color: "#6b7280" },

  chartModeRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  chartModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  chartModeBtnActive: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  chartModeText: { fontSize: 12, fontWeight: "700", color: "#111827" },
  chartModeTextActive: { color: "#fff" },

  chartHint: { marginTop: 8, fontSize: 11, color: "#6b7280" },

  sectionTitle: { marginTop: 14, marginBottom: 8, fontSize: 13, fontWeight: "900", color: "#111827" },
  hintsBox: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  hintRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  hintText: { flex: 1, fontSize: 12, color: "#111827", fontWeight: "600", lineHeight: 18 },

  emptyTitle: { marginTop: 10, fontSize: 16, fontWeight: "900", color: "#111827" },
  retryBtn: { marginTop: 12, backgroundColor: PRIMARY_GREEN, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "900" },
});
