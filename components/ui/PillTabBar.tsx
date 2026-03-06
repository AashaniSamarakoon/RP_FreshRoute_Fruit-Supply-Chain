import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BuyerColors } from "../../constants/theme";

export interface PillTabItem<T extends string = string> {
  key: T;
  label: string;
  /** If provided and > 0, renders a count badge on the tab */
  count?: number;
}

interface PillTabBarProps<T extends string = string> {
  tabs: PillTabItem<T>[];
  activeKey: T;
  onPress: (key: T) => void;
  /** Defaults to BuyerColors.primaryGreen */
  activeColor?: string;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  content: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  labelActive: {
    color: "#FFFFFF",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeActive: {
    backgroundColor: "#FFFFFF",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
  },
});

export function PillTabBar<T extends string = string>({
  tabs,
  activeKey,
  onPress,
  activeColor = BuyerColors.primaryGreen,
}: PillTabBarProps<T>) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {tabs.map((tab) => {
          const active = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, active && { backgroundColor: activeColor }]}
              onPress={() => onPress(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
              {tab.count !== undefined && tab.count > 0 && (
                <View style={[styles.badge, active && styles.badgeActive]}>
                  <Text
                    style={[styles.badgeText, active && { color: activeColor }]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
