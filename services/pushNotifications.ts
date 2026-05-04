import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

type PushTokenPayload = {
  user_id: string;
  expo_push_token: string;
  platform: string;
  updated_at: string;
};

const getProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#22c55e",
  });
};

const savePushToken = async (payload: PushTokenPayload) => {
  try {
    await api.post("/api/push-tokens", {
      expoPushToken: payload.expo_push_token,
      platform: payload.platform,
    });
    return;
  } catch (error) {
    console.warn("[PushNotifications] Backend token save failed; falling back to Supabase", error);
  }

  const { error } = await supabase
    .from("user_push_tokens")
    .upsert(payload, { onConflict: "user_id,expo_push_token" });

  if (error) {
    console.error("[PushNotifications] Failed to save push token:", error.message);
  }
};

export async function registerForPushNotificationsAsync(userId: string) {
  try {
    if (!Device.isDevice) {
      console.log("[PushNotifications] Push notifications require a physical device");
      return null;
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;

    if (existing.status !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    if (finalStatus !== "granted") {
      console.log("[PushNotifications] Push notification permission not granted");
      return null;
    }

    const projectId = getProjectId();
    if (!projectId) {
      console.warn("[PushNotifications] Missing EAS projectId; cannot request Expo push token");
      return null;
    }

    await ensureAndroidChannel();

    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;

    await savePushToken({
      user_id: userId,
      expo_push_token: token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    });

    return token;
  } catch (error) {
    console.warn(
      "[PushNotifications] Registration skipped; login will continue",
      error,
    );
    return null;
  }
}
