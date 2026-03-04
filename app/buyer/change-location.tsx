import LocationPicker, { PickerPayload } from "@/components/LocationPicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";

export default function ChangeLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    location?: string;
  }>();

  const [initialLat, setInitialLat] = React.useState<number | undefined>(
    undefined,
  );
  const [initialLng, setInitialLng] = React.useState<number | undefined>(
    undefined,
  );
  const [initialAddress, setInitialAddress] = React.useState<
    string | undefined
  >(undefined);

  // whenever screen comes into focus, recompute from params and storage
  React.useEffect(() => {
    const compute = async () => {
      console.log("[ChangeLocation] focus params", params);
      let lat = params.latitude ? parseFloat(params.latitude) : undefined;
      let lng = params.longitude ? parseFloat(params.longitude) : undefined;
      let addr = params.location || undefined;

      try {
        const saved = await AsyncStorage.getItem("order_form");
        if (saved) {
          const obj = JSON.parse(saved);
          if (typeof obj.latitude === "number") lat = obj.latitude;
          if (typeof obj.longitude === "number") lng = obj.longitude;
          if (typeof obj.deliveryLocation === "string")
            addr = obj.deliveryLocation;
        }
      } catch (e) {
        console.warn("[ChangeLocation] unable to merge storage", e);
      }

      setInitialLat(lat);
      setInitialLng(lng);
      setInitialAddress(addr);
      console.log("[ChangeLocation] computed initial", { lat, lng, addr });
    };
    compute();
  }, [params.latitude, params.longitude, params.location]);

  const handleDone = async (payload: PickerPayload) => {
    console.log("[ChangeLocation] done payload", payload, "initial stored", {
      initialLat,
      initialLng,
    });
    // persist into order_form storage so the form always has the latest
    try {
      const existing = await AsyncStorage.getItem("order_form");
      const obj = existing ? JSON.parse(existing) : {};
      const updated = {
        ...obj,
        deliveryLocation: payload.location,
        latitude: payload.lat,
        longitude: payload.lng,
      };
      await AsyncStorage.setItem("order_form", JSON.stringify(updated));
    } catch (e) {
      console.warn("[ChangeLocation] failed to save to storage", e);
    }

    // simply go back to the previous screen; PlaceOrder focusEffect will rehydrate
    router.back();
  };

  return (
    <LocationPicker
      initialLatitude={initialLat}
      initialLongitude={initialLng}
      initialAddress={initialAddress}
      onDone={handleDone}
      doneLabel="Done"
    />
  );
}

export const options = { headerShown: false };
