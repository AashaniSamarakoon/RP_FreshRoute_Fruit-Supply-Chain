// components/Header.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../../config"; // Adjust path if needed
// Assuming you have this context, otherwise you can remove the hook and hardcode text
import { useTranslationContext } from "../../../context/TranslationContext";

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

interface HeaderProps {
  onSearch?: (text: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const router = useRouter();
  // If you don't have translation context set up for transporter yet,
  // you can remove t/locale logic and just use English strings.
  const { t, locale, setLocale } = useTranslationContext();

  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState("Transporter");

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");

        // 1. Get Name from Local Storage
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserName(user.name || "Transporter");
        }

        if (!token) return;

        // 2. Get Notifications (Switched to transporter endpoint)
        const res = await fetch(
          `${BACKEND_URL}/api/transporter/notifications`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error("[Header] Failed to load header data", err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🍃 FreshRoute</Text>
          <Text style={styles.greeting}>
            {/* Fallback to English if translation key missing */}
            {t
              ? t("farmer.greeting", { name: userName })
              : `Hello, ${userName}`}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={() => router.push("/transporter/notifications" as any)} // Adjust route as needed
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
              const nextLocale = locale === "en" ? "si" : "en";
              setLocale(nextLocale);
            }}
          >
            <Text style={styles.langToggleText}>
              {locale === "en" ? "සි" : "EN"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
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
    paddingTop: 50, // Safe area padding
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    color: "#000",
    textTransform: "capitalize",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    position: "relative",
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 2,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
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
    marginBottom: 10, // Reduced margin
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
});
