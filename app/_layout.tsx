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
import api from "@/services/api";
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
        // try to determine whether the user has already completed onboarding.
        // we keep a local cache so we can redirect quickly on startup, but
        // the cache can be wiped (app reinstall, manual clear, etc.).  in
        // that case we fall back to querying the server and then repopulate
        // the flag so future launches are fast.
        async function isOnboarded() {
          const flag = await AsyncStorage.getItem("onboarded");
          if (flag === "true") {
            return true;
          }

          // if no local flag, ask the backend.  your API should expose the
          // onboarding state in a lightweight endpoint; here we assume
          // `/api/auth/me` returns an object with `isOnboarded`.
          try {
            const resp: any = await api.get("/api/auth/me");
            console.log("[RootLayout] /api/auth/me ->", resp);
            // older responses might put the flag at top-level; new backend subjects
            // have it nested inside `profile.is_onboarded` (snake case).  normalize
            // to a boolean so we can handle both.
            const serverOnboarded =
              resp?.isOnboarded ||
              resp?.is_onboarded ||
              resp?.profile?.is_onboarded ||
              resp?.profile?.isOnboarded;

            if (serverOnboarded) {
              await AsyncStorage.setItem("onboarded", "true");
              console.log("[RootLayout] refreshed onboarded flag from server");
              return true;
            }
          } catch (e) {
            console.warn("[RootLayout] failed to fetch onboarding status", e);
          }
          return false;
        }

        const onboarded = await isOnboarded();
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
