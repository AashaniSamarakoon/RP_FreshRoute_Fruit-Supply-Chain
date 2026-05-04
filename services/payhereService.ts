import { BACKEND_URL } from "@/config";
import api from "@/services/api";
import { supabase } from "@/utils/supabaseClient";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const PayHere = require("@payhere/payhere-mobilesdk-reactnative").default;

/** Merchant ID lives in the frontend env; merchant secret lives only on the backend. */
const MERCHANT_ID = process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_ID;

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
    // PayHere sandbox accounts have a per-transaction limit (~Rs.1,000).
    // In sandbox we use a small test amount; production uses the real invoice total.
    // The backend will always capture the REAL market price on delivery (not this hold amount).
    const SANDBOX_TEST_AMOUNT = "100.00";
    const amount = PAYHERE_IS_SANDBOX ? SANDBOX_TEST_AMOUNT : rawAmount.toFixed(2);
    const currency = "LKR";
    const items = `${params.fruitType}${params.variant ? ` (${params.variant})` : ""} - ${params.quantity}kg`;

    // Backend generates the hash using merchant_secret (never exposed to client).
    // We supply the merchant_id from our env — both sides use the same value.
    // ask backend for hash (and authoritative amount string)
    const { hash, amount: serverAmount } = await api.post("/api/payhere/hash", {
        orderId: params.orderId,
        amount,
        currency,
    });
    // use serverAmount when building payment object to guarantee match
    console.log(`[PayHere] authorize=true sandbox=${PAYHERE_IS_SANDBOX} merchantId=${MERCHANT_ID} clientAmount=${amount} serverAmount=${serverAmount}`);

    const paymentObject = {
        sandbox: PAYHERE_IS_SANDBOX,
        authorize: true,       // Hold on Card — card is NOT charged now; backend captures on delivery
        merchant_id: MERCHANT_ID || "",
        merchant_secret: "",   // intentionally blank — server-generated hash is used
        notify_url: `${BACKEND_URL}/api/payhere/notify`,
        order_id: params.orderId,
        items,
        amount: serverAmount,
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
     * Amount to hold now (e.g. 50% deposit). If omitted, defaults to Rs.1 for
     * simple tokenization.
     */
    depositAmount?: number | null;
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
 * Initiates a PayHere preapproval (tokenization) flow via the native SDK.
 * A Rs.1 authorization charge is made and immediately refunded — PayHere
 * stores the card token so the backend can charge the actual market price
 * on the scheduled delivery date without further buyer interaction.
 */
export async function startPayHerePreapproval(
    params: PreapprovalParams,
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

    // deposit amount to hold now (default Rs.1 for tokenization-only)
    let amountNumber = params.depositAmount != null ? params.depositAmount : 1;
    // sandbox accounts have very low limits; override with test value
    // const SANDBOX_TEST_AMOUNT = 100.0;
    // if (PAYHERE_IS_SANDBOX) {
    //   amountNumber = SANDBOX_TEST_AMOUNT;
    // }
    const amount = amountNumber.toFixed(2);
    const currency = "LKR";
    const items = `${params.fruitType}${params.variant ? ` (${params.variant})` : ""} - ${params.quantity}kg (Deposit)`;

    const { hash } = await api.post("/api/payhere/hash", {
        orderId: params.orderId,
        amount,
        currency,
    });

    console.log(`[PayHere Preapproval] sandbox=${PAYHERE_IS_SANDBOX} merchantId=${MERCHANT_ID} orderId=${params.orderId} amount=${amount}`);

    const paymentObject = {
        sandbox: PAYHERE_IS_SANDBOX,
        preapprove: true,           // enables card tokenization mode
        merchant_id: MERCHANT_ID || "",
        merchant_secret: "",        // intentionally blank — server-generated hash is used
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
