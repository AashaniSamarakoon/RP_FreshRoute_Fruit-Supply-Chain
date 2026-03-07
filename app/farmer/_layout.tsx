import { useNotifications } from "@/hooks/useNotifications";
import { Stack } from "expo-router";

function NotificationWatcher() {
  useNotifications("farmer");
  return null;
}

export default function FarmerLayout() {
  return (
    <>
      <NotificationWatcher />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
