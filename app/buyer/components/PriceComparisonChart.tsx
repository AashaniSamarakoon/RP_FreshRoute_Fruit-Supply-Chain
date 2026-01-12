import React from "react";
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
import { BuyerColors } from "../../../constants/theme";

const { width: screenWidth } = Dimensions.get("window");

interface PriceData {
  month: string;
  freshRoutePrice: number;
  marketPrice: number;
}

interface PriceComparisonChartProps {
  data?: PriceData[];
  title?: string;
}

// Default sample data showing FreshRoute prices below market prices (in Sri Lankan Rupees)
const defaultData: PriceData[] = [
  { month: "Jul", freshRoutePrice: 320, marketPrice: 350 },
  { month: "Aug", freshRoutePrice: 355, marketPrice: 365 },
  { month: "Sep", freshRoutePrice: 340, marketPrice: 355 },
  { month: "Oct", freshRoutePrice: 365, marketPrice: 380 },
  { month: "Nov", freshRoutePrice: 360, marketPrice: 375 },
  { month: "Dec", freshRoutePrice: 380, marketPrice: 395 },
];

export default function PriceComparisonChart({
  data = defaultData,
}: //   title = "Price Comparison",
PriceComparisonChartProps): React.JSX.Element {
  const chartWidth = screenWidth - 60;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  // Calculate min and max prices for scaling
  const allPrices = data.flatMap((d) => [d.freshRoutePrice, d.marketPrice]);
  const minPrice = Math.floor(Math.min(...allPrices) * 10) / 10 - 0.1;
  const maxPrice = Math.ceil(Math.max(...allPrices) * 10) / 10 + 0.1;
  const priceRange = maxPrice - minPrice;

  // Convert data to coordinates
  const getX = (index: number) =>
    paddingLeft + (index / (data.length - 1)) * graphWidth;
  const getY = (price: number) =>
    paddingTop + graphHeight - ((price - minPrice) / priceRange) * graphHeight;

  // Create smooth path for lines
  const createPath = (prices: number[]) => {
    return prices
      .map((price, index) => {
        const x = getX(index);
        const y = getY(price);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  };

  // Create filled area path
  const createAreaPath = (prices: number[]) => {
    const linePath = prices
      .map((price, index) => {
        const x = getX(index);
        const y = getY(price);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");

    const lastX = getX(prices.length - 1);
    const firstX = getX(0);
    const bottomY = paddingTop + graphHeight;

    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const freshRoutePrices = data.map((d) => d.freshRoutePrice);
  const marketPrices = data.map((d) => d.marketPrice);

  // Calculate average savings
  const avgSavings =
    data.reduce((acc, d) => acc + (d.marketPrice - d.freshRoutePrice), 0) /
    data.length;
  const savingsPercent = (
    (avgSavings / (data[0]?.marketPrice || 1)) *
    100
  ).toFixed(0);

  // Y-axis labels
  const yLabels = [minPrice, (minPrice + maxPrice) / 2, maxPrice];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: BuyerColors.primaryGreen },
              ]}
            />
            <Text style={styles.legendText}>FreshRoute Price</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#9CA3AF" }]} />
            <Text style={styles.legendText}>Market Price</Text>
          </View>
        </View>{" "}
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>Save ~{savingsPercent}%</Text>
        </View>
      </View>

      {/* Chart */}
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient
            id="freshRouteGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <Stop
              offset="0%"
              stopColor={BuyerColors.primaryGreen}
              stopOpacity="0.3"
            />
            <Stop
              offset="100%"
              stopColor={BuyerColors.primaryGreen}
              stopOpacity="0.05"
            />
          </LinearGradient>
          <LinearGradient id="marketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {yLabels.map((label, index) => (
          <Line
            key={`grid-${index}`}
            x1={paddingLeft}
            y1={getY(label)}
            x2={chartWidth - paddingRight}
            y2={getY(label)}
            stroke={BuyerColors.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, index) => (
          <SvgText
            key={`y-label-${index}`}
            x={paddingLeft - 8}
            y={getY(label) + 4}
            fontSize={10}
            fill={BuyerColors.textGray}
            textAnchor="end"
          >
            <TSpan>Rs.{Math.round(label)}</TSpan>
          </SvgText>
        ))}

        {/* X-axis labels */}
        {data.map((d, index) => (
          <SvgText
            key={`x-label-${index}`}
            x={getX(index)}
            y={chartHeight - 8}
            fontSize={10}
            fill={BuyerColors.textGray}
            textAnchor="middle"
          >
            <TSpan>{d.month}</TSpan>
          </SvgText>
        ))}

        {/* Market Price Area */}
        <Path d={createAreaPath(marketPrices)} fill="url(#marketGradient)" />

        {/* FreshRoute Price Area */}
        <Path
          d={createAreaPath(freshRoutePrices)}
          fill="url(#freshRouteGradient)"
        />

        {/* Market Price Line */}
        <Path
          d={createPath(marketPrices)}
          stroke="#9CA3AF"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* FreshRoute Price Line */}
        <Path
          d={createPath(freshRoutePrices)}
          stroke={BuyerColors.primaryGreen}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points for Market */}
        {marketPrices.map((price, index) => (
          <Circle
            key={`market-point-${index}`}
            cx={getX(index)}
            cy={getY(price)}
            r={4}
            fill="#FFFFFF"
            stroke="#9CA3AF"
            strokeWidth={2}
          />
        ))}

        {/* Data points for FreshRoute */}
        {freshRoutePrices.map((price, index) => (
          <Circle
            key={`fresh-point-${index}`}
            cx={getX(index)}
            cy={getY(price)}
            r={4}
            fill="#FFFFFF"
            stroke={BuyerColors.primaryGreen}
            strokeWidth={2}
          />
        ))}
      </Svg>

      {/* Bottom Info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Avg. FreshRoute</Text>
          <Text style={[styles.infoValue, { color: BuyerColors.primaryGreen }]}>
            Rs.
            {Math.round(
              freshRoutePrices.reduce((a, b) => a + b, 0) /
                freshRoutePrices.length
            )}
            /kg
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Avg. Market</Text>
          <Text style={[styles.infoValue, { color: BuyerColors.textGray }]}>
            Rs.
            {Math.round(
              marketPrices.reduce((a, b) => a + b, 0) / marketPrices.length
            )}
            /kg
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuyerColors.cardWhite,
    marginHorizontal: 20,
    // marginTop: 24,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  savingsBadge: {
    backgroundColor: BuyerColors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: "600",
    color: BuyerColors.primaryGreen,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: BuyerColors.textGray,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BuyerColors.border,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: BuyerColors.border,
  },
  infoLabel: {
    fontSize: 12,
    color: BuyerColors.textGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
  },
});
