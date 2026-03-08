// ─── Core notification types ───────────────────────────────────────────────
// Extend these enums/interfaces here when you add new notification channels.

export type Role = "farmer" | "buyer";
export type RealtimeEventType = "INSERT" | "UPDATE" | "DELETE";
export type ToastPreset = "done" | "error";

/** Payload delivered to each handler's resolve() method */
export interface NotificationEvent {
    eventType: RealtimeEventType;
    record: Record<string, unknown>;
    oldRecord: Partial<Record<string, unknown>>;
}

/** What gets shown to the user */
export interface ToastContent {
    title: string;
    message: string;
    preset: ToastPreset;
    /**
     * Optional route to navigate to when the user taps the action button.
     * The hook converts this into a { label, onPress: router.push(viewRoute) } action.
     */
    viewRoute?: string;
    /** Label for the action button — defaults to "View" */
    viewLabel?: string;
}

/**
 * Contract every notification handler must satisfy.
 *
 * To add a new notification type:
 *  1. Create a file in services/notifications/handlers/
 *  2. Implement this interface
 *  3. Call notificationRegistry.register(yourHandler) at the bottom of that file
 *  4. Add one import line in services/notifications/index.ts
 *
 * That's it — no changes to the hook or layouts required.
 */
export interface NotificationHandler {
    /** Must be globally unique — used to prevent double-registration */
    readonly id: string;
    /** Supabase Realtime channel name — must be globally unique per subscription */
    readonly channelName: string;
    /** PostgreSQL table to observe */
    readonly table: string;
    /** DB schema (defaults to "public" if omitted) */
    readonly schema?: string;
    /** Which database operations to observe */
    readonly events: RealtimeEventType[];
    /**
     * Maps a realtime event to toast content for the given role.
     * Return null to silently suppress the notification.
     */
    resolve(role: Role, event: NotificationEvent): ToastContent | null;
}
