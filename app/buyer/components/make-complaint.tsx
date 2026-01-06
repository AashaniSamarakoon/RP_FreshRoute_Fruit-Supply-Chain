import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MakeComplaint() {
  const router = useRouter();
  const [orderId, setOrderId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        if (user.role !== "buyer") {
          router.replace("/buyer");
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (!orderId.trim() || !reason.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    router.push({
      pathname: "/buyer/complaint-camera" as any,
      params: {
        orderId,
        reason,
        description,
        date: new Date().toISOString(),
      },
    });
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Make a Complaint</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Order ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter order ID"
            value={orderId}
            onChangeText={setOrderId}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter complaint reason"
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your complaint in detail"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#11181C",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  nextButton: {
    backgroundColor: "#2f855a",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 24,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

