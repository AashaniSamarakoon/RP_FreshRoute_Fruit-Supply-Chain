// Shared helper functions for farmer card components

export const parseImageUrls = (rawImage: any): string[] => {
    if (!rawImage) return [];
    try {
        if (typeof rawImage === 'string') {
            if (rawImage.startsWith('[')) {
                return JSON.parse(rawImage);
            }
            return [rawImage];
        }
        if (Array.isArray(rawImage)) {
            return rawImage.flat(Infinity).filter(Boolean);
        }
    } catch (e) {
        console.warn("Failed to parse image URLs", e);
    }
    return [];
};

export type FruitMeta = { emoji: string; bg: string };
const FRUIT_MAP: Array<[string[], FruitMeta]> = [
    [["banana"], { emoji: "🍌", bg: "#FEF3C7" }],
    [["mango"], { emoji: "🥭", bg: "#FFEDD5" }],
    [["pineapple"], { emoji: "🍍", bg: "#FEF08A" }],
];
const DEFAULT_FRUIT: FruitMeta = { emoji: "🌿", bg: "#D1FAE5" };

export const getFruitMeta = (name: string): FruitMeta => {
    const lc = name?.toLowerCase() || "";
    return FRUIT_MAP.find(([keys]) => keys.some((k) => lc.includes(k)))?.[1] ?? DEFAULT_FRUIT;
};

// status mapping reused by multiple components
export type StatusMeta = { label: string; color: string; bg: string };

export const ORDER_STATUS_META: Record<string, StatusMeta> = {
    AWAITING_PAYMENT: { label: "Payment Due", color: "#BE123C", bg: "#FFE4E6" },
    READY_FOR_PICKUP: { label: "Ready for Pickup", color: "#065F46", bg: "#D1FAE5" },
    PICKED_UP: { label: "Picked Up", color: "#4F46E5", bg: "#E0E7FF" },
    DELIVERED: { label: "Delivered", color: "#166534", bg: "#BBF7D0" },
    COMPLETED: { label: "Completed", color: "#166534", bg: "#BBF7D0" },
    AUTHORIZED_PAYMENT: { label: "Authorized", color: "#B45309", bg: "#FEF3C7" },
};
