import Header from "@/components/Header";
import ErrorModal from "@/components/modals/ErrorModal";
import { showNotification } from "@/components/notifications/NotificationBanner";
import PaymentInfoModal from "@/components/modals/PaymentInfoModal";
import SuccessModal from "@/components/modals/SuccessModal";
import { BuyerColors } from "@/constants/theme";
import api from "@/services/api";
import { startPayHerePreapproval } from "@/services/payhereService";
import {
  FarmerInfo,
  HarvestJourney,
  PlacedOrder,
  TransporterInfo,
} from "@/types";
import { getBuyerPreferences } from "@/utils/buyerPreferences";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type BuyerGradingImage = {
  id: number;
  image_base64: string;
  predicted_grade: string;
  accuracy: number;
  sequence: number;
  created_at: string;
};

type BuyerGrading = {
  grading_id: string;
  job_id: string;
  order_id: string; // transport order id (orders.id)
  created_at: string;
  images: BuyerGradingImage[];
  images_count: number;
};

type BuyerGradingsResponse = {
  success: boolean;
  message: string;
  order_id: string; // placed order id (placed_orders.id)
  gradings: BuyerGrading[];
  total_gradings?: number;
};

type ReVerifyResult = { detectedGrade: string; confidence: number };

// --- Helpers ---
const getFruitMeta = (fruit: string) => {
  const f = fruit?.toLowerCase() || "";
  if (f.includes("banana"))
    return { emoji: "🍌", bg: "#FEF9C3", text: "#CA8A04" };
  if (f.includes("mango"))
    return { emoji: "🥭", bg: "#FFEDD5", text: "#EA580C" };
  if (f.includes("pineapple"))
    return { emoji: "🍍", bg: "#FEF08A", text: "#A16207" };
  return { emoji: "📦", bg: "#F3F4F6", text: "#6B7280" };
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "AWAITING_PAYMENT":
    case "UNPAID":
      return { bg: "#FEF2F2", text: "#EF4444", label: "Awaiting Payment" };
    case "AUTHORIZED_PAYMENT":
      return { bg: "#FEF2F2", text: "#F59E0B", label: "Authorized" };
    case "EXPIRED":
      return { bg: "#F3F4F6", text: "#6B7280", label: "Expired" };
    case "OPEN":
    case "PENDING_BUYER":
    case "PENDING_FARMER":
      return { bg: "#FFF7ED", text: "#F97316", label: "Pending" };
    case "MATCHED":
      return { bg: "#EEF2FF", text: "#6366F1", label: "Matched" };
    case "IN_TRANSIT":
      return { bg: "#EFF6FF", text: "#3B82F6", label: "In Transit" };
    case "PACKING":
    case "READY_FOR_PICKUP":
      return {
        bg: "#EFF6FF",
        text: "#3B82F6",
        label: status.replace(/_/g, " "),
      };
    case "DELIVERED":
    case "COMPLETED":
      return { bg: "#F0FDF4", text: "#22C55E", label: "Completed" };
    case "CANCELLED":
      return { bg: "#F3F4F6", text: "#6B7280", label: "Cancelled" };
    default:
      return {
        bg: "#F3F4F6",
        text: "#6B7280",
        label: status?.replace(/_/g, " ") || "Unknown",
      };
  }
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    farmerPickup?: string;
  }>();
  const router = useRouter();
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [farmer, setFarmer] = useState<FarmerInfo | null>(null);
  const [transporter, setTransporter] = useState<TransporterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [harvestDate, setHarvestDate] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  // preapproval state removed; we now always hold via PayHere payment
  const [payhereSubmitting, setPayhereSubmitting] = useState(false);
  const [isPriceLocked, setIsPriceLocked] = useState(false);
  const [lockedUnitPrice, setLockedUnitPrice] = useState<number | null>(null);
  const [predictedPrice, setPredictedPrice] = useState<number>(0);
  const [isFetchingForecast, setIsFetchingForecast] = useState(false);
  const [payherePaymentId, setPayherePaymentId] = useState<string | null>(null);
  const [depositPaid, setDepositPaid] = useState<number | null>(null);
  const [successModal, setSuccessModal] = useState<{
    title: string;
    message: string;
    onClose?: () => void;
  } | null>(null);
  const [errorModal, setErrorModal] = useState<{
    title: string;
    message: string;
  } | null>(null);
  // harvested journey data (blockchain history etc)
  const [orderJourney, setOrderJourney] = useState<HarvestJourney | null>(null);

  // ── accordion + proof-of-harvest state ──
  // Start expanded; collapse automatically once the order is paid and in-transit
  const [productDetailExpanded, setProductDetailExpanded] = useState(true);
  const [locationExpanded, setLocationExpanded] = useState(true);
  const [farmerCoords, setFarmerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [harvestProofImages, setHarvestProofImages] = useState<string[]>([]);
  const [proofViewerVisible, setProofViewerVisible] = useState(false);
  const [proofViewerIndex, setProofViewerIndex] = useState(0);

  // ── buyer-side grading history (delivered/completed) ──
  const [buyerGradings, setBuyerGradings] = useState<BuyerGrading[]>([]);
  const [buyerGradingsLoading, setBuyerGradingsLoading] = useState(false);
  const [buyerGradingsError, setBuyerGradingsError] = useState<string | null>(
    null,
  );
  const [autoRefreshOrderUpdates, setAutoRefreshOrderUpdates] = useState(true);
  const [showGradingsPopup, setShowGradingsPopup] = useState(false);
  const [showReverifyConfirm, setShowReverifyConfirm] = useState(false);
  const [reverifyLoading, setReverifyLoading] = useState(false);
  const [reverifyResults, setReverifyResults] = useState<ReVerifyResult[] | null>(
    null,
  );
  const lastOrderStatusRef = useRef<string | null>(null);
  const buyerGradingsLoadedForRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // ── Price-lock key per order ──
  const priceLockKey = params.orderId
    ? `PAYMENT_PRICE_LOCK_${params.orderId}`
    : null;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (params.orderId) fetchOrderDetails();
  }, [params.orderId]);

  useEffect(() => {
    let mounted = true;
    getBuyerPreferences().then((prefs) => {
      if (mounted) setAutoRefreshOrderUpdates(prefs.orderUpdates);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Collapse product details accordion once the order moves to IN_TRANSIT or beyond
  useEffect(() => {
    if (!order?.status) return;
    const trackableStatuses = [
      "AUTHORIZED_PAYMENT",
      "READY_FOR_PICKUP",
      "PICKED_UP",
      "DELIVERED",
      "COMPLETED",
    ];
    if (trackableStatuses.includes(order.status)) {
      setProductDetailExpanded(false);
      setLocationExpanded(false);
    } else {
      // when the order returns to a non-trackable status we should
      // re-open both sections so the user can inspect them again.
      setProductDetailExpanded(true);
      setLocationExpanded(true);
    }
  }, [order?.status]);

  // Load any previously locked price from AsyncStorage
  useEffect(() => {
    if (!priceLockKey) return;
    AsyncStorage.getItem(priceLockKey).then((raw) => {
      if (!raw) return;
      try {
        const lock: { lockedPrice: number; lockedDate: string } =
          JSON.parse(raw);
        setLockedUnitPrice(lock.lockedPrice);
        setIsPriceLocked(true);
      } catch {
        // corrupt data – ignore
      }
    });
  }, [priceLockKey]);

  useEffect(() => {
    if (!autoRefreshOrderUpdates) return;
    const interval = setInterval(() => {
      if (params.orderId && !loading) fetchOrderDetails(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefreshOrderUpdates, params.orderId, loading]);

  const fetchBuyerGradings = async (placedOrderId: string) => {
    if (!placedOrderId) return;
    setBuyerGradingsLoading(true);
    setBuyerGradingsError(null);
    try {
      const data: BuyerGradingsResponse = await api.get(
        `/api/buyer/gradings/${placedOrderId}`,
      );
      const list = Array.isArray(data?.gradings) ? data.gradings : [];
      setBuyerGradings(list);

      // Prefer showing the stored grading images (base64 data URIs) when available
      const latest = list?.[0];
      const imgs = (latest?.images ?? []).slice().sort((a, b) => {
        const s0 = Number(a.sequence ?? 0);
        const s1 = Number(b.sequence ?? 0);
        return s0 - s1;
      });
      if (imgs.length > 0) {
        const uris = imgs.map((img) => {
          const b64 = img.image_base64 ?? "";
          return b64.startsWith("data:")
            ? b64
            : `data:image/jpeg;base64,${b64}`;
        });
        setHarvestProofImages(uris);
      }
      buyerGradingsLoadedForRef.current = placedOrderId;
    } catch (e) {
      setBuyerGradings([]);
      setBuyerGradingsError(
        e instanceof Error ? e.message : "Failed to load gradings",
      );
    } finally {
      setBuyerGradingsLoading(false);
    }
  };

  const handleBuyerReverify = async () => {
    const latest = buyerGradings?.[0];
    const images = (latest?.images ?? []).slice().sort((a, b) => {
      const s0 = Number(a.sequence ?? 0);
      const s1 = Number(b.sequence ?? 0);
      return s0 - s1;
    });
    if (images.length !== 5) {
      setErrorModal({
        title: "Not available",
        message:
          images.length === 0
            ? "No grading images found to re-verify."
            : "Re-verify expects exactly 5 grading images.",
      });
      return;
    }

    setReverifyLoading(true);
    setReverifyResults(null);
    try {
      const formData = new FormData();
      images.forEach((img, i) => {
        const uri = (img.image_base64 ?? "").startsWith("data:")
          ? img.image_base64
          : `data:image/jpeg;base64,${img.image_base64 ?? ""}`;
        formData.append("images", {
          uri,
          type: "image/jpeg",
          name: `img_${i + 1}.jpg`,
        } as any);
      });

      const data: any = await api.postForm(`/api/fruit-grading/predict`, formData);
      if (!data?.success || !Array.isArray(data?.predictions)) {
        throw new Error(data?.message || "Invalid response from server");
      }
      const results: ReVerifyResult[] = data.predictions.map((p: any) => ({
        detectedGrade:
          (p?.predictedClass || "").toString().replace(/_/g, " ").trim() || "—",
        confidence: p?.confidence ?? 0,
      }));
      setReverifyResults(results);
      setShowGradingsPopup(true);
    } catch (e) {
      setErrorModal({
        title: "Re-verify failed",
        message:
          e instanceof Error
            ? e.message
            : "Failed to re-verify. Please try again.",
      });
    } finally {
      setReverifyLoading(false);
    }
  };

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setFetchError(null);
      if (!params.orderId) throw new Error("No orderId provided");

      // Check if farmerPickup was passed from orders list
      let passedFarmerPickup: any = null;
      if (params.farmerPickup) {
        try {
          passedFarmerPickup = JSON.parse(params.farmerPickup);
          // debug: farmerPickup carried over from the orders list
        } catch (e) {
          console.warn("Failed to parse farmerPickup from params:", e);
        }
      }

      let data: any = await api.get(
        `/api/buyer/place-order/details/${params.orderId}`,
      );
      const orderData = data.order || {};
      const merged: any = { ...orderData };

      const camelToSnake: Record<string, string> = {
        unitPrice: "unit_price",
        basePrice: "base_price",
        serviceCharge: "service_charge",
        deliveryFee: "delivery_fee",
        totalPrice: "total_price",
        deliveryType: "delivery_type",
      };

      Object.entries(camelToSnake).forEach(([camel, snake]) => {
        const val =
          data[camel] ?? data[snake] ?? orderData[camel] ?? orderData[snake];
        if (val !== undefined && val !== null) merged[camel] = val;
      });

      // if backend omitted price details, try to infer from totals & quantity
      if (
        (merged.unitPrice == null || merged.basePrice == null) &&
        merged.quantity
      ) {
        // total_amount includes platform + transporter fees etc
        const totalAmount = data.order?.total_amount ?? null;
        const platformFee = data.order?.platform_fee_amount ?? 0;
        const transporterFee = data.order?.transporter_fee_amount ?? 0;
        if (totalAmount != null) {
          const inferredBase = totalAmount - platformFee - transporterFee;
          merged.basePrice = merged.basePrice ?? inferredBase;
          if (merged.quantity) {
            merged.unitPrice =
              merged.unitPrice ?? inferredBase / merged.quantity;
          }
        }
      }
      // if totalPrice still missing, compute from unitPrice * quantity
      if (
        merged.totalPrice == null &&
        merged.unitPrice != null &&
        merged.quantity
      ) {
        merged.totalPrice = merged.unitPrice * merged.quantity;
      }

      const nextStatus = typeof merged.status === "string" ? merged.status : null;
      const previousStatus = lastOrderStatusRef.current;
      lastOrderStatusRef.current = nextStatus;

      setOrder(merged || null);
      if (silent && autoRefreshOrderUpdates && previousStatus && nextStatus && previousStatus !== nextStatus) {
        showNotification({
          title: "Order status updated",
          message: `Your order is now ${nextStatus.replace(/_/g, " ").toLowerCase()}.`,
          preset: ["DELIVERED", "COMPLETED"].includes(nextStatus) ? "done" : "info",
        });
      }

      // attempt to load blockchain journey if harvest_id is available
      if (merged.harvest_id) {
        try {
          const journeyData: any = await api.get(
            `/api/public/verify/${merged.harvest_id}`,
          );
          setOrderJourney(journeyData);
        } catch (err) {
          // ignore failure – journey is optional
          console.warn("Failed to load journey data", err);
        }
      }

      // save optional journey section if backend provided it
      if (data.journey) {
        setOrderJourney(data.journey as HarvestJourney);
      }

      if (data.farmer) {
        const userData = data.farmer.user || data.farmer.users || {};
        // Use passed farmerPickup if available, otherwise from API
        const pickup = passedFarmerPickup ?? data.farmerPickup ?? {};
        setFarmer({
          id: data.farmer.id,
          name: userData?.name || userData?.full_name || "Unknown",
          phone: userData?.phone || "",
          rating: undefined,
          location: pickup.location || data.farmer.location || undefined,
        });
        // Prefer farmerPickup coords, fall back to farmer-level coords
        const lat = pickup.latitude ?? data.farmer.latitude;
        const lng = pickup.longitude ?? data.farmer.longitude;
        if (lat && lng) {
          setFarmerCoords({
            latitude: Number(lat),
            longitude: Number(lng),
          });
        }
      }

      if (data.productImages?.length > 0) {
        setProductImages(
          Array.isArray(data.productImages)
            ? data.productImages
            : [data.productImages],
        );
      } else if (orderData?.product_images) {
        setProductImages(
          Array.isArray(orderData.product_images)
            ? orderData.product_images
            : [orderData.product_images],
        );
      } else {
        setProductImages([]);
      }

      setHarvestDate(
        data.harvestDate ||
          orderData?.harvest_date ||
          orderData?.estimated_harvest_date ||
          null,
      );

      // Harvest proof images
      const rawProof =
        orderData.harvest_proof_images ??
        orderData.proof_images ??
        orderData.grading_images ??
        null;
      setHarvestProofImages(
        Array.isArray(rawProof) ? rawProof : rawProof ? [rawProof] : [],
      );

      // Delivered/completed: fetch stored grading images + history for buyer
      const status = (merged?.status ?? "").toString();
      const placedOrderId = String(params.orderId);
      if (["DELIVERED", "COMPLETED"].includes(status)) {
        if (!silent || buyerGradingsLoadedForRef.current !== placedOrderId) {
          fetchBuyerGradings(placedOrderId);
        }
      } else {
        buyerGradingsLoadedForRef.current = null;
        setBuyerGradings([]);
        setBuyerGradingsError(null);
        setReverifyResults(null);
      }

      // Fetch forecast price when order is awaiting payment
      if (
        merged?.status === "AWAITING_PAYMENT" &&
        merged?.fruit_type &&
        merged?.required_date
      ) {
        fetchForecastPrice(
          merged.fruit_type,
          merged.required_date,
          merged.variant,
        );
      }
    } catch (error: any) {
      setFetchError(error?.message || "Failed to load order details");
      setOrder(null);
      setProductImages([]);
      setFarmer(null);
      setTransporter(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  /** Fetches the AI/ML forecast price for a given fruit on the order's required date */
  const fetchForecastPrice = async (
    fruitType: string,
    requiredDate: string,
    variant?: string,
  ) => {
    try {
      setIsFetchingForecast(true);
      const dateParam = requiredDate.slice(0, 10);

      // try multiple naming formats until one returns a price
      const candidates: string[] = [];
      if (variant) {
        candidates.push(`${variant} ${fruitType}`);
        candidates.push(`${fruitType}${variant}`);
        candidates.push(`${fruitType} ${variant}`);
      }
      candidates.push(fruitType);

      let price: number | null = null;
      for (const key of candidates) {
        const normalized = key.replace(/_/g, "");
        // console.log("[forecast] buyer request key", normalized, dateParam);
        const res: any = await api.get(
          `/forecast/fruit?fruit=${encodeURIComponent(normalized)}&date=${encodeURIComponent(dateParam)}`,
        );
        // console.log("[forecast] buyer response", res);
        const priceEntry = Array.isArray(res?.forecast)
          ? res.forecast.find(
              (e: any) => e.date === dateParam && e.target === "price",
            )
          : null;
        if (priceEntry?.forecast_value != null) {
          price = priceEntry.forecast_value;
          break;
        }
      }

      setPredictedPrice(price ?? 0);
    } catch (e) {
      // console.log("[forecast] buyer failed", e);
      setPredictedPrice(0);
    } finally {
      setIsFetchingForecast(false);
    }
  };

  /** Called when user taps Pay Now inside the info modal */
  const persistPayHereSuccess = async (
    paymentId: string,
    paidDeposit: number | null,
  ) => {
    if (!order) return;

    const payload = {
      status: "AUTHORIZED_PAYMENT",
      payment_status: "AUTHORIZED",
      payhere_payment_id: paymentId,
      deposit_amount: paidDeposit,
      deposit_paid: paidDeposit,
      paid_at: new Date().toISOString(),
    };

    console.log("[OrderDetail] Persisting PayHere success", {
      orderId: order.id,
      paymentId,
      paidDeposit,
      primaryEndpoint: `/api/buyer/place-order/${order.id}`,
    });

    try {
      await api.put(`/api/buyer/place-order/${order.id}`, payload);
      console.log("[OrderDetail] PayHere success persisted via place-order", {
        orderId: order.id,
        paymentId,
      });
      return;
    } catch (primaryError) {
      console.warn(
        "[OrderDetail] Failed to persist payment through place-order endpoint; trying buyer order endpoint",
        primaryError,
      );
    }

    console.log("[OrderDetail] Persisting PayHere success via fallback", {
      orderId: order.id,
      paymentId,
      fallbackEndpoint: `/api/buyer/orders/${order.id}`,
    });
    await api.put(`/api/buyer/orders/${order.id}`, payload);
    console.log("[OrderDetail] PayHere success persisted via buyer orders", {
      orderId: order.id,
      paymentId,
    });
  };

  const handlePayNow = async () => {
    if (!order || !priceLockKey || payhereSubmitting) return;
    setPayhereSubmitting(true);

    // compute deposit: half the total, but never more than Rs. 250 000
    let depositAmount: number | null = null;
    if (order.totalPrice != null) {
      depositAmount = order.totalPrice / 2;
      if (depositAmount > 25000) {
        depositAmount = 25000;
      }
    }
    // lock the deposit locally for UI badge (fall back to unit price if nothing else)
    const lockValue =
      lockedUnitPrice ?? depositAmount ?? order.unitPrice ?? null;
    try {
      if (lockValue != null) {
        const lock = {
          lockedPrice: lockValue,
          lockedDate: new Date().toISOString().slice(0, 10),
        };
        await AsyncStorage.setItem(priceLockKey, JSON.stringify(lock));
        if (!isMountedRef.current) return;
        setLockedUnitPrice(lockValue);
        setIsPriceLocked(true);
      }
      setPaymentModalVisible(false);

      // launch PayHere preapproval/deposit flow
      await startPayHerePreapproval(
        {
          orderId: order.id,
          fruitType: order.fruit_type,
          variant: order.variant ?? null,
          quantity: order.quantity,
          depositAmount,
          deliveryDate: order.required_date ?? null,
          deliveryLocation: order.delivery_location ?? null,
        },
        async (paymentId) => {
          console.log("[OrderDetail] PayHere success callback received", {
            orderId: order.id,
            paymentId,
            depositAmount,
          });
          try {
            await persistPayHereSuccess(paymentId, depositAmount);
            if (!isMountedRef.current) return;
            setDepositPaid(depositAmount);
            setPayherePaymentId(paymentId);
            setOrder((o) =>
              o
                ? {
                    ...o,
                    status: "AUTHORIZED_PAYMENT",
                    payment_status: "AUTHORIZED",
                    payhere_payment_id: paymentId,
                  }
                : o,
            );
            setSuccessModal({
              title: "Deposit Paid",
              message: depositAmount
                ? `A 50% deposit of Rs. ${depositAmount.toLocaleString()} has been paid successfully. The remaining balance will be automatically processed on delivery based on the final market price.`
                : "Your deposit has been paid successfully.",
              onClose: () => fetchOrderDetails(),
            });
          } catch (error) {
            console.warn(
              "[OrderDetail] PayHere succeeded but order status update failed",
              { paymentId, error },
            );
            if (!isMountedRef.current) return;
            setErrorModal({
              title: "Payment Saved By PayHere",
              message:
                "PayHere returned a successful payment, but FreshRoute could not update the order status. Please refresh or contact support with payment reference " +
                paymentId +
                ".",
            });
          } finally {
            if (isMountedRef.current) setPayhereSubmitting(false);
          }
        },
        (error) => {
          if (!isMountedRef.current) return;
          setPayhereSubmitting(false);
          setErrorModal({
            title: "Deposit Failed",
            message: `Something went wrong: ${error}\n\nPlease try again or contact support.`,
          });
        },
        () => {
          if (isMountedRef.current) setPayhereSubmitting(false);
        },
      );
    } catch (error) {
      if (!isMountedRef.current) return;
      setPayhereSubmitting(false);
      setErrorModal({
        title: "Payment Could Not Start",
        message:
          error instanceof Error
            ? error.message
            : "Unable to start PayHere payment. Please try again.",
      });
    }
  };

  const getPrimaryAction = () => {
    if (!order) return null;
    // Once payment is done (AUTHORIZED_PAYMENTand beyond) no action button is shown
    // — tracking is handled via the inline mini-map section
    if (
      ["AUTHORIZED_PAYMENT", "IN_TRANSIT", "DELIVERED", "COMPLETED"].includes(
        order.status,
      )
    ) {
      return null;
    }
    switch (order.status) {
      case "AWAITING_PAYMENT":
        if (order.payment_status === "AUTHORIZED") {
          return {
            label: order.required_date
              ? `Auto-payment scheduled · ${formatDate(order.required_date)}`
              : "Payment will process automatically",
            onPress: () => {},
            disabled: true,
          };
        }
        return {
          label: "Proceed to Payment",
          onPress: () => setPaymentModalVisible(true),
        };
      default:
        return null;
    }
  };

  // used for showing proof-of-harvest: start once order is READY_FOR_PICKUP
  const showProofSection = [
    "READY_FOR_PICKUP",
    "IN_TRANSIT",
    "DELIVERED",
    "COMPLETED",
    "PICKED_UP",
  ].includes(order?.status ?? "");

  const isOrderTrackable = [
    "AUTHORIZED_PAYMENT",
    "PACKING",
    "READY_FOR_PICKUP",
    "PICKED_UP",
    "IN_TRANSIT",
    // once we reach DELIVERED or beyond the map section should disappear
  ].includes(order?.status ?? "");

  // Show Add complaint when order is delivered or completed (button lives in fixed panel so it's not covered)
  const showAddComplaint = ["DELIVERED", "COMPLETED"].includes(
    order?.status ?? "",
  );

  const showBuyerReverify = ["DELIVERED", "COMPLETED"].includes(
    order?.status ?? "",
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Order Summary" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Order Summary" showBackButton />
        <View style={styles.centerContainer}>
          <Ionicons name="document-text-outline" size={64} color="#E5E7EB" />
          <Text style={styles.errorText}>
            {fetchError ? "Failed to load order" : "Order not found"}
          </Text>
          {fetchError && <Text style={styles.errorDetail}>{fetchError}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const primaryAction = getPrimaryAction();
  const statusStyle = getStatusStyles(order.status);
  const fruitMeta = getFruitMeta(order.fruit_type);

  // display a meaningful payment reference; ignore a literal "0" coming from DB
  const displayPaymentRef = (() => {
    if (!order) return null;
    const v = order.payhere_payment_id;
    if (v && v !== "0") return v;
    return payherePaymentId;
  })();

  // --- Actual map coordinates (fall back to Colombo area if DB has none) ---
  const farmerMapCoord = farmerCoords ?? {
    latitude: 6.9271,
    longitude: 79.8612,
  };
  const buyerMapCoord =
    order.latitude && order.longitude
      ? { latitude: order.latitude, longitude: order.longitude }
      : { latitude: 6.8407, longitude: 79.993 };
  const driverMapCoord =
    transporter?.current_latitude && transporter?.current_longitude
      ? {
          latitude: transporter.current_latitude,
          longitude: transporter.current_longitude,
        }
      : null;
  const miniMapCenter = {
    latitude: (farmerMapCoord.latitude + buyerMapCoord.latitude) / 2,
    longitude: (farmerMapCoord.longitude + buyerMapCoord.longitude) / 2,
  };
  const miniMapLatDelta =
    Math.abs(farmerMapCoord.latitude - buyerMapCoord.latitude) * 2.5 + 0.06;
  const miniMapLngDelta =
    Math.abs(farmerMapCoord.longitude - buyerMapCoord.longitude) * 2.5 + 0.06;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header title="Order Summary" showBackButton />

      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[BuyerColors.primaryGreen]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Section: Track Your Order — shown when order is paid and being fulfilled */}
          {isOrderTrackable && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Track Your Order</Text>
                <TouchableOpacity
                  style={styles.miniMapContainer}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/buyer/track-delivery" as any,
                      params: {
                        orderId: order.id,
                        farmerLat: String(farmerMapCoord.latitude),
                        farmerLng: String(farmerMapCoord.longitude),
                        buyerLat: String(buyerMapCoord.latitude),
                        buyerLng: String(buyerMapCoord.longitude),
                        ...(driverMapCoord
                          ? {
                              driverLat: String(driverMapCoord.latitude),
                              driverLng: String(driverMapCoord.longitude),
                            }
                          : {}),
                      },
                    })
                  }
                >
                  <MapView
                    style={styles.miniMap}
                    pointerEvents="none"
                    initialRegion={{
                      latitude: miniMapCenter.latitude,
                      longitude: miniMapCenter.longitude,
                      latitudeDelta: miniMapLatDelta,
                      longitudeDelta: miniMapLngDelta,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <Marker coordinate={farmerMapCoord} title="Pickup">
                      <View
                        style={[
                          styles.miniMarker,
                          { backgroundColor: "#F59E0B" },
                        ]}
                      >
                        <Ionicons name="storefront" size={10} color="#FFF" />
                      </View>
                    </Marker>
                    <Marker coordinate={buyerMapCoord} title="Delivery">
                      <View
                        style={[
                          styles.miniMarker,
                          { backgroundColor: BuyerColors.primaryGreen },
                        ]}
                      >
                        <Ionicons name="location" size={10} color="#FFF" />
                      </View>
                    </Marker>
                    {driverMapCoord && (
                      <Marker coordinate={driverMapCoord} title="Driver">
                        <View
                          style={[
                            styles.miniMarker,
                            {
                              backgroundColor: "#3B82F6",
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                            },
                          ]}
                        >
                          <Ionicons name="car" size={13} color="#FFF" />
                        </View>
                      </Marker>
                    )}
                  </MapView>

                  {/* Overlay tap-to-track button */}
                  <View style={styles.miniMapOverlay}>
                    <View style={styles.miniMapTrackBtn}>
                      <Ionicons name="navigate" size={14} color="#FFF" />
                      <Text style={styles.miniMapTrackText}>
                        Tap to Track Live
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.solidSeparator} />
            </>
          )}

          {/* Section: Order Status & ID */}
          <View style={styles.section}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.orderIdLabel}>ORDER ID</Text>
                <Text style={styles.orderIdValue}>
                  #{order.id.substring(0, 8).toUpperCase()}
                </Text>
              </View>
              {displayPaymentRef ? (
                <View>
                  <Text style={styles.orderIdLabel}>PAYMENT REF</Text>
                  <Text style={styles.paymentRefValue}>
                    {displayPaymentRef}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                  {statusStyle.label}
                </Text>
              </View>
            </View>

            <View style={styles.dateGrid}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Placed On</Text>
                <Text style={styles.dateValue}>
                  {formatDate(order.created_at)}
                </Text>
              </View>
              {order.farmer_accepted_at && (
                <View style={styles.dateItem}>
                  <Text style={styles.dateLabel}>Accepted On</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(order.farmer_accepted_at)}
                  </Text>
                </View>
              )}
            </View>

            {/* journey button appears once order has been delivered (or completed) */}
            {orderJourney &&
              ["DELIVERED", "COMPLETED"].includes(order.status) && (
                <TouchableOpacity
                  style={styles.journeyBtn}
                  onPress={() => {
                    router.push({
                      pathname: "/buyer/screens/JourneyScreen" as any,
                      params: { journey: JSON.stringify(orderJourney) },
                    });
                  }}
                >
                  <Text style={styles.journeyBtnText}>View Journey</Text>
                </TouchableOpacity>
              )}
          </View>

          <View style={styles.solidSeparator} />

          {/* Section: Product Detail — collapsible accordion */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() =>
                setProductDetailExpanded((v) => {
                  const next = !v;
                  if (!next) {
                    // also collapse location when product section is closed
                    setLocationExpanded(false);
                  }
                  return next;
                })
              }
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Product Details
              </Text>
              <Ionicons
                name={productDetailExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {productDetailExpanded && (
              <View style={[styles.productRow, { marginTop: 16 }]}>
                <TouchableOpacity
                  style={styles.imageWrapper}
                  onPress={() => {
                    if (productImages.length > 0) {
                      setSelectedImageIndex(0);
                      setImageViewerVisible(true);
                    }
                  }}
                  disabled={productImages.length === 0}
                >
                  {productImages.length > 0 ? (
                    <>
                      <Image
                        source={{ uri: productImages[0] }}
                        style={styles.productImage}
                      />
                      {productImages.length > 1 && (
                        <View style={styles.imageBadge}>
                          <Text style={styles.imageBadgeText}>
                            +{productImages.length - 1}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <View
                      style={[
                        styles.avatarFallback,
                        { backgroundColor: fruitMeta.bg },
                      ]}
                    >
                      <Text style={styles.avatarEmoji}>{fruitMeta.emoji}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.productInfo}>
                  <Text style={styles.productName}>
                    {order.fruit_type}{" "}
                    <Text style={styles.productVariant}>• {order.variant}</Text>
                  </Text>

                  <View style={styles.chipContainer}>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{order.quantity} kg</Text>
                    </View>
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Grade {order.grade}</Text>
                    </View>
                  </View>

                  {harvestDate && (
                    <Text style={styles.harvestText}>
                      Est. Harvest:{" "}
                      <Text style={{ fontWeight: "600", color: "#374151" }}>
                        {formatDate(harvestDate)}
                      </Text>
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={styles.solidSeparator} />

          {/* Section: Proof of Harvest — visible once order is READY_FOR_PICKUP or later */}
          {showProofSection && (
            <>
              <View style={styles.section}>
                <View style={styles.accordionHeader}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                    Proof of Harvest
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color="#16A34A"
                    />
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                </View>

                {harvestProofImages.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.proofImagesRow}
                  >
                    {harvestProofImages.map((uri, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.proofThumb}
                        activeOpacity={0.8}
                        onPress={() => {
                          setProofViewerIndex(idx);
                          setProofViewerVisible(true);
                        }}
                      >
                        <Image source={{ uri }} style={styles.proofThumbImg} />
                        {idx === 0 && (
                          <View style={styles.proofVerifiedPin}>
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#16A34A"
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.proofEmptyState}>
                    <Ionicons name="images-outline" size={36} color="#D1D5DB" />
                    <Text style={styles.proofEmptyText}>
                      Harvest proof images will appear here
                    </Text>
                  </View>
                )}

                {showBuyerReverify && (
                  <View style={{ marginTop: 14 }}>
                    <TouchableOpacity
                      style={[
                        styles.reverifyBtn,
                        (buyerGradingsLoading || reverifyLoading) &&
                          styles.reverifyBtnDisabled,
                      ]}
                      onPress={() => setShowGradingsPopup(true)}
                      disabled={buyerGradingsLoading || reverifyLoading}
                      activeOpacity={0.85}
                    >
                      {buyerGradingsLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={18}
                            color="#fff"
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.reverifyBtnText}>
                            View verification
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reverifySecondaryBtn,
                        (buyerGradingsLoading || reverifyLoading) &&
                          styles.reverifySecondaryBtnDisabled,
                      ]}
                      onPress={() => setShowReverifyConfirm(true)}
                      disabled={buyerGradingsLoading || reverifyLoading}
                      activeOpacity={0.85}
                    >
                      {reverifyLoading ? (
                        <ActivityIndicator
                          color={BuyerColors.primaryGreen}
                          size="small"
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="help-circle-outline"
                            size={18}
                            color={BuyerColors.primaryGreen}
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.reverifySecondaryBtnText}>
                            Have doubt? Reverify
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {buyerGradingsError ? (
                      <Text style={styles.reverifyHintError}>
                        {buyerGradingsError}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              <View style={styles.solidSeparator} />
            </>
          )}

          {/* Section: Logistics */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setLocationExpanded((v) => !v)}
              activeOpacity={0.7}
            >
              <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                Location
              </Text>
              <Ionicons
                name={locationExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {locationExpanded && (
              <View style={styles.logisticsContainer}>
                {farmer && (
                  <View style={styles.logisticsRow}>
                    <View style={styles.iconColumn}>
                      <Ionicons name="storefront" size={20} color="#6B7280" />
                      <View style={styles.verticalDottedLine} />
                    </View>
                    <View style={styles.addressBlock}>
                      <Text style={styles.addressLabel}>Pickup Location</Text>
                      <Text style={styles.addressValue}>
                        {farmer.location ?? "—"}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[styles.logisticsRow, { marginTop: 4 }]}>
                  <View style={styles.iconColumn}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={BuyerColors.primaryGreen}
                    />
                  </View>
                  <View style={styles.addressBlock}>
                    <Text style={styles.addressLabel}>Delivery Address</Text>
                    <Text style={styles.addressValue}>
                      {order.delivery_location}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* --- FIXED BOTTOM SECTION --- */}
        <View style={styles.fixedBottomPanel}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>

          <View style={styles.receiptItems}>
            {order.unitPrice != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Unit Price</Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(order.unitPrice)}
                </Text>
              </View>
            )}
            {depositPaid != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Deposit Paid</Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(depositPaid)}
                </Text>
              </View>
            )}

            {(() => {
              const basePrice =
                order.basePrice ??
                (order.unitPrice != null
                  ? order.unitPrice * order.quantity
                  : null);
              return basePrice != null ? (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>
                    Base Price ({order.quantity}kg)
                  </Text>
                  <Text style={styles.receiptValue}>
                    Rs. {formatCurrency(basePrice)}
                  </Text>
                </View>
              ) : null;
            })()}
            {order.serviceCharge != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Service Charge</Text>
                <Text style={styles.receiptValue}>
                  Rs. {formatCurrency(order.serviceCharge)}
                </Text>
              </View>
            )}
            {order.deliveryFee != null && (
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Delivery Fee</Text>
                <Text
                  style={styles.receiptValue}
                >{`Rs. ${formatCurrency(order.deliveryFee)}`}</Text>
              </View>
            )}

            <View style={styles.dashedReceiptSeparator} />

            <View style={styles.receiptTotalRow}>
              <Text style={styles.receiptTotalLabel}>Total Amount</Text>
              <Text style={styles.receiptTotalValue}>
                Rs.{" "}
                {order.totalPrice ? formatCurrency(order.totalPrice) : "N/A"}
              </Text>
            </View>
          </View>

          {/* Action Buttons - Now Full Width */}
          {primaryAction && (
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (primaryAction as any).disabled && styles.primaryBtnScheduled,
                ]}
                onPress={primaryAction.onPress}
                disabled={(primaryAction as any).disabled}
                activeOpacity={(primaryAction as any).disabled ? 1 : 0.8}
              >
                {(primaryAction as any).disabled ? (
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color="rgba(255,255,255,0.85)"
                  />
                ) : (
                  (primaryAction as any).icon && (
                    <Ionicons
                      name={(primaryAction as any).icon as any}
                      size={20}
                      color="#fff"
                    />
                  )
                )}
                <Text
                  style={[
                    styles.primaryBtnText,
                    (primaryAction as any).disabled &&
                      styles.primaryBtnScheduledText,
                  ]}
                >
                  {primaryAction.label}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Add complaint - in fixed panel so it's never covered by overlay */}
          {showAddComplaint && (
            <View
              style={[
                styles.actionContainer,
                { marginTop: primaryAction ? 12 : 0 },
              ]}
            >
              <TouchableOpacity
                style={styles.addComplaintBtn}
                onPress={() =>
                  router.push({
                    pathname: "/buyer/add-complaint" as any,
                    params: { orderId: order.id },
                  })
                }
                activeOpacity={0.8}
              >
                <Ionicons name="warning-outline" size={20} color="#B45309" />
                <Text style={styles.addComplaintBtnText}>Add complaint</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Payment Info Modal */}
      {order && (
        <PaymentInfoModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          fruitType={order.fruit_type}
          variant={order.variant}
          predictedUnitPrice={predictedPrice}
          isFetchingForecast={isFetchingForecast}
          currentUnitPrice={
            isPriceLocked && lockedUnitPrice != null
              ? lockedUnitPrice
              : (order.unitPrice ?? null)
          }
          requiredDate={
            order.required_date ? formatDate(order.required_date) : undefined
          }
          isPriceLocked={isPriceLocked}
          isSubmitting={payhereSubmitting}
          onPayNow={handlePayNow}
        />
      )}

      {/* Product Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setImageViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width,
              );
              setSelectedImageIndex(idx);
            }}
          >
            {productImages.map((uri, index) => (
              <View key={index} style={styles.fullImageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          {productImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {selectedImageIndex + 1} / {productImages.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Proof of Harvest Image Viewer Modal */}
      <Modal
        visible={proofViewerVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setProofViewerVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {/* Verified overlay badge */}
          <View style={styles.proofModalBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
            <Text style={styles.proofModalBadgeText}>Harvest Verified</Text>
          </View>
          <ScrollView
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / Dimensions.get("window").width,
              );
              setProofViewerIndex(idx);
            }}
          >
            {harvestProofImages.map((uri, index) => (
              <View key={index} style={styles.fullImageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
          {harvestProofImages.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {proofViewerIndex + 1} / {harvestProofImages.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
      <SuccessModal
        visible={!!successModal}
        title={successModal?.title ?? ""}
        message={successModal?.message ?? ""}
        buttonText="OK"
        onClose={() => {
          const cb = successModal?.onClose;
          setSuccessModal(null);
          cb?.();
        }}
        onButtonPress={() => {
          const cb = successModal?.onClose;
          setSuccessModal(null);
          cb?.();
        }}
      />
      <ErrorModal
        visible={!!errorModal}
        title={errorModal?.title ?? ""}
        message={errorModal?.message ?? ""}
        buttonText="OK"
        onClose={() => setErrorModal(null)}
        onButtonPress={() => setErrorModal(null)}
      />

      {/* Buyer grading popup (existing + optional new re-verify results) */}
      <Modal visible={showGradingsPopup} transparent animationType="fade">
        <View style={styles.gradingsOverlay}>
          <View style={styles.gradingsCard}>
            <View style={styles.gradingsHeader}>
              <Text style={styles.gradingsTitle}>Verification</Text>
              <TouchableOpacity
                style={styles.gradingsCloseBtn}
                onPress={() => setShowGradingsPopup(false)}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: Dimensions.get("window").height * 0.68 }}
              showsVerticalScrollIndicator={false}
            >
              {buyerGradings.length === 0 ? (
                <View style={styles.gradingsEmpty}>
                  <Ionicons name="images-outline" size={44} color="#cbd5e1" />
                  <Text style={styles.gradingsEmptyTitle}>No gradings yet</Text>
                  <Text style={styles.gradingsEmptyText}>
                    No grading images found for this order.
                  </Text>
                </View>
              ) : (
                (() => {
                  const latest = buyerGradings[0];
                  const images =
                    latest?.images
                      ?.slice()
                      .sort((a, b) => a.sequence - b.sequence) ?? [];
                  return (
                    <>
                      <Text style={styles.gradingsMeta}>
                        Existing verifications: {buyerGradings.length}
                      </Text>

                      <View style={styles.gradingsGrid}>
                        {images.map((img, idx) => {
                          const uri = (img.image_base64 ?? "").startsWith("data:")
                            ? img.image_base64
                            : `data:image/jpeg;base64,${img.image_base64 ?? ""}`;
                          return (
                            <View
                              key={String(img.id ?? idx)}
                              style={styles.gradingsImgCard}
                            >
                              <Image source={{ uri }} style={styles.gradingsImg} />
                              <Text style={styles.gradingsImgLabel}>
                                Fruit {idx + 1}
                              </Text>
                              <Text style={styles.gradingsImgValue}>
                                {(img.predicted_grade ?? "")
                                  .replace(/_/g, " ")
                                  .trim() || "—"}{" "}
                                ({img.accuracy ?? 0}%)
                              </Text>

                              {reverifyResults && reverifyResults[idx] ? (
                                <View style={styles.gradingsNewBox}>
                                  <Text style={styles.gradingsNewLabel}>
                                    New verification
                                  </Text>
                                  <Text style={styles.gradingsNewValue}>
                                    {reverifyResults[idx].detectedGrade} (
                                    {reverifyResults[idx].confidence}%)
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    </>
                  );
                })()
              )}
            </ScrollView>

            <View style={styles.gradingsFooter}>
              <TouchableOpacity
                style={[
                  styles.gradingsPrimaryBtn,
                  (buyerGradingsLoading || reverifyLoading) &&
                    styles.gradingsBtnDisabled,
                ]}
                onPress={() => setShowReverifyConfirm(true)}
                disabled={buyerGradingsLoading || reverifyLoading}
              >
                {reverifyLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.gradingsPrimaryBtnText}>
                    Have doubt? Reverify
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirm before re-verify */}
      <Modal visible={showReverifyConfirm} transparent animationType="fade">
        <View style={styles.gradingsOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Re-verify grades?</Text>
            <Text style={styles.confirmMessage}>
              We’ll re-run the same grading model on the existing 5 proof images.
              New results will be shown in the popup and are not saved.
            </Text>
            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowReverifyConfirm(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmReverifyBtn}
                onPress={() => {
                  setShowReverifyConfirm(false);
                  handleBuyerReverify();
                }}
              >
                <Text style={styles.confirmReverifyText}>Re verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  mainContainer: { flex: 1 },
  scrollView: { flex: 1 },
  content: { paddingVertical: 16, paddingBottom: 280 },

  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#6B7280" },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#6B7280",
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 13,
    color: "#EF4444",
    textAlign: "center",
    paddingHorizontal: 32,
  },

  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    letterSpacing: -0.2,
  },

  solidSeparator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
    marginHorizontal: 20,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  orderIdLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderIdValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  paymentRefValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#16A34A",
    letterSpacing: 0.2,
  },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },

  dateGrid: { flexDirection: "row", gap: 32 },
  dateItem: {},
  dateLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  dateValue: { fontSize: 14, fontWeight: "700", color: "#374151" },

  productRow: { flexDirection: "row", alignItems: "center" },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  productImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  avatarFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmoji: { fontSize: 36 },

  productInfo: { flex: 1, marginLeft: 16 },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  productVariant: { fontSize: 15, fontWeight: "500", color: "#6B7280" },
  chipContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  chip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#4B5563" },
  harvestText: { fontSize: 13, color: "#6B7280" },

  logisticsContainer: {},
  logisticsRow: { flexDirection: "row" },
  iconColumn: { alignItems: "center", width: 24, marginRight: 16 },
  verticalDottedLine: {
    flex: 1,
    width: 2,
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginVertical: 4,
  },
  addressBlock: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  addressLabel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
    lineHeight: 22,
  },

  fixedBottomPanel: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  receiptItems: { gap: 10, marginBottom: 16 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between" },
  receiptLabel: { fontSize: 14, color: "#4B5563" },
  receiptValue: { fontSize: 14, color: "#111827", fontWeight: "500" },
  dashedReceiptSeparator: {
    height: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    marginVertical: 6,
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: "900",
    color: BuyerColors.primaryGreen,
  },

  actionContainer: { flexDirection: "row", gap: 12 },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: "bold", color: "#ffffff" },
  primaryBtnScheduled: {
    backgroundColor: "#166534",
    opacity: 0.9,
  },
  primaryBtnScheduledText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  addComplaintBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFBEB",
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  addComplaintBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B45309",
  },

  reverifyBtn: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  reverifyBtnDisabled: { opacity: 0.7 },
  reverifyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  reverifySecondaryBtn: {
    marginTop: 10,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  reverifySecondaryBtnDisabled: { opacity: 0.7 },
  reverifySecondaryBtnText: {
    color: BuyerColors.primaryGreen,
    fontWeight: "800",
    fontSize: 14,
  },
  reverifyHintError: {
    marginTop: 8,
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── gradings popup ─────────────────────────────────────────────────────────
  gradingsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  gradingsCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
  },
  gradingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  gradingsTitle: { fontSize: 18, fontWeight: "900", color: "#111827" },
  gradingsCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  gradingsMeta: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 10,
  },
  gradingsEmpty: { alignItems: "center", paddingVertical: 24 },
  gradingsEmptyTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  gradingsEmptyText: {
    marginTop: 6,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
  },
  gradingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gradingsImgCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  gradingsImg: { width: "100%", height: 120, borderRadius: 10, marginBottom: 8 },
  gradingsImgLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  gradingsImgValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
    color: BuyerColors.primaryGreen,
    textAlign: "center",
  },
  gradingsNewBox: {
    marginTop: 8,
    width: "100%",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "center",
  },
  gradingsNewLabel: { fontSize: 11, color: "#6b7280", fontWeight: "700" },
  gradingsNewValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "900",
    color: "#0F766E",
    textAlign: "center",
  },
  gradingsFooter: { marginTop: 6 },
  gradingsPrimaryBtn: {
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  gradingsPrimaryBtnText: { color: "#fff", fontWeight: "900", fontSize: 14 },
  gradingsBtnDisabled: { opacity: 0.7 },

  // ── confirm popup ──────────────────────────────────────────────────────────
  confirmCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  confirmMessage: {
    marginTop: 10,
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
  confirmBtnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  confirmCancelText: { color: "#475569", fontWeight: "900", fontSize: 14 },
  confirmReverifyBtn: {
    flex: 1,
    backgroundColor: BuyerColors.primaryGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmReverifyText: { color: "#fff", fontWeight: "900", fontSize: 14 },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "100%", height: "100%" },
  imageCounter: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageCounterText: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  // --- Accordion Header ---
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },

  // --- Proof of Harvest ---
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16A34A",
  },
  proofImagesRow: {
    gap: 10,
    paddingVertical: 16,
  },
  proofThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  proofThumbImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  proofVerifiedPin: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 1,
  },
  proofEmptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  proofEmptyText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
  },
  journeyBtn: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 20,
  },
  journeyBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  proofModalBadge: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(240,253,244,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  proofModalBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
  },

  // --- Mini Map (Track Your Order) ---
  miniMapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    height: 160,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  miniMapOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    alignItems: "flex-end",
  },
  miniMapTrackBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  miniMapTrackText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
