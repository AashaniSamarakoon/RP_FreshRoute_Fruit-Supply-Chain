import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BACKEND_URL } from '../../../config';
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
  const [unreadCount, setUnreadCount] = useState(0);

  console.log('[Header] Rendering with locale:', locale);

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/farmer/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("[Header] Failed to load unread count", err);
      }
    };

    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🍃 FreshRoute</Text>
          <Text style={styles.greeting}>{t("farmer.greeting", { name: userName })}</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            onPress={() => router.push("/farmer/screens/notifications")}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
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
  notificationButton: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 2,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
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