import { BACKEND_URL } from "@/config";
import api from "@/services/api";
import { logger } from "@/utils/logger";
import { supabase } from "@/utils/supabaseClient";
import Constants from "expo-constants";

/** Merchant ID lives in the frontend env; merchant secret lives only on the backend. */
const MERCHANT_ID = process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_ID;

/** Set to false for production. */
export const PAYHERE_IS_SANDBOX = true;

// Try different import methods for PayHere
let PayHere: any = null;
try {
    PayHere = require("@payhere/payhere-mobilesdk-reactnative").default;
} catch (e) {
    logger.warn("PayHere require failed, trying import");
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        PayHere = require("@payhere/payhere-mobilesdk-reactnative");
    } catch (e2) {
        logger.error("PayHere import failed:", e2);
    }
}

let hasLoggedPayHereInitIssue = false;

export function isRunningInExpoGo(): boolean {
    const env = (Constants as any)?.executionEnvironment;
    // In Expo SDKs, executionEnvironment === 'storeClient' indicates Expo Go.
    return env === "storeClient";
}

export function isPayHereSdkAvailable(): boolean {
    if (isRunningInExpoGo()) return false;
    return !!(PayHere && typeof PayHere.startPayment === "function");
}

function startPaymentSafely(
    paymentObject: PayHerePaymentObject,
    onSuccess: (paymentId: string) => void,
    onError: (error: string) => void,
    onDismiss: () => void,
): void {
    // PayHere native module is not available in Expo Go; it requires a dev build.
    // Also, the SDK can sometimes throw if its native module isn't linked.
    if (isRunningInExpoGo()) {
        onError("PayHere payments are not supported in Expo Go. Please use an EAS Dev Build/Dev Client or a production build.");
        return;
    }

    const canStart = isPayHereSdkAvailable();
    if (!canStart) {
        const ownership = (Constants as any)?.appOwnership;
        const inExpoGo = ownership === "expo";

     if (!hasLoggedPayHereInitIssue) {
         hasLoggedPayHereInitIssue = true;
         logger.log(
             `[PayHere] SDK not available (appOwnership=${String(ownership)}). ` +
                 `This usually means you're running in Expo Go or the native module isn't linked.`,
         );
     }

        onError(
            inExpoGo
                ? "PayHere payments require a Dev Build/Dev Client and proper native linking."
                : "PayHere SDK not available on this build.",
        );
        return;
    }

    const orderId = String(paymentObject?.order_id ?? "");

    const normalizePaymentId = (payload: unknown): string => {
        if (typeof payload === "string") return payload;
        if (payload && typeof payload === "object") {
            const value = payload as Record<string, unknown>;
            const possibleId =
                value.payment_id ??
                value.paymentId ??
                value.payhere_payment_id ??
                value.transaction_id ??
                value.id;

            if (typeof possibleId === "string" || typeof possibleId === "number") {
                return String(possibleId);
            }
        }

        return payload == null ? "" : String(payload);
    };

    const normalizeError = (payload: unknown): string => {
        if (typeof payload === "string") return payload;
        if (payload instanceof Error) return payload.message;
        if (payload && typeof payload === "object") {
            const value = payload as Record<string, unknown>;
            const message = value.message ?? value.error ?? value.status_message;
            if (typeof message === "string") return message;

            try {
                return JSON.stringify(value);
            } catch {
                return String(value);
            }
        }

        return payload == null ? "PayHere payment failed." : String(payload);
    };

    const handleSuccess = (payload: unknown) => {
        const paymentId = normalizePaymentId(payload);
        logger.log("[PayHere] Native success callback", {
            orderId,
            paymentId,
            payload,
        });
        onSuccess(paymentId);
    };

    const handleError = (payload: unknown) => {
        const error = normalizeError(payload);
        logger.warn("[PayHere] Native error callback", {
            orderId,
            error,
            payload,
        });
        onError(error);
    };

    const handleDismiss = () => {
        logger.log("[PayHere] Native dismiss callback", { orderId });
        onDismiss();
    };

    try {
        logger.log("[PayHere] Starting native payment", {
            orderId,
            amount: paymentObject?.amount,
            sandbox: paymentObject?.sandbox,
            authorize: paymentObject?.authorize,
            preapprove: paymentObject?.preapprove,
        });
        PayHere.startPayment(paymentObject, handleSuccess, handleError, handleDismiss);
    } catch (e: any) {
        // This commonly happens when the JS wrapper exists but the underlying native module is null.
        handleError(
            e?.message ||
                "Failed to start PayHere payment. Ensure you are using a Dev Build and the native module is linked.",
        );
    }
}

export type PayHerePaymentObject = Record<string, any>;

export function startPayHerePaymentObject(
    paymentObject: PayHerePaymentObject,
    onSuccess: (paymentId: string) => void,
    onError: (error: string) => void,
    onDismiss: () => void,
): void {
    startPaymentSafely(paymentObject, onSuccess, onError, onDismiss);
}

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
     logger.log(`[PayHere] authorize=true sandbox=${PAYHERE_IS_SANDBOX} merchantId=${MERCHANT_ID} clientAmount=${amount} serverAmount=${serverAmount}`);

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

    startPaymentSafely(paymentObject, onSuccess, onError, onDismiss);
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

     logger.log(`[PayHere Preapproval] sandbox=${PAYHERE_IS_SANDBOX} merchantId=${MERCHANT_ID} orderId=${params.orderId} amount=${amount}`);

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

    startPaymentSafely(paymentObject, onSuccess, onError, onDismiss);
}
