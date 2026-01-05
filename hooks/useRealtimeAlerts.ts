import { useEffect } from "react";
import { Alert } from "react-native";
import { supabase } from "../utils/supabaseClient"; // Your standard supabase client export

export function useRealtimeAlerts() {
  useEffect(() => {
    // 1. Set up the subscription
    const channel = supabase
      .channel("public:alerts") // Subscribe to the 'alerts' table
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const newAlert = payload.new;
          console.log("Realtime Alert Received:", newAlert);

          // 2. Show UI Notification (Simple Native Alert for now)
          Alert.alert("⚠️ SHIPMENT ALERT", newAlert.message, [
            { text: "Check Details" },
          ]);

          // Note: In a real app, you would check if this alert
          // belongs to the logged-in user (by comparing order_id)
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
