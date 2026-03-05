import { BACKEND_URL } from "@/config";
import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PayHere = require("@payhere/payhere-mobilesdk-reactnative").default;

/** Set to false for production. */
export const PAYHERE_IS_SANDBOX = true;

export interface PayHereOrderParams {
    orderId: string;
    fruitType: string;
    variant?: string | null;
    quantity: number;
    totalPrice: number | null;
    deliveryLocation?: string | null;
}

/**
 * Fetches buyer info from Supabase session, builds the PayHere payment object,
 * and starts the PayHere payment sheet.
 */
export async function startPayHerePayment(
    params: PayHereOrderParams,
    onSuccess: (paymentId: string) => void,
    onError: (error: string) => void,
    onDismiss: () => void,
): Promise<void> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    const meta = user?.user_metadata ?? {};

    const fullName: string = meta.name || meta.full_name || "Buyer";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Buyer";
    const lastName = nameParts.slice(1).join(" ") || "User";
    const email = user?.email || "buyer@freshroutemobile.com";
    const phone = meta.phone || "0700000000";

    const rawAmount = params.totalPrice ? Number(params.totalPrice) : 0;
    // In sandbox mode use a small fixed amount to stay within free-tier limits.
    const amount = PAYHERE_IS_SANDBOX ? "100.00" : rawAmount.toFixed(2);
    const currency = "LKR";
    const items = `${params.fruitType}${params.variant ? ` (${params.variant})` : ""
        } - ${params.quantity}kg`;

    // Fetch the server-generated hash — merchant_secret MUST stay on the backend only.
    // Passing merchant_secret="" tells the SDK to skip its own client-side check;
    // PayHere's server validates the hash field we supply instead.
    const { hash, merchantId } = await api.post("/api/payhere/hash", {
        orderId: params.orderId,
        amount,
        currency,
    });

    const paymentObject = {
        sandbox: PAYHERE_IS_SANDBOX,
        merchant_id: merchantId,
        merchant_secret: "",   // intentionally blank — server hash field is used
        notify_url: `${BACKEND_URL}/api/payhere/notify`,
        order_id: params.orderId,
        items,
        amount,
        currency,
        hash,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address: params.deliveryLocation || "FreshRoute Platform",
        city: "Colombo",
        country: "Sri Lanka",
        delivery_address: params.deliveryLocation || "",
        delivery_city: "Colombo",
        delivery_country: "Sri Lanka",
        custom_1: "",
        custom_2: "",
    };

    PayHere.startPayment(paymentObject, onSuccess, onError, onDismiss);
}

// ─── Preapproval (Pay Later / Tokenization) ───────────────────────────────────

export interface PreapprovalParams {
  orderId: string;
  fruitType: string;
  variant?: string | null;
  quantity: number;
  /**
   * The AI-forecasted unit price shown to the buyer as an estimate.
   * The ACTUAL charge amount is determined by the backend on deliveryDate
   * by fetching the real market price for that day — same source as order.unitPrice.
   */
  estimatedUnitPrice?: number | null;
  /** ISO date string — the day the buyer will be auto-charged at that day's market price. */
  deliveryDate?: string | null;
  deliveryLocation?: string | null;
}

/**
 * Asks the backend to create a PayHere preapproval session.
 * The backend generates the hash (merchant_secret never leaves the server).
 * Returns a URL pointing to a backend-hosted HTML page that auto-submits
 * the PayHere preapproval form. Open it with expo-web-browser.
 */
export async function initiatePreapproval(
  params: PreapprovalParams,
): Promise<{ url: string }> {
  return api.post("/api/payhere/preapproval-init", params);
}
