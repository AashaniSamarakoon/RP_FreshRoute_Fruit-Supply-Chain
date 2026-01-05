import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { TranslationProvider } from "@/context/TranslationContext";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  // anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <TranslationProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack initialRouteName="index">
          <Stack.Screen name="index" options={{ headerShown: false }} />
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
        <StatusBar style="inverted" />
      </ThemeProvider>
    </TranslationProvider>
  );
}
