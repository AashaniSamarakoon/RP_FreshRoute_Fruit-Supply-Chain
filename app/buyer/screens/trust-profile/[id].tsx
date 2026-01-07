import FarmerTrustProfile from "@/components/FarmerTrustProfile";
import { useLocalSearchParams } from "expo-router";

export default function FarmerTrustProfileScreen() {
  const { id, farmerName, farmLocation, trustScore, imageUrls } =
    useLocalSearchParams();

  // Pass the farmer data from route params to avoid extra API call
  const initialProfileData = farmerName
    ? {
        farmerName: farmerName as string,
        farmLocation: farmLocation as string,
        trustScore: trustScore as string,
        imageUrls: imageUrls ? (imageUrls as string).split(",") : undefined,
      }
    : undefined;

  return (
    <FarmerTrustProfile
      farmerId={id as string}
      initialData={initialProfileData}
    />
  );
}
