import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Search, Bell } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";

interface UserData {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getDisplayName(user: UserData | null): string {
  if (!user) return "User";
  if (user.role === "admin" || user.email === "admin@gmail.com") return "Admin User";
  const first = (user.first_name ?? "").trim();
  const last = (user.last_name ?? "").trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  if (user.name?.trim()) return user.name.trim().split(" ")[0] ?? "User";
  if (user.email) return user.email.split("@")[0] || "User";
  return "User";
}

const DashboardHeader = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadUser = async () => {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        setUser(JSON.parse(userJson));
      }
    };
    loadUser();
  }, []);

  const displayName = getDisplayName(user);
  const greeting = getTimeBasedGreeting();

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.logo}>🍃 FreshRoute</Text>
        <Text style={styles.greeting}>{greeting}, {displayName}</Text>
      </View>
      <View style={styles.headerIcons}>
        <TouchableOpacity style={styles.iconBtn}>
          <Search size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push("/")}
        >
          <Bell size={24} color={Colors.light.text} />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.light.background,
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.light.text,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    color: Colors.light.text,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 15,
  },
  iconBtn: {
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    borderWidth: 1.5,
    borderColor: Colors.light.background,
  },
});

export default DashboardHeader;
