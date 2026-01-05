import { Tabs } from "expo-router";
import { Home, Package, ShoppingCart, Tag, User } from "lucide-react-native";

export default function BuyerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2E7D32",
        tabBarInactiveTintColor: "#666",
        tabBarShowLabel: true,
        tabBarStyle: {
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 19,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 4,
        },
        tabBarIconStyle: {
          alignItems: "center",
          justifyContent: "center",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketPrice"
        options={{
          title: "Market Price",
          tabBarIcon: ({ color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="freshroutePrices"
        options={{
          title: "FreshRoute",
          tabBarIcon: ({ color, size }) => (
            <Tag size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart size={size} color={color} />
          ),
        }}
      />
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
