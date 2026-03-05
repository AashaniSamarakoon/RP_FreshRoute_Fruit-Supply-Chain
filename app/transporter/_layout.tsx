import { Stack, usePathname } from "expo-router"; // 1. Import usePathname
import React from "react";
import GlobalTelemetry from "../../components/GlobalTelemetry";
import { useRealtimeAlerts } from "../../hooks/useRealtimeAlerts";

export default function TransporterLayout() {
  useRealtimeAlerts();

  // 2. Get current path
  const pathname = usePathname();

  const showWidget =
    pathname === "/transporter" ||
    // pathname.includes("/map") ||
    pathname.includes("/job");

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="job/[id]" />
        <Stack.Screen name="map/[id]" />
      </Stack>

      {/* 4. Conditionally Render */}
      {showWidget && <GlobalTelemetry />}
    </>
  );
}
