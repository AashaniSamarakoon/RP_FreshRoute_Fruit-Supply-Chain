import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

interface Fruit {
  id: string;
  name: string;
  imageUri: string;
}

interface GrowingFruitsProps {
  fruits: Fruit[];
}

export default function GrowingFruits({ fruits }: GrowingFruitsProps) {
  const { t } = useTranslationContext();

  const isEmoji = (uri: string) => {
    return uri.length <= 4 && /\p{Emoji}/u.test(uri);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.grows')}</Text>
      <View style={styles.fruitsGrid}>
        {fruits.map((fruit) => (
          <View key={fruit.id} style={styles.fruitItem}>
            {isEmoji(fruit.imageUri) ? (
              <View style={styles.emojiContainer}>
                <Text style={styles.fruitEmoji}>{fruit.imageUri}</Text>
              </View>
            ) : (
              <Image source={{ uri: fruit.imageUri }} style={styles.fruitImage} />
            )}
            <Text style={styles.fruitName} numberOfLines={1}>
              {fruit.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  fruitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 12,
  },
  fruitItem: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(47,133,90,0.1)',
    minWidth: 80,
  },
  fruitImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#e8f4ef',
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
    backgroundColor: 'linear-gradient(135deg, #e8f4ef 0%, #d1f0e0 100%)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2f855a',
  },
  fruitEmoji: {
    fontSize: 28,
  },
  fruitName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f855a',
    textAlign: 'center',
  },
});
