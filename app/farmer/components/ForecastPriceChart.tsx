import React, { useMemo } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Svg, {
    Circle,
    Defs,
    Line,
    LinearGradient,
    Path,
    Stop,
    Text as SvgText,
    TSpan,
} from "react-native-svg";

const PRIMARY_GREEN = "#2f855a";

export type ForecastPoint = {
  day: string;
  value: number;
};

type Props = {
  data: ForecastPoint[];
  height?: number;
  /** If provided, draws a horizontal reference line. */
  referenceValue?: number;
  /** Prefix for Y-axis labels (e.g., 'Rs. '). */
  yLabelPrefix?: string;
  /** If provided, highlights the given point index. */
  highlightIndex?: number;
  /** Optional comparison series (e.g., general market forecast). */
  comparisonData?: ForecastPoint[];
};

const { width: screenWidth } = Dimensions.get("window");

export default function ForecastPriceChart({
  data,
  height = 220,
  referenceValue,
  yLabelPrefix = "",
  highlightIndex,
  comparisonData,
}: Props): React.JSX.Element {
  const hasPrimary = Array.isArray(data) && data.length > 0;
  const hasComparison = Array.isArray(comparisonData) && comparisonData.length > 0;
  if (!hasPrimary && !hasComparison) {
    return (
      <View style={[styles.container, styles.empty]}>
        <Text style={styles.emptyTitle}>Forecast unavailable</Text>
        <Text style={styles.emptyText}>We couldn’t load price points for this fruit.</Text>
      </View>
    );
  }

  const chartWidth = Math.min(screenWidth - 32, 420);

  const paddingLeft = 42;
  const paddingRight = 14;
  const paddingTop = 16;
  const paddingBottom = 28;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const safeData = data && data.length > 0 ? data : [{ day: "", value: 0 }];

  const safeComparison =
    comparisonData && comparisonData.length > 0 ? comparisonData : null;

  const alignedComparisonValues = useMemo(() => {
    if (!safeComparison) return null;

    // Try to align by day label first (best effort), otherwise align by index.
    const byDay = new Map<string, number>();
    safeComparison.forEach((p) => {
      if (!p?.day) return;
      const v = Number(p.value);
      if (!Number.isFinite(v)) return;
      byDay.set(String(p.day), v);
    });

    const sameLength = safeComparison.length === safeData.length;
    return safeData.map((p, idx) => {
      const byLabel = p?.day ? byDay.get(String(p.day)) : undefined;
      if (byLabel != null) return byLabel;
      if (sameLength) {
        const v = Number(safeComparison[idx]?.value);
        return Number.isFinite(v) ? v : null;
      }
      return null;
    });
  }, [safeComparison, safeData]);

  const values = safeData.map((p) => (Number.isFinite(p.value) ? p.value : 0));
  const compValues = alignedComparisonValues
    ? alignedComparisonValues.map((v) => (Number.isFinite(Number(v)) ? Number(v) : null))
    : null;
  const allValues = compValues ? [...values, ...compValues.filter((v): v is number => v != null)] : values;

  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue || 1;

  const getX = (index: number) => {
    const denom = Math.max(safeData.length - 1, 1);
    return paddingLeft + (index / denom) * graphWidth;
  };

  const getY = (value: number) =>
    paddingTop + graphHeight - ((value - minValue) / range) * graphHeight;

  const linePath = useMemo(() => {
    return safeData
      .map((p, i) => {
        const x = getX(i);
        const y = getY(p.value);
        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  }, [safeData, graphWidth, graphHeight, minValue, range]);

  const areaPath = useMemo(() => {
    const lastX = getX(safeData.length - 1);
    const firstX = getX(0);
    const bottomY = paddingTop + graphHeight;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, safeData.length, graphHeight]);

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }).map((_, i) => {
    const ratio = i / (yTicks - 1);
    const v = minValue + range * (1 - ratio);
    return Math.round(v);
  });

  const referenceY =
    referenceValue != null && Number.isFinite(referenceValue)
      ? getY(referenceValue)
      : null;

  const comparisonPath = useMemo(() => {
    if (!alignedComparisonValues) return null;
    let started = false;
    return alignedComparisonValues
      .map((v, i) => {
        const num = v == null ? NaN : Number(v);
        if (!Number.isFinite(num)) return null;
        const x = getX(i);
        const y = getY(num);
        if (!started) {
          started = true;
          return `M ${x} ${y}`;
        }
        return `L ${x} ${y}`;
      })
      .filter(Boolean)
      .join(" ");
  }, [alignedComparisonValues, graphWidth, graphHeight, minValue, range, safeData.length]);

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="area" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={PRIMARY_GREEN} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={PRIMARY_GREEN} stopOpacity="0.03" />
          </LinearGradient>
        </Defs>

        {/* Grid + Y labels */}
        {yLabels.map((lbl, idx) => {
          const y = getY(lbl);
          return (
            <React.Fragment key={`y-${idx}`}>
              <Line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth={1}
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fontSize={10}
                fill="#6B7280"
                textAnchor="end"
              >
                <TSpan>{`${yLabelPrefix}${lbl}`}</TSpan>
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Reference line */}
        {referenceY != null ? (
          <Line
            x1={paddingLeft}
            y1={referenceY}
            x2={chartWidth - paddingRight}
            y2={referenceY}
            stroke="#9CA3AF"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ) : null}

        {/* Area + line */}
        <Path d={areaPath} fill="url(#area)" />
        {comparisonPath ? (
          <Path
            d={comparisonPath}
            stroke="#9CA3AF"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        <Path d={linePath} stroke={PRIMARY_GREEN} strokeWidth={2.5} fill="none" />

        {/* Points */}
        {safeData.map((p, idx) => {
          const x = getX(idx);
          const y = getY(p.value);
          const label = (p.day || "").slice(0, 3);
          const isHighlighted =
            highlightIndex != null && Number.isFinite(highlightIndex)
              ? idx === highlightIndex
              : false;
          return (
            <React.Fragment key={`p-${idx}`}>
              {isHighlighted ? (
                <Circle cx={x} cy={y} r={10} fill={PRIMARY_GREEN} opacity={0.12} />
              ) : null}
              <Circle cx={x} cy={y} r={isHighlighted ? 5.4 : 4.2} fill={PRIMARY_GREEN} />
              <Circle
                cx={x}
                cy={y}
                r={isHighlighted ? 8.5 : 7}
                fill={PRIMARY_GREEN}
                opacity={isHighlighted ? 0.16 : 0.12}
              />
              <SvgText
                x={x}
                y={height - 10}
                fontSize={10}
                fill="#6B7280"
                textAnchor="middle"
              >
                <TSpan>{label}</TSpan>
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Axis line */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={paddingTop + graphHeight}
          stroke="#9CA3AF"
          strokeWidth={1}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  empty: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 6,
  },
  emptyTitle: { fontSize: 13, fontWeight: "900", color: "#111827" },
  emptyText: { fontSize: 12, fontWeight: "600", color: "#6B7280", textAlign: "center" },
});
