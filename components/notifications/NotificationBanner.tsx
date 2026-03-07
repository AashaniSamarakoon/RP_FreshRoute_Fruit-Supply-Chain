/**
 * Custom notification banner — slides in from the top of the screen.
 *
 * Architecture:
 * - `showNotification(content)` — imperative API callable from anywhere
 * - `NotificationBannerHost` — mount ONCE in the root _layout.tsx
 */

import { Ionicons } from "@expo/vector-icons";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
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
  _show?.(content);
}

// ─── NotificationBannerHost ───────────────────────────────────────────────────

const SLIDE_OUT_Y = -220;
const SLIDE_OUT_X = 420;
const SPRING_CONFIG = { damping: 14, stiffness: 155, mass: 0.9 };

export function NotificationBannerHost(): React.ReactElement | null {
  const [content, setContent] = useState<BannerContent | null>(null);
  const insets = useSafeAreaInsets();
  const topOffset = insets.top > 0 ? insets.top : Platform.OS === "ios" ? 50 : 28;

  const translateY = useSharedValue(SLIDE_OUT_Y);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const clearTimer = useCallback(() => clearTimeout(timerRef.current), []);

  const slideOut = useCallback(
    (onDone?: () => void) => {
      translateY.value = withTiming(SLIDE_OUT_Y, { duration: 300 }, (done) => {
        if (done && onDone) runOnJS(onDone)();
      });
    },
    [translateY],
  );

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current);
    slideOut(() => {
      translateX.value = 0;
      opacity.value = 1;
      setContent(null);
    });
  }, [slideOut, translateX, opacity]);

  const show = useCallback(
    (c: BannerContent) => {
      clearTimeout(timerRef.current);
      translateY.value = SLIDE_OUT_Y;
      translateX.value = 0;
      opacity.value = 1;
      setContent(c);
      translateY.value = withSpring(0, SPRING_CONFIG);
      // Extra reading time if there are action buttons
      timerRef.current = setTimeout(dismiss, c.actions?.length ? 8000 : 6500); 
    },
    [dismiss, translateY],
  );

  useEffect(() => {
    _show = show;
    return () => {
      _show = null;
    };
  }, [show]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          const absX = Math.abs(e.translationX);
          const absY = Math.abs(e.translationY);

          if (absX > absY) {
            translateX.value = e.translationX;
            opacity.value = Math.max(0, 1 - absX / 220);
          } else if (e.translationY < 0) {
            translateY.value = e.translationY;
          }
        })
        .onEnd((e) => {
          const absX = Math.abs(e.translationX);
          const absY = Math.abs(e.translationY);

          if (absX > absY && absX > 80) {
            runOnJS(clearTimer)();
            const direction = e.translationX > 0 ? 1 : -1;
            translateX.value = withTiming(direction * SLIDE_OUT_X, { duration: 240 }, (done) => {
              if (done) {
                runOnJS(setContent)(null);
                translateX.value = 0;
                opacity.value = 1;
              }
            });
          } else if (e.translationY < -45) {
            runOnJS(clearTimer)();
            translateY.value = withTiming(SLIDE_OUT_Y, { duration: 260 }, (done) => {
              if (done) {
                runOnJS(setContent)(null);
                translateX.value = 0;
                opacity.value = 1;
              }
            });
          } else {
            translateX.value = withSpring(0, SPRING_CONFIG);
            opacity.value = withTiming(1, { duration: 180 });
            translateY.value = withSpring(0, SPRING_CONFIG);
          }
        }),
    [clearTimer, translateX, translateY, opacity],
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

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
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.wrapper, { top: topOffset + 8 }, animStyle]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={content.onPress ? 0.8 : 1}
          onPress={content.onPress}
          style={styles.card}
        >
          
          {/* Status Icon - Kept separate so it doesn't affect text alignment */}
          <Ionicons 
            name={config.icon} 
            size={22} 
            color={config.color} 
            style={styles.statusIcon} 
          />

          {/* Main Content Column - Title, Message, and Actions strictly stacked */}
          <View style={styles.contentColumn}>
            
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.message}>{content.message}</Text>

            {/* Render Actions if provided */}
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

          {/* Close Button - Pinned to Top Right */}
          <TouchableOpacity
            onPress={dismiss}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>

        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
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
    marginTop: -2, // Aligns perfectly with the visual center of the title text
    marginRight: 12, // Provides space between the icon and the text block
  },
  contentColumn: {
    flex: 1, // This forces the text block to take up the middle space independently
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