import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
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

export default function AdminProfile() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed", e);
    }
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
      <Header title="Profile" />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BuyerColors.primaryGreen]}
            tintColor={BuyerColors.primaryGreen}
          />
        }
      >
        <Text style={styles.title}>Admin profile</Text>
        <Text style={styles.subtitle}>
          Manage platform and review complaints from here.
        </Text>
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
    color: BuyerColors.textBlack,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: BuyerColors.textGray,
    textAlign: "center",
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
