import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

interface HeaderProps {
  userName: string;
  onSearch?: (text: string) => void;
}

export default function Header({
  userName,
  onSearch
}: HeaderProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslationContext();

  console.log('[Header] Rendering with locale:', locale);

  return (
    <>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🍃 FreshRoute</Text>
          <Text style={styles.greeting}>{t("farmer.greeting", { name: userName })}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => router.push("/farmer/screens/notifications")}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/farmer/profile")} style={{ marginLeft: 12 }}>
            <Ionicons name="person-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langToggle, { marginLeft: 12 }]}
            onPress={() => {
              console.log('[Header.Button] Current locale value:', locale);
              console.log('[Header.Button] Locale type:', typeof locale);
              console.log('[Header.Button] Locale === "en"?', locale === "en");
              console.log('[Header.Button] Locale === "si"?', locale === "si");
              const nextLocale = locale === "en" ? ("si" as const) : ("en" as const);
              console.log('[Header.Button] Calling setLocale with:', nextLocale);
              setLocale(nextLocale);
            }}
          >
            <Text style={styles.langToggleText}>{locale === "en" ? "සි" : "EN"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={t("farmer.searchPlaceholder")}
          placeholderTextColor="#999"
          onChangeText={onSearch}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
    zIndex: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    color: "#000",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  langToggle: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  langToggleText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 8,
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