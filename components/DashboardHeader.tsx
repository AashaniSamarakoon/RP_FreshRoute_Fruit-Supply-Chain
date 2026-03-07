import { Colors } from "@/constants/theme";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
}

interface HomeData {
  greeting?: string;
}

const DashboardHeader = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [greeting, setGreeting] = useState<string>("Good morning");
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

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await api.get("/api/farmer/home");
        if (response?.greeting) {
          // Extract first name only from greeting
          const parts = response.greeting.split(", ");
          if (parts.length > 1) {
            const fullName = parts[1];
            const firstName = fullName.split(" ")[0];
            const greetingWithFirstName = `${parts[0]}, ${firstName}`;
            setGreeting(greetingWithFirstName);
          } else {
            setGreeting(response.greeting);
          }
        }
      } catch (error) {
        console.error("[DashboardHeader] Failed to fetch greeting:", error);
      }
    };
    fetchGreeting();
  }, []);

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.logo}>🍃 FreshRoute</Text>
        <Text style={styles.greeting}>{greeting}</Text>

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
