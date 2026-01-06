import { Tabs } from "expo-router";
import { Home } from "lucide-react-native";

export default function TransporterLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
