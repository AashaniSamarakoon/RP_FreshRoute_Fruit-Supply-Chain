import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BACKEND_URL } from '../../../config';
import { useTranslationContext } from '../../../context/TranslationContext';

const { width } = Dimensions.get('window');

interface FruitDemandData {
  id: string;
  name: string;
  demand: number;
  price: number;
  trend: 'up' | 'down' | 'stable';
  image: string;
  dayLabel?: string;
}

const demandLevel = (score: number) => {
  // Score ranges from 0 to 1
  // Near 1 = High demand
  // Near 0.5 = Medium demand
  // Near 0 = Low demand
  if (score >= 0.65) return 'High';
  if (score >= 0.35) return 'Medium';
  return 'Low';
};

const SAMPLE_FRUIT_DATA: FruitDemandData[] = [
  {
    id: '1',
    name: 'Mango',
    demand: 85,
    price: 120,
    trend: 'up',
    image: '🥭',
  },
  {
    id: '2', 
    name: 'Banana',
    demand: 92,
    price: 45,
    trend: 'stable',
    image: '🍌',
  },
  {
    id: '3',
    name: 'Pineapple',
    demand: 78,
    price: 80,
    trend: 'down',
    image: '🍍',
  },
];

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GREEN = "#e8f4f0";

export default function FruitDemandCards() {
  const scrollViewRef = useRef<ScrollView>(null);
  const currentIndex = useRef(0);
  const { t, locale } = useTranslationContext();
  const [cards, setCards] = useState<FruitDemandData[]>(SAMPLE_FRUIT_DATA);

  useEffect(() => {
    const interval = setInterval(() => {
      if (cards.length === 0) return;
      currentIndex.current = (currentIndex.current + 1) % cards.length;
      scrollViewRef.current?.scrollTo({
        x: currentIndex.current * width * 0.85,
        animated: true,
      });
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, [cards.length]);

  useEffect(() => {
    const loadForecastCards = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;

        const fruits = [
          { id: '1', name: 'Mango', image: '🥭' },
          { id: '2', name: 'Banana', image: '🍌' },
          { id: '3', name: 'Pineapple', image: '🍍' },
        ];

        const fetchForecast = async (fruitName: string) => {
          const demandUrl = `${BACKEND_URL}/api/farmer/forecast/7day?fruit=${encodeURIComponent(fruitName)}&target=demand`;
          const priceUrl = `${BACKEND_URL}/api/farmer/forecast/7day?fruit=${encodeURIComponent(fruitName)}&target=price`;

          const [demandRes, priceRes] = await Promise.all([
            fetch(demandUrl, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(priceUrl, { headers: { Authorization: `Bearer ${token}` } }),
          ]);

          const demandJson = await demandRes.json();
          const priceJson = await priceRes.json();

          const firstDemand = demandJson?.days?.[0];
          const firstPrice = priceJson?.days?.[0];

          // Determine trend based on demand level
          let trend: 'up' | 'down' | 'stable' = 'stable';
          const demandScore = Number(firstDemand?.value) || 0;
          
          if (demandScore >= 0.65) {
            trend = 'up';    // High demand
          } else if (demandScore < 0.35) {
            trend = 'down';  // Low demand
          }
          // else stable for medium demand (0.35-0.65)

          return {
            demand: Number(firstDemand?.value) || 0,
            price: Number(firstPrice?.value) || 0,
            trend: trend,
            dayLabel: firstDemand?.day || firstPrice?.day || 'Today',
          };
        };

        const results = await Promise.all(
          fruits.map(async (fruit) => {
            const data = await fetchForecast(fruit.name);
            return {
              id: fruit.id,
              name: fruit.name,
              demand: data.demand,
              price: data.price,
              trend: data.trend,
              image: fruit.image,
              dayLabel: data.dayLabel,
            } as FruitDemandData;
          })
        );

        setCards(results);
      } catch (err) {
        console.error('[FruitDemandCards] Failed to load forecasts', err);
      }
    };

    loadForecastCards();
  }, [locale]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Ionicons name="trending-up" size={32} color="#22c55e" />;
      case 'down':
        return <Ionicons name="trending-down" size={32} color="#ef4444" />;
      default:
        return <Ionicons name="remove" size={32} color="#6b7280" />;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={width * 0.85 + 16}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContainer}
      >
        {cards.map((fruit) => (
          <View key={fruit.id} style={styles.card}>
            <View style={styles.cardBody}>
              <View style={styles.emojiContainer}>
                <Text style={styles.fruitEmoji}>{fruit.image}</Text>
              </View>
              
              <View style={styles.cardRight}>
                <Text style={styles.fruitName}>{fruit.name}</Text>
                
                <View style={styles.cardContent}>
                  <View style={styles.demandRow}>
                    <Text style={styles.demandText}>{t("farmer.demandLabel")}: {demandLevel(fruit.demand)}</Text>
                    {getTrendIcon(fruit.trend)}
                  </View>
                  <Text style={styles.priceText}>Rs. {fruit.price}{t("farmer.perKg")}</Text>
                  {fruit.dayLabel ? (
                    <Text style={styles.dateText}>{fruit.dayLabel}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    marginTop: 8,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  card: {
    width: width * 0.85,
    backgroundColor: LIGHT_GREEN,
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 150,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fruitEmoji: {
    fontSize: 48,
  },
  cardRight: {
    flex: 1,
  },
  cardContent: {
    gap: 4,
    marginTop: 8,
  },
  demandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  fruitName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
  },
  demandText: {
    fontSize: 14,
    color: PRIMARY_GREEN,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 3,
  },
});