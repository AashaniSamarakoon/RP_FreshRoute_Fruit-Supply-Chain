import { showNotification } from "@/components/notifications/NotificationBanner";
import {
  getBuyerPreferences,
  shouldShowBuyerNotification,
} from "@/utils/buyerPreferences";
import { supabase } from "@/utils/supabaseClient";
import { RealtimeChannel } from "@supabase/supabase-js";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";

// Side-effect import — triggers self-registration of all handlers
import "@/services/notifications";
import { notificationRegistry } from "@/services/notifications/registry";
import type { Role } from "@/services/notifications/types";

/**
 * Generic notification hook. Reads all registered handlers from
 * NotificationRegistry and opens one Supabase channel per handler.
 *
 * Mount once in a role _layout — it stays alive for the full session.
 * Adding new notification types requires zero changes to this file.
 *
 * @param role - The authenticated user's role ("farmer" | "buyer")
 */
export function useNotifications(role: Role): void {
  const router = useRouter();

  const buildActions = useCallback(
    (viewRoute?: string, viewLabel?: string) => {
      if (!viewRoute) return undefined;
      return [
        {
          label: viewLabel ?? "View",
          onPress: () => router.push(viewRoute as any),
        },
      ];
    },
    [router],
  );

  useEffect(() => {
    const handlers = notificationRegistry.getAll();

    const channels: RealtimeChannel[] = handlers.map((handler) => {
      let channel: RealtimeChannel = supabase.channel(handler.channelName);

      for (const eventType of handler.events) {
        channel = channel.on(
          "postgres_changes",
          {
            event: eventType,
            schema: handler.schema ?? "public",
            table: handler.table,
          },
          async (payload: { new: unknown; old: unknown }) => {
            try {
              const content = handler.resolve(role, {
                eventType,
                record: (payload.new ?? {}) as Record<string, unknown>,
                oldRecord: (payload.old ?? {}) as Record<string, unknown>,
              });

              if (!content) return;
              if (role === "buyer") {
                const preferences = await getBuyerPreferences();
                if (!shouldShowBuyerNotification(preferences, content)) {
                  return;
                }
              }

              showNotification({
                title: content.title,
                message: content.message,
                preset: content.preset,
                actions: buildActions(content.viewRoute, content.viewLabel),
              });
            } catch (error) {
              console.error(
                "[Notifications] Failed to handle realtime event",
                error,
              );
            }
          },
        ) as RealtimeChannel;
      }

      channel.subscribe();
      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [buildActions, role]);
}
