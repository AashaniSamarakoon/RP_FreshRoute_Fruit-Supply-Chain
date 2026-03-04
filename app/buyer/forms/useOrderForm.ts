import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

interface FruitPropertyRow {
  id: number;
  name: string;
  variety: string;
}

interface OrderFormData {
  fruit: string | null;
  category: string | null;
  quantity: string;
  unit: string;
  grade: string;
  estimatedDate: string;
  deliveryLocation: string;
  targetPrice: string;
  latitude: number;
  longitude: number;
}

interface OrderFormState {
  formData: OrderFormData;
  loading: boolean;
  datePickerVisible: boolean;
  dateValue: Date | null;
  fruitItems: { label: string; value: string }[];
  categoryItems: { label: string; value: string }[];
  errors: Record<string, string>;
}

export const useOrderForm = () => {
  const router = useRouter();

  const [rows, setRows] = useState<FruitPropertyRow[]>([]);

  // try restoring saved order form data
  const loadSavedForm = async (): Promise<Partial<OrderFormData> | null> => {
    try {
      const saved = await AsyncStorage.getItem("order_form");
      if (saved) {
        console.log("[useOrderForm] restoring saved order form", saved);
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("[useOrderForm] failed to load saved form", e);
    }
    return null;
  };

  const [state, setState] = useState<OrderFormState>({
    formData: {
      fruit: null,
      category: null,
      quantity: "",
      unit: "kg",
      grade: "A",
      estimatedDate: "",
      deliveryLocation: "Colombo",
      targetPrice: "",
      latitude: 6.841238,
      longitude: 80.003446,
    },
    loading: false,
    datePickerVisible: false,
    dateValue: null,
    fruitItems: [],
    categoryItems: [],
    errors: {},
  });

  // Load fruit properties data
  useEffect(() => {
    // restore persisted form values on mount
    loadSavedForm().then((saved) => {
      if (saved) {
        setState((prev) => ({
          ...prev,
          formData: { ...prev.formData, ...saved },
        }));
      }
    });

    const loadFruitProperties = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000); // 10-second timeout

        let raw: any;
        try {
          console.log("[useOrderForm] requesting /api/fruit-properties");
          raw = await api.get(`/api/fruit-properties`);
          console.log("[useOrderForm] raw response:", raw);
        } catch (err: any) {
          console.log("[useOrderForm] Failed to fetch fruit properties", err);
          // if the error message looks like a JSON string, log it separately
          try {
            const parsed = JSON.parse(err.message);
            console.log("[useOrderForm] error body:", parsed);
          } catch {}
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }
        // `api.get` already returns a parsed JSON object, so no need to parse again
        // (the old code checked `res.ok` here, but `res` no longer exists;
        // fetchWithAuth throws on non-OK status so the catch block above
        // handles errors.)

        const data: FruitPropertyRow[] = Array.isArray(raw)
          ? raw
          : (raw?.fruits ?? raw?.data ?? raw?.items ?? []);

        console.log("[useOrderForm] Extracted data array:", data);
        if (!Array.isArray(data)) {
          console.log("[useOrderForm] Data not array, showing form anyway");
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        setRows(data);
        console.log("[useOrderForm] Set rows with data length:", data.length);

        // unique fruit names
        const unique = Array.from(new Set(data.map((r) => r.name)));
        console.log("[useOrderForm] Unique fruit names:", unique);
        const fruitItems = unique.map((name) => ({ label: name, value: name }));

        console.log("[useOrderForm] Setting fruitItems and loading false");
        setState((prev) => ({
          ...prev,
          fruitItems,
          loading: false,
        }));
        console.log(
          "[useOrderForm] loadFruitProperties completed successfully",
        );
      } catch (e) {
        // Silently suppress errors and show form anyway
        if (e instanceof Error && e.name !== "AbortError") {
          console.log(
            "[useOrderForm] Error loading fruit properties, showing form",
          );
        }
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadFruitProperties();
  }, []);

  // fetch buyer profile (location/coords) directly from supabase table
  useEffect(() => {
    const loadBuyerLocation = async () => {
      try {
        const userStr = await AsyncStorage.getItem("user");
        console.log("[useOrderForm] loadBuyerLocation userStr=", userStr);
        if (!userStr) return;
        const user = JSON.parse(userStr);
        console.log("[useOrderForm] loadBuyerLocation user=", user);
        if (!user?.id) return;

        const { data, error } = await supabase
          .from("buyers")
          .select("location, latitude, longitude")
          .eq("user_id", user.id)
          .single();

        console.log("[useOrderForm] supabase buyers fetch result", {
          data,
          error,
        });

        if (error) {
          console.warn("Unable to fetch buyer profile:", error.message);
          return;
        }

        if (data) {
          setState((prev) => {
            // compute location text inside updater to access prev
            let locationText = data.location ?? prev.formData.deliveryLocation;
            if (!data.location && data.latitude && data.longitude) {
              try {
                // reverse geocode synchronously inside updater? we can't await here,
                // so perform outside and pass in via variable.
              } catch {}
            }

            return {
              ...prev,
              formData: {
                ...prev.formData,
                deliveryLocation: locationText,
                latitude:
                  typeof data.latitude === "number"
                    ? data.latitude
                    : prev.formData.latitude,
                longitude:
                  typeof data.longitude === "number"
                    ? data.longitude
                    : prev.formData.longitude,
              },
            };
          });
          // if location text missing, reverse geocode and update again
          if (!data.location && data.latitude && data.longitude) {
            try {
              const rev = await Location.reverseGeocodeAsync({
                latitude: data.latitude,
                longitude: data.longitude,
              });
              if (rev && rev.length > 0) {
                const { name, street, district, city } = rev[0];
                const addressText =
                  `${name || ""} ${street || ""}, ${city || district || ""}`
                    .replace(/^[ ,]+/, "")
                    .trim();
                setState((prev) => ({
                  ...prev,
                  formData: {
                    ...prev.formData,
                    deliveryLocation: addressText,
                  },
                }));
              }
            } catch (err) {
              console.warn("Reverse geocode failed", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load buyer location", err);
      }
    };

    loadBuyerLocation();
  }, []);

  // Update category items when fruit changes
  useEffect(() => {
    if (!state.formData.fruit) {
      setState((prev) => ({
        ...prev,
        categoryItems: [],
        formData: { ...prev.formData, category: null },
      }));
      return;
    }

    const filtered = rows.filter((r) => r.name === state.formData.fruit);
    const categoryItems = filtered.map((r) => ({
      label: r.variety,
      value: r.variety,
    }));

    setState((prev) => ({
      ...prev,
      categoryItems,
      formData: { ...prev.formData, category: null },
    }));
  }, [state.formData.fruit, rows]);

  const updateField = (field: keyof OrderFormData, value: any) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: "" }, // Clear error when field changes
    }));
  };

  // persist form data whenever it changes
  useEffect(() => {
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          "order_form",
          JSON.stringify(state.formData),
        );
      } catch (e) {
        console.warn("[useOrderForm] failed to persist form", e);
      }
    };
    save();
  }, [state.formData]);

  const setDatePickerVisible = (visible: boolean) => {
    setState((prev) => ({ ...prev, datePickerVisible: visible }));
  };

  const setDateValue = (date: Date | null) => {
    setState((prev) => ({ ...prev, dateValue: date }));
  };

  const isFutureDate = (dateStr: string) => {
    if (!dateStr) return false;
    const selected = new Date(dateStr);
    const today = new Date();
    selected.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return selected.getTime() > today.getTime();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!state.formData.fruit) {
      errors.fruit = "Please select a fruit";
    }
    if (!state.formData.category) {
      errors.category = "Please select a category";
    }
    if (!state.formData.quantity) {
      errors.quantity = "Please enter quantity";
    }
    if (
      !state.formData.estimatedDate ||
      !isFutureDate(state.formData.estimatedDate)
    ) {
      errors.estimatedDate =
        "Please select a future harvest date (tomorrow or later)";
    }

    setState((prev) => ({ ...prev, errors }));

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      Alert.alert("Error", firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Not authenticated");
        return;
      }

      const payload = {
        fruit_type: state.formData.fruit,
        variant: state.formData.category,
        quantity: parseInt(state.formData.quantity, 10),
        unit: state.formData.unit,
        grade: state.formData.grade,
        latitude: state.formData.latitude,
        longitude: state.formData.longitude,
        required_date: state.formData.estimatedDate,
        delivery_location: state.formData.deliveryLocation,
        target_price: state.formData.targetPrice
          ? parseFloat(state.formData.targetPrice)
          : null,
      };
      let body: any;
      try {
        body = await api.post(`/api/buyer/place-order`, payload);
        console.log("Place order response:", body);
      } catch (err) {
        console.error("Submit error:", err);
        return {
          success: false,
          farmersFound: false,
          message: "Could not submit order",
          orderId: null,
        };
      }

      // Return the response with farmersFound status and orderId
      return {
        success: true,
        farmersFound: body.farmersFound || false,
        message: body.message || "Order placed successfully",
        orderId: body.id || body.orderId || body.order?.id,
      };
    } catch (err) {
      // Silently suppress errors and return failure gracefully
      return {
        success: false,
        farmersFound: false,
        message: "Could not submit order",
        orderId: null,
      };
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setDatePickerVisible(false);

    const current = selectedDate || state.dateValue || new Date();
    setDateValue(current);
    updateField("estimatedDate", current.toISOString().slice(0, 10));
  };

  return {
    // State
    ...state,

    // Actions
    updateField,
    setDatePickerVisible,
    setDateValue,
    handleSubmit,
    handleDateChange,

    // Computed
    isFormValid:
      Object.keys(state.errors).length === 0 &&
      state.formData.fruit &&
      state.formData.category &&
      state.formData.quantity &&
      state.formData.estimatedDate,
  };
};
