import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../../../components/Header";
import { BuyerColors } from "../../../constants/theme";

export default function BuyerProfile() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Nothing to reload on the static profile page yet
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      // sign out from Supabase (clears session storage)
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed", e);
    }
    // clear any local keys we set during onboarding or auth
    await AsyncStorage.multiRemove([
      "token",
      "user",
      "onboarded",
      "onboarding_buyer",
    ]);
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Profile"
        showNotification={true}
        onNotificationPress={() => {
          console.log("Notifications pressed");
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BuyerColors?.primaryGreen || "#2E7D32"]}
            tintColor={BuyerColors?.primaryGreen || "#2E7D32"}
          />
        }
      >
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account settings here.</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: BuyerColors?.textBlack || "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "red",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
