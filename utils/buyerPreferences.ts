import AsyncStorage from "@react-native-async-storage/async-storage";

export type BuyerPreferences = {
  pushNotifications: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  marketPriceAlerts: boolean;
  autoPaymentReminders: boolean;
};

export type BuyerNotificationContent = {
  title: string;
  message: string;
  viewRoute?: string;
};

export type BuyerNotificationCategory =
  | "order"
  | "payment"
  | "market"
  | "general";

export const BUYER_PREFERENCES_STORAGE_KEY = "buyer_profile_preferences";

export const DEFAULT_BUYER_PREFERENCES: BuyerPreferences = {
  pushNotifications: true,
  orderUpdates: true,
  paymentAlerts: true,
  marketPriceAlerts: false,
  autoPaymentReminders: true,
};

const normalizePreferences = (raw: unknown): BuyerPreferences => {
  const source =
    raw && typeof raw === "object" ? (raw as Partial<BuyerPreferences>) : {};

  return {
    pushNotifications:
      typeof source.pushNotifications === "boolean"
        ? source.pushNotifications
        : DEFAULT_BUYER_PREFERENCES.pushNotifications,
    orderUpdates:
      typeof source.orderUpdates === "boolean"
        ? source.orderUpdates
        : DEFAULT_BUYER_PREFERENCES.orderUpdates,
    paymentAlerts:
      typeof source.paymentAlerts === "boolean"
        ? source.paymentAlerts
        : DEFAULT_BUYER_PREFERENCES.paymentAlerts,
    marketPriceAlerts:
      typeof source.marketPriceAlerts === "boolean"
        ? source.marketPriceAlerts
        : DEFAULT_BUYER_PREFERENCES.marketPriceAlerts,
    autoPaymentReminders:
      typeof source.autoPaymentReminders === "boolean"
        ? source.autoPaymentReminders
        : DEFAULT_BUYER_PREFERENCES.autoPaymentReminders,
  };
};

export const getBuyerPreferences = async (): Promise<BuyerPreferences> => {
  try {
    const saved = await AsyncStorage.getItem(BUYER_PREFERENCES_STORAGE_KEY);
    if (!saved) return DEFAULT_BUYER_PREFERENCES;
    return normalizePreferences(JSON.parse(saved));
  } catch {
    return DEFAULT_BUYER_PREFERENCES;
  }
};

export const saveBuyerPreferences = async (
  preferences: BuyerPreferences,
): Promise<void> => {
  const normalized = normalizePreferences(preferences);
  await AsyncStorage.setItem(
    BUYER_PREFERENCES_STORAGE_KEY,
    JSON.stringify(normalized),
  );
};

export const getBuyerNotificationCategory = (
  content: BuyerNotificationContent,
): BuyerNotificationCategory => {
  const text = `${content.title} ${content.message} ${
    content.viewRoute ?? ""
  }`.toLowerCase();

  if (
    /payment|payhere|deposit|settlement|capture|authorization|authorised|authorized|slip|bank|card/.test(
      text,
    )
  ) {
    return "payment";
  }

  if (/market|price|freshroute|forecast|rate/.test(text)) {
    return "market";
  }

  if (
    /order|match|proposal|farmer|delivery|shipment|transit|pickup|harvest|cancel|declin|accept/.test(
      text,
    )
  ) {
    return "order";
  }

  return "general";
};

export const shouldShowBuyerNotification = (
  preferences: BuyerPreferences,
  content: BuyerNotificationContent,
): boolean => {
  if (!preferences.pushNotifications) return false;

  switch (getBuyerNotificationCategory(content)) {
    case "order":
      return preferences.orderUpdates;
    case "payment":
      return preferences.paymentAlerts;
    case "market":
      return preferences.marketPriceAlerts;
    default:
      return true;
  }
};
