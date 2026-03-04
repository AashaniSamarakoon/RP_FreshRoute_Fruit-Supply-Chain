import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState } from "react";

// 1. Define the shapes of your data
export type FarmerData = {
  lat?: number;
  lng?: number;
  location?: string;
  farm_size?: number;
  primary_crops?: string[];
};

export type BuyerData = {
  lat?: number;
  lng?: number;
  location?: string;
  company_name?: string;
  tax_tin_number?: string;
  business_registration_url?: string;
  // KYC document URLs
  nic_front_url?: string;
  nic_back_url?: string;
  br_url?: string;
  avatar_url?: string;
};

export type OnboardingContextType = {
  farmerData: FarmerData;
  buyerData: BuyerData;
  updateFarmerData: (data: Partial<FarmerData>) => void;
  updateBuyerData: (data: Partial<BuyerData>) => void;
  clearOnboardingData: () => void;
};

// 2. Create the Context
const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

// 3. Create the Provider Component
export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [farmerData, setFarmerData] = useState<FarmerData>({});
  const [buyerData, setBuyerData] = useState<BuyerData>({});

  // load persisted state when provider mounts
  React.useEffect(() => {
    AsyncStorage.getItem("onboarding_farmer").then((stored) => {
      if (stored) setFarmerData(JSON.parse(stored));
    });
    AsyncStorage.getItem("onboarding_buyer").then((stored) => {
      if (stored) setBuyerData(JSON.parse(stored));
    });
  }, []);

  // Merges new data with existing data
  const updateFarmerData = (data: Partial<FarmerData>) => {
    setFarmerData((prev) => {
      const next = { ...prev, ...data };
      AsyncStorage.setItem("onboarding_farmer", JSON.stringify(next));
      return next;
    });
  };

  const updateBuyerData = (data: Partial<BuyerData>) => {
    setBuyerData((prev) => {
      const next = { ...prev, ...data };
      AsyncStorage.setItem("onboarding_buyer", JSON.stringify(next));
      return next;
    });
  };

  const clearOnboardingData = () => {
    setFarmerData({});
    setBuyerData({});
    AsyncStorage.removeItem("onboarding_farmer");
    AsyncStorage.removeItem("onboarding_buyer");
  };

  return (
    <OnboardingContext.Provider
      value={{
        farmerData,
        buyerData,
        updateFarmerData,
        updateBuyerData,
        clearOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

// 4. Custom Hook for easy access
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
