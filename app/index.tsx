// app/index.tsx
import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type Role = "farmer" | "transporter" | "buyer" | "admin";

/**
 * Checks whether the current session user has completed onboarding.
 * Resolution order (fastest → slowest):
 *  1. Local AsyncStorage flag ("onboarded" === "true")
 *  2. Supabase user_metadata (is_onboarded / isOnboarded)
 *  3. Backend /api/auth/me (writes flag to cache on success)
 *
 * IMPORTANT: defaults to TRUE on any ambiguous / error case so that an
 * onboarded user is NEVER incorrectly kicked back to the onboarding flow.
 * Only returns false when the server explicitly says is_onboarded === false.
 */
async function resolveOnboardingStatus(session: any): Promise<boolean> {
  // 1. Local cache
  const flag = await AsyncStorage.getItem("onboarded");
  if (flag === "true") return true;

  // 2. Supabase user metadata
  const meta = session?.user?.user_metadata ?? {};
  if (meta.is_onboarded || meta.isOnboarded) {
    await AsyncStorage.setItem("onboarded", "true");
    return true;
  }

  // 3. Server check (network)
  try {
    const resp: any = await api.get("/api/auth/me");
    console.log("[index] /api/auth/me ->", resp);
    const serverOnboarded =
      resp?.isOnboarded ??
      resp?.is_onboarded ??
      resp?.profile?.isOnboarded ??
      resp?.profile?.is_onboarded;

    if (serverOnboarded === false) {
      // Explicitly not onboarded — respect it
      return false;
    }
    // Truthy value or undefined/null → treat as onboarded (safe default)
    await AsyncStorage.setItem("onboarded", "true");
    return true;
  } catch (e) {
    // Network error — don't kick user to onboarding
    console.warn("[index] could not reach /api/auth/me, assuming onboarded", e);
    return true;
  }
}

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primary: check active Supabase session (persisted by SDK across app restarts)
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const user = session.user;
          // Sync into AsyncStorage so other screens that read it still work.
          await AsyncStorage.setItem("user", JSON.stringify(user));
          if (session.access_token) {
            await AsyncStorage.setItem("token", session.access_token);
          }

          const role = ((user.user_metadata?.role as string) || "buyer").toLowerCase() as Role;

          // Guard: if onboarding isn't complete, send back into the flow.
          if (role === "farmer" || role === "buyer") {
            const onboarded = await resolveOnboardingStatus(session);
            if (!onboarded) {
              const startPath =
                role === "farmer"
                  ? "/onboarding/farmer/farm-info"
                  : "/onboarding/buyer/business";
              router.replace(startPath as any);
              return;
            }
          }

          const route = getDashboardRoute(role);
          router.replace(route as any);
          return;
        }

        // No active Supabase session — show intro screens (landing → onboarding-one → onboarding-two) then login
        router.replace("/landing" as any);
      } catch (e) {
        router.replace("/landing" as any);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

function getDashboardRoute(role: Role) {
  switch (role) {
    case "farmer":
      return "/farmer";
    case "transporter":
      return "/transporter";
    case "buyer":
      return "/buyer";
    case "admin":
      return "/admin";
    default:
      return "/login";
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
