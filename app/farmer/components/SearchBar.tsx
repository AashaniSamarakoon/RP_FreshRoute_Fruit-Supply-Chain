import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const LIGHT_GRAY = "#f5f5f5";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (text: string) => void;
}

export default function SearchBar({ 
  placeholder, 
  onSearch 
}: SearchBarProps) {
  const { t, locale } = useTranslationContext();

  console.log('[SearchBar] Rendering with locale:', locale);

  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={18} color="#999" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || t("farmer.searchPlaceholder")}
        placeholderTextColor="#999"
        onChangeText={onSearch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
});