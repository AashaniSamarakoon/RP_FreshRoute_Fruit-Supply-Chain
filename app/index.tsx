// app/index.tsx
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

type Role = "farmer" | "transporter" | "buyer";

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
          // Sync the user into our manual AsyncStorage key so other screens that
          // read it still work correctly.
          await AsyncStorage.setItem("user", JSON.stringify(user));
          if (session.access_token) {
            await AsyncStorage.setItem("token", session.access_token);
          }
          const role = (user.user_metadata?.role as string || "buyer").toLowerCase() as Role;
          const route = getDashboardRoute(role);
          router.replace(route as any);
          return;
        }

        // No active Supabase session — send to login
        router.replace("/login");
      } catch (e) {
        router.replace("/login");
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
    default:
      return "/login";
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
