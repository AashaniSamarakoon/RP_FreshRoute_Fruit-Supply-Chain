import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Role = "farmer" | "transporter" | "buyer" | "admin";

export default function Login() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // Can be Email, Phone, or NIC
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      return Alert.alert("Required", "Please enter your Phone, NIC, or Email.");
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
      if (authError || !authData.session)
        throw authError || new Error("No session");

      const session = authData.session;
      const user = authData.user;

      // mirror token to old storage key for backward compatibility
      await AsyncStorage.removeItem("token");
      if (session.access_token) {
        await AsyncStorage.setItem("token", session.access_token);
      }
      if (user) {
        await AsyncStorage.setItem("user", JSON.stringify(user));
        console.log("[Login] User data stored in AsyncStorage", user);
      }

      // Ensure admin user has role in metadata so backend JWT sees it
      const rawRole =
        (user.user_metadata?.role as string) ||
        (user.email === "admin@gmail.com" ? "admin" : "buyer");
      const userRole = rawRole.toLowerCase() as Role;
      if (userRole === "admin" && user?.user_metadata?.role !== "admin") {
        await supabase.auth.updateUser({ data: { role: "admin" } });
      }

      const route = getDashboardRoute(userRole);
      router.replace(route as any);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          {/* <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={32} color="#2E7D32" />
          </View> */}
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            Log into your verified profile to access
          </Text>
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Identity</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone, NIC, or Email"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password.."
                secureTextEntry={!showPassword}
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Social Section
        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <SocialButton icon="google" />
          <SocialButton icon="apple" />
          <SocialButton icon="facebook" />
        </View> */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have any account? </Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const SocialButton = ({ icon }: { icon: any }) => (
  <TouchableOpacity style={styles.socialCircle}>
    <MaterialCommunityIcons name={icon} size={24} color="#1F2937" />
  </TouchableOpacity>
);

function getDashboardRoute(role: Role) {
  switch (role) {
    case "farmer":
      return "/farmer";
    case "transporter":
      return "/transporter";
    case "buyer":
      return "/buyer";
    case "admin":
      return "/admin";
    default:
      return "/login";
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 24, justifyContent: "center", flexGrow: 1 },
  header: { alignItems: "flex-start", marginBottom: 40 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E8F5E9",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: "#6B7280" },
  form: { marginBottom: 24 },
  inputWrapper: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 56,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#111827" },
  forgotPassword: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: { color: "#6366F1", fontSize: 13, fontWeight: "600" },
  loginButton: {
    backgroundColor: "#2E7D32",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledButton: { backgroundColor: "#81C784" },
  loginButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 32,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 16, color: "#9CA3AF", fontSize: 12 },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 32,
  },
  socialCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: "#6B7280" },
  footerLink: { color: "#2E7D32", fontWeight: "bold" },
});