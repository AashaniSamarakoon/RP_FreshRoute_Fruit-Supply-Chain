import api from "@/services/api";
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

type Role = "FARMER" | "TRANSPORTER" | "BUYER";

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // Capturing phone for unified login
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("FARMER");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Inside app/signup.tsx -> handleSignup
  const handleSignup = async () => {
    if (!name || !email || !password || !phone) {
      return Alert.alert("Required", "Please fill in all details.");
    }

    setLoading(true);
    try {
      // Split name for your backend controller
      const [first_name, ...lastNameArr] = name.trim().split(" ");
      const last_name = lastNameArr.join(" ");

      const data = await api.post("/api/auth/signup", {
        first_name,
        last_name,
        email,
        phone,
        password,
        role: role.toLowerCase(),
      });

      Alert.alert("Success", `Status: ${data.blockchainStatus}`);
      await AsyncStorage.setItem("token", data.token);
      router.replace(`/${role.toLowerCase()}` as any);
    } catch (err) {
      Alert.alert("Signup Error", err.message);
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create an Account</Text>
          <Text style={styles.subtitle}>
            Join the FreshRoute network and streamline your supply chain
            journey.
          </Text>
        </View>

        <View style={styles.form}>
          <InputGroup
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name.."
            icon="person-outline"
          />
          <InputGroup
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Email address.."
            keyboardType="email-address"
            icon="mail-outline"
          />
          <InputGroup
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            placeholder="07x xxxxxxx"
            keyboardType="phone-pad"
            icon="call-outline"
          />

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, borderBottomWidth: 0, marginBottom: 0 },
                ]}
                placeholder="Secure password"
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
          </View>
        </View>

        <Text style={styles.label}>I am a...</Text>
        <View style={styles.roleRow}>
          <RoleItem
            label="Farmer"
            value="FARMER"
            icon="leaf"
            active={role === "FARMER"}
            onSelect={setRole}
          />
          <RoleItem
            label="Driver"
            value="TRANSPORTER"
            icon="truck"
            active={role === "TRANSPORTER"}
            onSelect={setRole}
          />
          <RoleItem
            label="Buyer"
            value="BUYER"
            icon="shopping"
            active={role === "BUYER"}
            onSelect={setRole}
          />
        </View>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signupButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or continue with</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <SocialButton icon="google" color="#DB4437" />
          <SocialButton icon="apple" color="#000000" />
          <SocialButton icon="facebook" color="#4267B2" />
        </View> */}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Optimized Sub-components
const InputGroup = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  icon,
}: any) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.passwordContainer}>
      <Ionicons
        name={icon}
        size={18}
        color="#6B7280"
        style={{ marginRight: 10 }}
      />
      <TextInput
        style={[
          styles.input,
          {
            flex: 1,
            borderBottomWidth: 0,
            marginBottom: 0,
            backgroundColor: "transparent",
            paddingLeft: 0,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  </View>
);

const RoleItem = ({ label, value, icon, active, onSelect }: any) => (
  <TouchableOpacity
    style={[styles.roleCard, active && styles.roleCardActive]}
    onPress={() => onSelect(value)}
  >
    <MaterialCommunityIcons
      name={icon}
      size={24}
      color={active ? "#2E7D32" : "#6B7280"}
    />
    <Text style={[styles.roleCardText, active && styles.roleCardTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SocialButton = ({ icon, color }: { icon: any; color: string }) => (
  <TouchableOpacity
    style={[styles.socialCircle, { borderColor: color + "33" }]}
  >
    <MaterialCommunityIcons name={icon} size={26} color={color} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  header: { marginBottom: 32 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: "#6B7280", lineHeight: 20 },
  form: { marginBottom: 20 },
  inputWrapper: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    padding: 16,
    fontSize: 15,
    color: "#111827",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  roleCard: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  roleCardActive: { borderColor: "#2E7D32", backgroundColor: "#E8F5E9" },
  roleCardText: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  roleCardTextActive: { color: "#2E7D32", fontWeight: "700" },
  signupButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    elevation: 5,
  },
  signupButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
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
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: "#6B7280" },
  footerLink: { color: "#2E7D32", fontWeight: "bold" },
});
