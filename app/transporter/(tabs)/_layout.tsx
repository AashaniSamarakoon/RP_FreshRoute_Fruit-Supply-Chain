import { Tabs } from "expo-router";
import { Home, Truck, User } from "lucide-react-native";

export default function TransporterTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2E7D32", // Green for active
        tabBarInactiveTintColor: "#666",
        tabBarShowLabel: true,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 0,
          marginBottom: 5,
        },
      }}
    >
      {/* 1. Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      {/* 2. Vehicle Tab */}
      <Tabs.Screen
        name="vehicle"
        options={{
          title: "Vehicle",
          tabBarIcon: ({ color, size }) => <Truck size={size} color={color} />,
        }}
      />

      {/* 3. Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
