// app/signup.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
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

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("farmer");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      return Alert.alert("Error", "Please fill all fields");
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return Alert.alert("Signup failed", data.message || "Unknown error");
      }

      const { token, user } = data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      const route = getDashboardRoute(user.role as Role);
      router.replace(route as any);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create FreshRoute Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />

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

      <Text style={styles.label}>Select role</Text>
      <View style={styles.roleRow}>
        {(["farmer", "transporter", "buyer"] as Role[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleButton, role === r && styles.roleButtonActive]}
            onPress={() => setRole(r)}
          >
            <Text style={role === r ? styles.roleTextActive : styles.roleText}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creating account..." : "Sign Up"}
        </Text>
      </TouchableOpacity>
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
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: {
    fontSize: 24,
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
  label: { marginTop: 8, marginBottom: 4, fontWeight: "500" },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4a5568",
    borderRadius: 10,
    padding: 8,
    marginHorizontal: 4,
    alignItems: "center",
  },
  roleButtonActive: {
    backgroundColor: "#4a5568",
  },
  roleText: { color: "#4a5568" },
  roleTextActive: { color: "#fff", fontWeight: "bold" },
  button: {
    backgroundColor: "#2f855a",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
