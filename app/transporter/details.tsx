// app/transporter/details.tsx
import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function TransporterDetails() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        🚚 Transporter Details Page
      </Text>

      <Text>This is the details screen for the transporter.</Text>

      <Button title="Go Back" onPress={() => router.back()} />
    </View>
  );
}
