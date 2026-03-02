import { useRouter } from "expo-router";
import { useEffect } from "react";

// this index exists solely to suppress the automatic header title for the
// parent "onboarding" route.  we immediately redirect users into the first
// step so the parent screen never renders.
export default function OnboardingIndex() {
  const router = useRouter();
  useEffect(() => {
    // choose an appropriate entry point based on stored role or just send to
    // farmer by default; the signup handler already forwards correctly so this
    // is mostly a safety net for manual navigation.
    router.replace("/onboarding/farmer/location" as any);
  }, []);
  return null;
}

// hide header on this artificial screen as well
export const options = {
  headerShown: false,
};
