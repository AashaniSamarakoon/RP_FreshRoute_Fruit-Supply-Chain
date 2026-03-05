import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../utils/supabaseClient";

export default function GlobalTelemetry() {
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState({ temp: 0, humidity: 0 });
  const [activeAlert, setActiveAlert] = useState<{
    message: string;
    type: string;
  } | null>(null);
  const [showAlertDetails, setShowAlertDetails] = useState(false);

  // Slide animation for the detail popup
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    setupMonitoring();
  }, []);

  useEffect(() => {
    // Animate popup when toggled
    if (showAlertDetails) {
      Animated.timing(slideAnim, {
        toValue: 60, // Slide down to visible area (below header)
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -200, // Hide above screen
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showAlertDetails]);

  const setupMonitoring = async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (!userJson) return;
      const user = JSON.parse(userJson);

      // Only for Transporters
      if (user.role !== "transporter") return;

      const { data } = await supabase
        .from("transporter")
        .select("vehicle_id")
        .eq("user_id", user.id)
        .single();

      if (data?.vehicle_id) {
        setVehicleId(data.vehicle_id);
        fetchInitialData(data.vehicle_id);
        subscribeToVehicle(data.vehicle_id);
        subscribeToAlerts(data.vehicle_id);
      }
    } catch (e) {
      console.error("Telemetry setup failed", e);
    }
  };

  const fetchInitialData = async (vId: string) => {
    // 1. Get Telemetry
    const { data: vData } = await supabase
      .from("vehicles")
      .select("current_temp, current_humidity")
      .eq("id", vId)
      .single();

    if (vData) {
      setTelemetry({
        temp: vData.current_temp || 0,
        humidity: vData.current_humidity || 0,
      });
    }

    // 2. Check for Existing Unread Alerts
    const { data: alertData } = await supabase
      .from("alerts")
      .select("*")
      .eq("vehicle_id", vId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (alertData) {
      setActiveAlert({
        message: alertData.message,
        type: alertData.alert_type,
      });
    }
  };

  const subscribeToVehicle = (vId: string) => {
    supabase
      .channel(`vehicle-telemetry:${vId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${vId}`,
        },
        (payload) => {
          setTelemetry({
            temp: payload.new.current_temp,
            humidity: payload.new.current_humidity,
          });
        }
      )
      .subscribe();
  };

  const subscribeToAlerts = (vId: string) => {
    supabase
      .channel(`vehicle-alerts:${vId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `vehicle_id=eq.${vId}`,
        },
        (payload) => {
          setActiveAlert({
            message: payload.new.message,
            type: payload.new.alert_type,
          });
          // Auto-open on new alert
          setShowAlertDetails(true);
        }
      )
      .subscribe();
  };

  if (!vehicleId) return null;

  return (
    <>
      {/* 1. FLOATING PILL (Bottom Right) */}
      <View style={[styles.statusBar, activeAlert ? styles.statusAlert : null]}>
        {/* Temp */}
        <View style={styles.metric}>
          <Ionicons name="thermometer" size={16} color="#e53e3e" />
          <Text style={styles.metricText}>{telemetry.temp.toFixed(1)}°C</Text>
        </View>

        {/* Humidity */}
        <View style={[styles.metric, styles.metricBorder]}>
          <Ionicons name="water" size={16} color="#3182ce" />
          <Text style={styles.metricText}>
            {telemetry.humidity.toFixed(1)}%
          </Text>
        </View>

        {/* ALERT TRIGGER ICON (Visible only if alert exists) */}
        {activeAlert && (
          <TouchableOpacity
            style={styles.alertIconBtn}
            onPress={() => setShowAlertDetails(!showAlertDetails)}
          >
            <Ionicons name="warning" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. ALERT POPUP DETAILS (Slides down from top) */}
      {activeAlert && (
        <Animated.View
          style={[
            styles.alertPopup,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>⚠️ CRITICAL ALERT</Text>
            <Text style={styles.alertText}>{activeAlert.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAlertDetails(false)}>
            <Ionicons name="close-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    position: "absolute",
    bottom: 70,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 999,
  },
  statusAlert: {
    borderColor: "#c53030",
    borderWidth: 2,
  },
  metric: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  metricBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "#cbd5e0",
    marginLeft: 6,
    paddingLeft: 10,
  },
  metricText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#2d3748",
    marginLeft: 4,
  },

  // The Warning Icon Button
  alertIconBtn: {
    backgroundColor: "#c53030",
    borderRadius: 20,
    padding: 6,
    marginLeft: 10,
    shadowColor: "#c53030",
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },

  // Popup Styles
  alertPopup: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    backgroundColor: "#c53030",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    elevation: 20,
  },
  alertTitle: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.9,
  },
  alertText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
