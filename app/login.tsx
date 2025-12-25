// app/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { BACKEND_URL } from "../config";

type Role = "farmer" | "transporter" | "buyer";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert("Error", "Please enter email and password");
    }

    console.log("[LOGIN] Starting login...");
    console.log("[LOGIN] Backend URL:", BACKEND_URL);
    setLoading(true);
    try {
      console.log("[LOGIN] Fetching:", `${BACKEND_URL}/api/auth/login`);
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log("[LOGIN] Response status:", res.status);

      const data = await res.json();
      console.log("[LOGIN] Response data:", data);

      if (!res.ok) {
        console.log("[LOGIN] Login failed:", data.message);
        return Alert.alert("Login failed", data.message || "Unknown error");
      }

      const { token, user } = data;
      console.log("[LOGIN] Token received:", token?.substring(0, 20) + "...");
      console.log("[LOGIN] User role:", user?.role);

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));
      console.log("[LOGIN] Token saved to AsyncStorage");

      const route = getDashboardRoute(user.role as Role);
      console.log("[LOGIN] Navigating to:", route);
      router.replace(route);
    } catch (err) {
      console.error("[LOGIN] Error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      Alert.alert("Error", "Could not connect to backend: " + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FreshRoute Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <Link href="/signup" style={styles.link}>
        Don&apos;t have an account? Sign up
      </Link>
    </View>
  );
}

function getDashboardRoute(role: Role) {
  switch (role) {
    case "farmer":
      return "/farmer";
    case "transporter":
      return "/transporter";
    case "buyer":
      return "/buyer";
    default:
      return "/login";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#2f855a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  link: { marginTop: 16, textAlign: "center", color: "#2b6cb0" },
});
