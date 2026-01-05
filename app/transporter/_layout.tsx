import { Stack } from "expo-router";
import React from "react";
import GlobalTelemetry from "../../components/GlobalTelemetry"; // Adjust path if needed
import { useRealtimeAlerts } from "../../hooks/useRealtimeAlerts"; // Adjust path if needed

export default function TransporterLayout() {
  // 1. Activate the Hook (Optional if GlobalTelemetry handles logic internally)
  // If GlobalTelemetry has its own logic, you might not need this hook here.
  // But if the hook handles distinct global alerts (like native toasts), keep it.
  useRealtimeAlerts();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false, // Hides "transporter/index" header
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="map/[id]" />
      </Stack>

      {/* 2. Add the Floating Widget here so it sits on top of all Transporter screens */}
      <GlobalTelemetry />
    </>
  );
}
