import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "Loading...",
    email: "...",
    role: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userStr = await AsyncStorage.getItem("user");
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error("Failed to load profile", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.clear();
          router.replace("/login"); // Adjust route to your actual login path
        },
      },
    ]);
  };

  const MenuOption = ({ icon, label, onPress, isDestructive = false }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View
        style={[styles.menuIconBox, isDestructive && styles.destructiveBox]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={isDestructive ? "#e53e3e" : "#4a5568"}
        />
      </View>
      <Text style={[styles.menuText, isDestructive && styles.destructiveText]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. Top Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60",
            }}
            style={styles.avatar}
          />
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user.role.toUpperCase()}</Text>
        </View>
      </View>

      {/* 2. Menu Options */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <MenuOption
          icon="person-outline"
          label="Edit Profile"
          onPress={() => console.log("Edit Profile")}
        />
        <MenuOption
          icon="notifications-outline"
          label="Notifications"
          onPress={() => console.log("Notifications")}
        />
        <MenuOption
          icon="lock-closed-outline"
          label="Privacy & Security"
          onPress={() => console.log("Privacy")}
        />

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Support</Text>

        <MenuOption
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() => console.log("Help")}
        />
        <MenuOption
          icon="document-text-outline"
          label="Terms & Conditions"
          onPress={() => console.log("Terms")}
        />
      </View>

      {/* 3. Logout Button */}
      <View style={styles.footerSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>App Version 1.0.5</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7fafc",
  },

  // Header Section
  headerSection: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#f7fafc",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY_GREEN,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2d3748",
  },
  userEmail: {
    fontSize: 14,
    color: "#718096",
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 12,
    backgroundColor: "#e6fffa",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b2f5ea",
  },
  roleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#a0aec0",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#edf2f7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  destructiveBox: {
    backgroundColor: "#fff5f5",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#2d3748",
    fontWeight: "500",
  },
  destructiveText: {
    color: "#e53e3e",
  },

  // Footer Section
  footerSection: {
    marginTop: 30,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fed7d7",
    paddingVertical: 14,
    width: "100%",
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#e53e3e",
  },
  versionText: {
    fontSize: 12,
    color: "#cbd5e0",
  },
});
