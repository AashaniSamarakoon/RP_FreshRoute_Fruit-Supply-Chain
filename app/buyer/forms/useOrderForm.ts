import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { BACKEND_URL } from "../../../config";

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
      latitude: 34.0522,
      longitude: -118.2437,
    },
    loading: true,
    datePickerVisible: false,
    dateValue: null,
    fruitItems: [],
    categoryItems: [],
    errors: {},
  });

  // Load fruit properties data
  useEffect(() => {
    const loadFruitProperties = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 10000); // 10-second timeout

        const res = await fetch(`${BACKEND_URL}/api/fruit-properties`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const text = await res.text();
        let raw: any = text;
        try {
          raw = text ? JSON.parse(text) : text;
          console.log("[useOrderForm] Parsed response:", raw);
        } catch (parseErr) {
          console.log("[useOrderForm] Parse error:", parseErr);
          // fall back to raw text
        }

        if (!res.ok) {
          console.log("[useOrderForm] Response not ok, alerting error");
          Alert.alert(
            "Error",
            `Failed to load fruit properties (${res.status})`
          );
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        const data: FruitPropertyRow[] = Array.isArray(raw)
          ? raw
          : raw?.fruits ?? raw?.data ?? raw?.items ?? [];

        console.log("[useOrderForm] Extracted data array:", data);
        if (!Array.isArray(data)) {
          console.log("[useOrderForm] Data not array, raw:", raw);
          Alert.alert("Error", "Unexpected data format from server");
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        setRows(data);
        console.log("[useOrderForm] Set rows with data length:", data.length);

        // unique fruit names
        const unique = Array.from(new Set(data.map((r) => r.name)));
        console.log("[useOrderForm] Unique fruit names:", unique);
        const fruitItems = unique.map((name) => ({ label: name, value: name }));

        console.log("[useOrderForm] Setting fruitItems and loading false");
        setState(prev => ({
          ...prev,
          fruitItems,
          loading: false
        }));
        console.log("[useOrderForm] loadFruitProperties completed successfully");
      } catch (e) {
        console.error("[useOrderForm] Exception:", e);

        setState(prev => ({ ...prev, loading: false }));
      }
    };

    loadFruitProperties();
  }, []);

  // Update category items when fruit changes
  useEffect(() => {
    if (!state.formData.fruit) {
      setState(prev => ({
        ...prev,
        categoryItems: [],
        formData: { ...prev.formData, category: null }
      }));
      return;
    }

    const filtered = rows.filter((r) => r.name === state.formData.fruit);
    const categoryItems = filtered.map((r) => ({ label: r.variety, value: r.variety }));

    setState(prev => ({
      ...prev,
      categoryItems,
      formData: { ...prev.formData, category: null }
    }));
  }, [state.formData.fruit, rows]);

  const updateField = (field: keyof OrderFormData, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: "" } // Clear error when field changes
    }));
  };

  const setDatePickerVisible = (visible: boolean) => {
    setState(prev => ({ ...prev, datePickerVisible: visible }));
  };

  const setDateValue = (date: Date | null) => {
    setState(prev => ({ ...prev, dateValue: date }));
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
    if (!state.formData.estimatedDate || !isFutureDate(state.formData.estimatedDate)) {
      errors.estimatedDate = "Please select a future harvest date (tomorrow or later)";
    }

    setState(prev => ({ ...prev, errors }));

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
        target_price: state.formData.targetPrice ? parseFloat(state.formData.targetPrice) : null,
      };
      const res = await fetch(`${BACKEND_URL}/api/buyer/place-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      console.log("Place order response:", body);
      if (!res.ok) {
        console.error("Submit error:", body);
        Alert.alert("Error", body.message || "Failed to submit order");
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
      console.error(err);
      Alert.alert("Error", "Could not submit order");
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
    isFormValid: Object.keys(state.errors).length === 0 &&
                 state.formData.fruit &&
                 state.formData.category &&
                 state.formData.quantity &&
                 state.formData.estimatedDate,
  };
};