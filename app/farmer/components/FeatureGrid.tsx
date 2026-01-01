import { Ionicons } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";

interface GridItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route?: Href;
  onPress?: () => void;
  comingSoon?: boolean;
}

export default function FeatureGrid() {
  const router = useRouter();
  const { t, locale } = useTranslationContext();

  console.log('[FeatureGrid] Rendering with locale:', locale);

  const gridItems: GridItem[] = useMemo(() => [
    {
      id: 'forecast',
      title: t("farmer.cards.forecastTitle"),
      subtitle: t("farmer.cards.forecastSubtitle"),
      icon: 'calendar',
      route: '/farmer/forecast',
    },
    {
      id: 'market',
      title: t("farmer.cards.liveMarketTitle"),
      subtitle: t("farmer.cards.liveMarketSubtitle"),
      icon: 'trending-up',
      route: '/farmer/live-market',
    },
    {
      id: 'accuracy',
      title: t("farmer.cards.accuracyTitle"),
      subtitle: t("farmer.cards.accuracySubtitle"),
      icon: 'checkmark-circle',
      route: '/farmer/screens/accuracy-insights',
    },
    {
      id: 'feedback',
      title: t("farmer.cards.feedbackTitle"),
      subtitle: t("farmer.cards.feedbackSubtitle"),
      icon: 'chatbubble',
      route: '/farmer/screens/feedback',
    },
    {
      id: 'prediction',
      title: t("farmer.cards.predictionTitle"),
      subtitle: t("farmer.cards.predictionSubtitle"),
      icon: 'analytics',
      comingSoon: true,
    },
    {
      id: 'daily-prices',
      title: t("farmer.cards.dailyPriceTitle"),
      subtitle: t("farmer.cards.dailyPriceSubtitle"),
      icon: 'pricetag',
      route: '/farmer/screens/daily-prices',
    },
  ], [locale, t]);

  const handlePress = (item: GridItem) => {
    if (item.comingSoon) {
      Alert.alert(t("farmer.cards.predictionTitle"), t("common.comingSoon"));
    } else if (item.route) {
      router.push(item.route);
    } else if (item.onPress) {
      item.onPress();
    }
  };

  return (
    <View style={styles.gridContainer}>
      {gridItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.gridCard}
          onPress={() => handlePress(item)}
        >
          <View style={[styles.iconCircle, { backgroundColor: LIGHT_GREEN }]}>
            <Ionicons name={item.icon as any} size={24} color={PRIMARY_GREEN} />
          </View>
          <Text style={styles.gridTitle}>{item.title}</Text>
          <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    paddingHorizontal: 18,
    marginBottom: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCard: {
    width: "48%",
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
  },
});