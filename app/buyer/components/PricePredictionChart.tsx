import api from "@/services/api";
import React, { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, {
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

interface PredictionData {
  day: string;
  predictedPrice: number;
}

interface PricePredictionChartProps {
  title?: string;
}

// helper to convert a date string (YYYY‑MM‑DD) to weekday short name
const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// fetch forecast from backend; returns prediction data for the next 7 days
async function fetchPrediction(fruit: string): Promise<PredictionData[]> {
  console.log("[PricePredictionChart] fetchPrediction called, fruit=>", fruit);
  if (!fruit) return [];
  // endpoint now requires `7day` segment (unified across app)
  const path = `/api/forecast/7day?fruit=${encodeURIComponent(fruit)}`;
  console.log("[PricePredictionChart] built path", path);
  try {
    console.log("[PricePredictionChart] fetching", path);
    const resp = await api.get(path);
    console.log("[PricePredictionChart] forecast response", resp);
    // backend now returns { days: [ { day, value, ... } ] }
    const arr = resp.days || resp.forecast || [];
    return arr.slice(0, 7).map((item: any) => {
      let dayName = item.day;
      // some responses give full weekday, convert to short
      if (dayName && dayName.length > 3) {
        dayName = dayName.slice(0, 3);
      }
      return {
        day: dayName,
        predictedPrice: parseFloat(item.value) || 0,
      };
    });
  } catch (err) {
    console.warn("[PricePredictionChart] fetch error", err, "path", path);
    return [];
  }
}

const fruitOptions = [
  { id: "mango", label: "Mango" },
  { id: "banana", label: "Banana" },
  { id: "pineapple", label: "Pineapple" },
];

export default function PricePredictionChart({}: PricePredictionChartProps): React.JSX.Element {
  const [selectedFruit, setSelectedFruit] = useState<string>("mango");
  const [currentData, setCurrentData] = useState<PredictionData[]>([]);

  // fetch predictions whenever fruit filter changes
  React.useEffect(() => {
    console.log("[PricePredictionChart] selectedFruit changed", selectedFruit);
    let cancelled = false;
    fetchPrediction(selectedFruit).then((data) => {
      console.log("[PricePredictionChart] got data length", data.length);
      if (!cancelled) setCurrentData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedFruit]);

  const chartWidth = screenWidth - 60;
  const chartHeight = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const prices = currentData.map((d) => d.predictedPrice);
  const minPrice = Math.floor(Math.min(...prices) * 10) / 10 - 0.1;
  const maxPrice = Math.ceil(Math.max(...prices) * 10) / 10 + 0.1;
  const priceRange = maxPrice - minPrice;

  const getX = (index: number) =>
    paddingLeft + (index / (currentData.length - 1)) * graphWidth;
  const getY = (price: number) =>
    paddingTop + graphHeight - ((price - minPrice) / priceRange) * graphHeight;

  const createPath = (prices: number[]) => {
    return prices
      .map((price, index) => {
        const x = getX(index);
        const y = getY(price);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(" ");
  };

  const path = createPath(prices);

  const yLabels = [minPrice, (minPrice + maxPrice) / 2, maxPrice];

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {fruitOptions.map((fruit) => (
          <TouchableOpacity
            key={fruit.id}
            style={[
              styles.filterButton,
              selectedFruit === fruit.id && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFruit(fruit.id)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFruit === fruit.id && styles.filterTextActive,
              ]}
            >
              {fruit.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.header}>
        <Text style={styles.headerText}>7‑Day Predicted Price</Text>
      </View>
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="predGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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
        </Defs>
        {/* horizontal grid lines */}
        {yLabels.map((lbl, i) => {
          const y = getY(lbl);
          return (
            <Line
              key={i}
              x1={paddingLeft}
              y1={y}
              x2={chartWidth - paddingRight}
              y2={y}
              stroke="#E5E7EB" // light grey
              strokeWidth={1}
            />
          );
        })}
        {/* vertical divider (y-axis) */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={chartHeight - paddingBottom}
          stroke="#6B7280"
          strokeWidth={1}
        />
        {/* optional vertical tick lines for each day */}
        {currentData.map((_, idx) => {
          const x = getX(idx);
          return (
            <Line
              key={`vx-${idx}`}
              x1={x}
              y1={paddingTop}
              x2={x}
              y2={chartHeight - paddingBottom}
              stroke="#F3F4F6"
              strokeWidth={0.5}
            />
          );
        })}
        <Path
          d={path}
          stroke={BuyerColors.primaryGreen}
          strokeWidth={2}
          fill="none"
        />
        {/* y-axis labels inside SVG */}
        {yLabels.map((lbl, idx) => (
          <SvgText
            key={`y-label-${idx}`}
            x={paddingLeft - 8}
            y={getY(lbl) + 4}
            fontSize={10}
            fill={BuyerColors.textGray}
            textAnchor="end"
          >
            <TSpan>{lbl}</TSpan>
          </SvgText>
        ))}
        {/* x-axis labels inside SVG */}
        {currentData.map((d, idx) => (
          <SvgText
            key={`x-label-${idx}`}
            x={getX(idx)}
            y={chartHeight - 8}
            fontSize={10}
            fill={BuyerColors.textGray}
            textAnchor="middle"
          >
            <TSpan>{d.day}</TSpan>
          </SvgText>
        ))}
      </Svg>
      {/* removed absolute-positioned label views */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BuyerColors.cardWhite,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterButtonActive: {
    backgroundColor: BuyerColors.primaryLight,
    borderColor: BuyerColors.primaryGreen,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "500",
    color: BuyerColors.textGray,
  },
  filterTextActive: {
    color: BuyerColors.primaryGreen,
    fontWeight: "700",
  },
  header: {
    marginBottom: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: BuyerColors.textBlack,
  },
  yLabelText: {
    fontSize: 10,
    color: BuyerColors.textGray,
  },
  xLabelText: {
    fontSize: 10,
    color: BuyerColors.textGray,
  },
});
