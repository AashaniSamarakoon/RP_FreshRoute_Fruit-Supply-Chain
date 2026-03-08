import { NotificationHandler } from "./types";

/**
 * Central registry for all notification handlers.
 *
 * Handlers self-register on import (side-effect pattern).
 * The registry is a module-level singleton — each handler is
 * registered exactly once per app session.
 */
class NotificationRegistry {
    private readonly handlers = new Map<string, NotificationHandler>();

    register(handler: NotificationHandler): void {
        if (this.handlers.has(handler.id)) {
            if (__DEV__) {
                console.warn(
                    `[NotificationRegistry] Handler "${handler.id}" is already registered. Skipping duplicate.`,
                );
            }
            return;
        }
        this.handlers.set(handler.id, handler);
    }

    getAll(): NotificationHandler[] {
        return Array.from(this.handlers.values());
    }
}

export const notificationRegistry = new NotificationRegistry();
