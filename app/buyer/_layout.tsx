import { useNotifications } from "@/hooks/useNotifications";
import { Stack } from "expo-router";

function NotificationWatcher() {
  useNotifications("buyer");
  return null;
}

export default function BuyerLayout() {
  return (
    <>
      <NotificationWatcher />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
