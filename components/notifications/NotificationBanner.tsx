/**
 * Custom notification banner — slides in from the top of the screen.
 *
 * Architecture:
 * - `showNotification(content)` — imperative API callable from anywhere
 * - `NotificationBannerHost` — mount ONCE in the root _layout.tsx
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Public types ─────────────────────────────────────────────────────────────

export interface BannerAction {
  label: string;
  onPress: () => void;
}

export interface BannerContent {
  title: string;
  message: string;
  preset?: "done" | "success" | "error" | "info" | "warning";
  actions?: BannerAction[];
  onPress?: () => void;
}

// ─── Imperative bridge ────────────────────────────────────────────────────────

type ShowFn = (content: BannerContent) => void;
let _show: ShowFn | null = null;

export function showNotification(content: BannerContent): void {
  if (!_show || !content || typeof content !== "object") return;
  const actions = Array.isArray(content.actions)
    ? content.actions.filter(
        (action) =>
          action &&
          typeof action.label === "string" &&
          typeof action.onPress === "function",
      )
    : undefined;
  _show({
    title: typeof content.title === "string" ? content.title : "Notification",
    message: typeof content.message === "string" ? content.message : "",
    preset: content.preset,
    actions,
    onPress:
      typeof content.onPress === "function" ? content.onPress : undefined,
  });
}

// ─── NotificationBannerHost ───────────────────────────────────────────────────

const SLIDE_OUT_Y = -220;

export function NotificationBannerHost(): React.ReactElement | null {
  const [content, setContent] = useState<BannerContent | null>(null);
  const insets = useSafeAreaInsets();
  const topOffset =
    insets.top > 0 ? insets.top : Platform.OS === "ios" ? 50 : 28;

  const translateY = useRef(new Animated.Value(SLIDE_OUT_Y)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const slideOut = useCallback(
    (onDone?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SLIDE_OUT_Y,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) onDone?.();
      });
    },
    [opacity, translateY],
  );

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    slideOut(() => {
      setContent(null);
    });
  }, [slideOut]);

  const show = useCallback(
    (c: BannerContent) => {
      clearTimeout(timerRef.current);
      translateY.stopAnimation();
      opacity.stopAnimation();
      translateY.setValue(SLIDE_OUT_Y);
      opacity.setValue(0);
      setContent(c);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 16,
          stiffness: 180,
          mass: 0.9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
      ]).start();
      // Extra reading time if there are action buttons
      timerRef.current = setTimeout(dismiss, c.actions?.length ? 8000 : 6500);
    },
    [dismiss, opacity, translateY],
  );

  useEffect(() => {
    _show = show;
    return () => {
      _show = null;
    };
  }, [show]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  if (!content) return null;

  // Icon and color configuration based on preset
  const getPresetConfig = () => {
    switch (content.preset) {
      case "success":
      case "done":
        return { color: "#16A34A", icon: "checkmark-circle" as const };
      case "error":
        return { color: "#DC2626", icon: "close-circle" as const };
      case "warning":
        return { color: "#D97706", icon: "warning" as const };
      case "info":
      default:
        return { color: "#2563EB", icon: "information-circle" as const };
    }
  };

  const config = getPresetConfig();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: topOffset + 8,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={content.onPress ? 0.8 : 1}
        onPress={content.onPress}
        style={styles.card}
      >
        <Ionicons
          name={config.icon}
          size={22}
          color={config.color}
          style={styles.statusIcon}
        />

        <View style={styles.contentColumn}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.message}>{content.message}</Text>

          {content.actions && content.actions.length > 0 && (
            <View style={styles.actionsRow}>
              {content.actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    action.onPress();
                    dismiss();
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  statusIcon: {
    marginTop: -2,
    marginRight: 12,
  },
  contentColumn: {
    flex: 1,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
    // No padding needed here; it is naturally aligned with the title by the contentColumn
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 12,
  },
  actionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  closeBtn: {
    marginLeft: 16,
    marginTop: -2,
  },
});
