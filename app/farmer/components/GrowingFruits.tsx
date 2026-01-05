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
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  fruitsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  fruitItem: {
    width: '23%',
    alignItems: 'center',
    marginBottom: 12,
  },
  fruitImage: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    marginBottom: 6,
  },
  emojiContainer: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fruitEmoji: {
    fontSize: 36,
  },
  fruitName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
});
