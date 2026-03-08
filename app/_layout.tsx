import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "react-native";
import "react-native-reanimated";

import { NotificationBannerHost } from "@/components/notifications/NotificationBanner";
import { TranslationProvider } from "@/context/TranslationContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  // anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // NOTE: All initial routing (session check, onboarding guard) lives in
  // app/index.tsx — the single source of truth. Do NOT add redirects here;
  // doing so creates a race condition where the layout fires AFTER index.tsx
  // has already navigated, kicking the user back unexpectedly.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TranslationProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack initialRouteName="index">
            <Stack.Screen name="index" options={{ headerShown: false }} />
            {/* root-level placeholder for the onboarding folder; prevents the
              parent stack from drawing its own header when navigating into the
              flow (matches login/signup approach). */}
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            {/* <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> */}
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="farmer" options={{ headerShown: false }} />
            <Stack.Screen name="buyer" options={{ headerShown: false }} />
            <Stack.Screen name="transporter" options={{ headerShown: false }} />
          </Stack>
          <NotificationBannerHost />
          <StatusBar barStyle="dark-content"/>
        </ThemeProvider>
      </TranslationProvider>
    </GestureHandlerRootView>
  );
}
