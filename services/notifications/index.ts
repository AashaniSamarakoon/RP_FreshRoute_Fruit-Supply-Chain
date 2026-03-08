/**
 * Notification system barrel.
 *
 * ─── Adding a new notification type ──────────────────────────────────────────
 *  1. Create services/notifications/handlers/yourHandler.ts
 *  2. Implement NotificationHandler and call notificationRegistry.register(...)
 *  3. Add one import line below (e.g. import "./handlers/yourHandler")
 *  4. Done — the hook and layouts pick it up automatically.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Each import below is a side-effect import: it causes the handler to
 * self-register into notificationRegistry when this module is first loaded.
 */

// ─── Register all handlers ────────────────────────────────────────────────────
import "./handlers/proposalHandler";
// Future: import "./handlers/deliveryHandler";
// Future: import "./handlers/paymentHandler";
// Future: import "./handlers/alertHandler";

// ─── Public API ───────────────────────────────────────────────────────────────
export { notificationRegistry } from "./registry";
export type {
    NotificationEvent, NotificationHandler, RealtimeEventType, Role, ToastContent, ToastPreset
} from "./types";

