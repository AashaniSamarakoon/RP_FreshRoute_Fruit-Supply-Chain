import TrustProfileComponent from "@/components/TrustProfileComponent";
import { useLocalSearchParams } from "expo-router";

export default function BuyerTrustProfileScreen() {
  const { id } = useLocalSearchParams();

  return <TrustProfileComponent userType="buyer" userId={id as string} />;
}
