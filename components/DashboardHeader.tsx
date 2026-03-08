import { Colors } from "@/constants/theme";
import { Colors } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Bell, Search } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const DashboardHeader = () => {
  const [greeting, setGreeting] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const loadGreeting = async () => {
      const userJson = await AsyncStorage.getItem("user");
      const meta = userJson ? JSON.parse(userJson)?.user_metadata : null;
      const firstName = meta?.first_name || meta?.name?.split(" ")[0] || "there";
      const hour = new Date().getHours();
      const timeGreeting =
        hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
      setGreeting(`${timeGreeting}, ${firstName}`);
    };
    loadGreeting();
  }, []);

>>>>>>> bdee95167fedbda28a897b40dffec522c033d68a
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
