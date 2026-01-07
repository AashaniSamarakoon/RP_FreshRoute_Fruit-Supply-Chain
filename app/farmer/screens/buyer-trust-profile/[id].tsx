import BuyerTrustProfile from "@/components/BuyerTrustProfile";
import { useLocalSearchParams } from "expo-router";

export default function BuyerTrustProfileScreen() {
  const { id, buyerName, buyerLocation, trustScore } = useLocalSearchParams();

  // Pass the buyer data from route params to avoid extra API call
  const initialProfileData = buyerName
    ? {
        name: buyerName as string,
        location: buyerLocation as string,
        trustScore: trustScore as string,
      }
    : undefined;

  return (
    <BuyerTrustProfile
      buyerId={id as string}
      initialData={initialProfileData}
    />
  );
}
