import { Stack } from "expo-router";
import React from "react";
import { OnboardingProvider } from "./OnboardingContext";

// simple invisible header stack for onboarding flow
export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      />
    </OnboardingProvider>
  );
}
