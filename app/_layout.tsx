import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { TranslationProvider } from "@/context/TranslationContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
export const unstable_settings = {
  // anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("[RootLayout] session:", session);
      if (session) {
        // already logged in; determine destination
        let user: any = null;
        try {
          const stored = await AsyncStorage.getItem("user");
          user = stored ? JSON.parse(stored) : null;
        } catch {}
        // supabase session.role is often "authenticated" – use
        // the custom metadata role if present, or fall back to stored user
        // object. finally lowercase for routing.
        let computed = session.user?.user_metadata?.role || user?.role;
        if (computed === "authenticated") {
          // metadata role might be BUYER/FARMER etc
          computed = session.user?.user_metadata?.role;
        }
        const role = computed.toLowerCase();
        console.log("[RootLayout] computed role", role);

        // check for onboarding flag stored locally (set when the final step
        // of the onboarding flow completes).  this allows us to redirect
        // back into the flow if a user quits before finishing.
        const onboardedFlag = await AsyncStorage.getItem("onboarded");
        const onboarded = onboardedFlag === "true";
        if (!onboarded && (role === "farmer" || role === "buyer")) {
          const startPath =
            role === "farmer"
              ? "/onboarding/farmer/farm-info"
              : "/onboarding/buyer/business";
          router.replace(startPath as any);
          return;
        }

        // replace stack with role-specific path (farmer/buyer/transporter)
        // role should be one of "farmer" | "buyer" | "transporter".
        // only redirect if it matches one of the known routes; otherwise
        // keep the default stack (login/index) and log for debugging.
        const dest = `/${role}`;
        const allowed = ["/farmer", "/buyer", "/transporter"];
        if (allowed.includes(dest)) {
          router.replace(dest as unknown as any);
        } else {
          console.warn("RootLayout: unexpected role for redirect", role);
        }
      }
    };
    check();
  }, [router]);

  return (
    <TranslationProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
        <StatusBar style="inverted" />
      </ThemeProvider>
    </TranslationProvider>
  );
}
