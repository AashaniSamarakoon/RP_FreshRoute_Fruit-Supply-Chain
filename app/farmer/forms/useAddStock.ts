import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform } from "react-native";
import { BACKEND_URL } from "../../../config";

interface FruitPropertyRow {
  id: number;
  name: string;
  variety: string;
}

interface AddStockFormData {
  fruit: string | null;
  category: string | null;
  quantity: string;
  unit: string;
  grade: string;
  estimatedDate: string;
  images: string[]; // <--- CHANGED: Array of strings
}

interface AddStockFormState {
  formData: AddStockFormData;
  loading: boolean;
  datePickerVisible: boolean;
  dateValue: Date | null;
  fruitItems: { label: string; value: string }[];
  categoryItems: { label: string; value: string }[];
  errors: Record<string, string>;
}

export const useAddStock = () => {
  const router = useRouter();

  const [rows, setRows] = useState<FruitPropertyRow[]>([]);
  const [state, setState] = useState<AddStockFormState>({
    formData: {
      fruit: null,
      category: null,
      quantity: "",
      unit: "kg",
      grade: "A",
      estimatedDate: "",
      images: [], // <--- Init Empty Array
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
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const res = await fetch(`${BACKEND_URL}/api/fruit-properties`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          Alert.alert("Error", `Failed to load fruit properties`);
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        const raw = await res.json();
        const data: FruitPropertyRow[] = Array.isArray(raw)
          ? raw
          : raw?.fruits ?? raw?.data ?? [];

        setRows(data);
        const unique = Array.from(new Set(data.map((r) => r.name)));
        const fruitItems = unique.map((name) => ({ label: name, value: name }));

        setState((prev) => ({
          ...prev,
          fruitItems,
          loading: false,
        }));
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load fruit properties");
        setState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadFruitProperties();
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

  const updateField = (field: keyof AddStockFormData, value: any) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
      errors: { ...prev.errors, [field]: "" },
    }));
  };

  // --- UPDATED: Multi-Image Picker ---
  const pickImage = async () => {
    // 1. Check Permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "We need access to your gallery.");
      return;
    }

    // 2. Launch Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", // Fixed deprecated Enum
      allowsMultipleSelection: true, // Allow multiple
      selectionLimit: 10, // Max 10 at a time
      quality: 0.5, // Compression
    });

    if (!result.canceled) {
      // 3. Append new images to existing list (limit total to 10)
      const newUris = result.assets.map((asset) => asset.uri);
      const combinedImages = [...state.formData.images, ...newUris].slice(
        0,
        10
      );

      updateField("images", combinedImages);
    }
  };

  // --- NEW: Remove Image ---
  const removeImage = (indexToRemove: number) => {
    const updatedImages = state.formData.images.filter(
      (_, index) => index !== indexToRemove
    );
    updateField("images", updatedImages);
  };

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

    if (!state.formData.fruit) errors.fruit = "Please select a fruit";
    if (!state.formData.category) errors.category = "Please select a category";
    if (!state.formData.quantity) errors.quantity = "Please enter quantity";
    if (
      !state.formData.estimatedDate ||
      !isFutureDate(state.formData.estimatedDate)
    ) {
      errors.estimatedDate =
        "Please select a future harvest date (tomorrow or later)";
    }
    // Image is optional, but if you want to enforce it uncomment below:
    // if (state.formData.images.length === 0) errors.images = "Please add at least one photo";

    setState((prev) => ({ ...prev, errors }));

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      throw new Error(firstError);
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) return;

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      // --- UPDATED: Construct FormData with Multiple Images ---
      const formData = new FormData();
      formData.append("fruit_type", state.formData.fruit!);
      formData.append("variant", state.formData.category!);
      formData.append("quantity", state.formData.quantity);
      formData.append("grade", state.formData.grade);
      formData.append("estimated_harvest_date", state.formData.estimatedDate);
      formData.append("price_per_unit", "0");

      // Loop through images and append them
      state.formData.images.forEach((uri, index) => {
        const fileType = uri.substring(uri.lastIndexOf(".") + 1);
        formData.append("images", {
          // Key must match backend: upload.array('images')
          uri: uri,
          name: `upload_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      const res = await fetch(`${BACKEND_URL}/api/farmer/add-predict-stock`, {
        method: "POST",
        headers: {
          // Do NOT set Content-Type manually
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const body = await res.json();
      if (!res.ok) {
        console.error("Submit error:", body);
        throw new Error(body.message || "Failed to submit stock");
      }
      // Success - let the caller handle the success feedback
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setDatePickerVisible(false);
    const current = selectedDate || state.dateValue || new Date();
    setDateValue(current);
    updateField("estimatedDate", current.toISOString().slice(0, 10));
  };

  return {
    ...state,
    updateField,
    pickImage, // <--- Exported
    removeImage, // <--- Exported
    setDatePickerVisible,
    setDateValue,
    handleSubmit,
    handleDateChange,
  };
};

export default useAddStock;