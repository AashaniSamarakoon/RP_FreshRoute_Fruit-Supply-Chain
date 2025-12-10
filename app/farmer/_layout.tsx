import { Stack } from 'expo-router';

export default function FarmerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="forecast" />
      <Stack.Screen name="fruit-forecast" />
      <Stack.Screen name="live-market" />
      <Stack.Screen name="daily-prices" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="notification-detail" />
      <Stack.Screen name="accuracy-insights" />
      <Stack.Screen name="feedback" />
    </Stack>
  );
}
