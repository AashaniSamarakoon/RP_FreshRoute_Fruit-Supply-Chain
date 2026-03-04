import { BACKEND_URL } from "@/config";
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
    const items = `${params.fruitType}${params.variant ? ` (${params.variant})` : ""
        } - ${params.quantity}kg`;

    const paymentObject = {
        sandbox: PAYHERE_IS_SANDBOX,
        merchant_id: process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_ID || "1228619",
        merchant_secret: process.env.EXPO_PUBLIC_PAYHERE_MERCHANT_SECRET || "",
        notify_url: `${BACKEND_URL}/api/payhere/notify`,
        order_id: params.orderId,
        items,
        // In sandbox mode use a small fixed amount to stay within free-tier limits.
        // The real amount is stored in the backend; PayHere sandbox only validates flow.
        amount: PAYHERE_IS_SANDBOX ? "100.00" : rawAmount.toFixed(2),
        currency: "LKR",
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
