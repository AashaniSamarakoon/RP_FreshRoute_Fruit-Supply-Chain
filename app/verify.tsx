import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function VerifyOTP() {
  const router = useRouter();
  const { email, role } = useLocalSearchParams<{
    email: string;
    role: string;
  }>();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (token.length !== 6)
      return Alert.alert("Error", "Please enter the 6-digit code.");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email as string,
        token,
        type: "signup",
      });

      if (error) throw error;

      if (data.session) {
        Alert.alert("Verified!", "Account successfully activated.");
        router.replace(`/${role?.toLowerCase()}` as any);
      }
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>

      <TextInput
        style={styles.otpInput}
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={token}
        onChangeText={setToken}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleVerify}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  otpInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 10,
    fontWeight: "bold",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#2E7D32",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
