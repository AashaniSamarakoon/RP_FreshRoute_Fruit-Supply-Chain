/**
 * Phone and communication utilities
 */

import { Alert, Linking, Platform } from "react-native";

/**
 * Initiate a phone call
 * @param phoneNumber - The phone number to call
 */
export const callPhone = async (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "Phone calls are not supported on this device");
  }
};

/**
 * Send an SMS message
 * @param phoneNumber - The phone number to send SMS to
 * @param message - Optional pre-filled message
 */
export const sendSMS = async (phoneNumber: string, message?: string) => {
  const separator = Platform.OS === "ios" ? "&" : "?";
  const url = `sms:${phoneNumber}${message ? `${separator}body=${encodeURIComponent(message)}` : ""}`;

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "SMS is not supported on this device");
  }
};

/**
 * Open WhatsApp chat
 * @param phoneNumber - The phone number (international format without +)
 * @param message - Optional pre-filled message
 */
export const openWhatsApp = async (phoneNumber: string, message?: string) => {
  const cleaned = phoneNumber.replace(/\D/g, "");
  const url = `whatsapp://send?phone=${cleaned}${message ? `&text=${encodeURIComponent(message)}` : ""}`;

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "WhatsApp is not installed on this device");
  }
};

/**
 * Open email client
 * @param email - Email address
 * @param subject - Email subject
 * @param body - Email body
 */
export const sendEmail = async (
  email: string,
  subject?: string,
  body?: string,
) => {
  const url = `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}${body ? `${subject ? "&" : "?"}body=${encodeURIComponent(body)}` : ""}`;

  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Error", "Email client is not available on this device");
  }
};
