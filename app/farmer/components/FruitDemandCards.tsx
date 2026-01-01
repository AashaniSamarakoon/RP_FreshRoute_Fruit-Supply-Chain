import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const { width } = Dimensions.get('window');

interface FruitDemandData {
  id: string;
  name: string;
  demand: number;
  price: number;
  trend: 'up' | 'down' | 'stable';
  image: string;
}

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

  console.log('[FruitDemandCards] Rendering with locale:', locale);

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.current = (currentIndex.current + 1) % SAMPLE_FRUIT_DATA.length;
      scrollViewRef.current?.scrollTo({
        x: currentIndex.current * width * 0.85,
        animated: true,
      });
    }, 3000); // Auto-scroll every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Ionicons name="trending-up" size={16} color="#22c55e" />;
      case 'down':
        return <Ionicons name="trending-down" size={16} color="#ef4444" />;
      default:
        return <Ionicons name="remove" size={16} color="#6b7280" />;
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
        {SAMPLE_FRUIT_DATA.map((fruit) => (
          <View key={fruit.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.fruitEmoji}>{fruit.image}</Text>
              <View style={styles.trendContainer}>
                {getTrendIcon(fruit.trend)}
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.fruitName}>{fruit.name}</Text>
              <Text style={styles.demandText}>{t("farmer.demandLabel")}: {fruit.demand}%</Text>
              <Text style={styles.priceText}>Rs. {fruit.price}{t("farmer.perKg")}</Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${fruit.demand}%` }
                ]} 
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContainer: {
    paddingHorizontal: 16,
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
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fruitEmoji: {
    fontSize: 32,
  },
  trendContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: LIGHT_GREEN,
  },
  cardContent: {
    marginBottom: 16,
  },
  fruitName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
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