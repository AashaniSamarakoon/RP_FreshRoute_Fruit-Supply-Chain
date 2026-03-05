import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react-native";
import React, { ReactNode, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { BuyerColors } from "../../constants/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface InfoCardProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  actions?: ReactNode;
}

export default function InfoCard({
  title,
  icon: Icon,
  children,
  collapsible = false,
  defaultExpanded = true,
  actions,
}: InfoCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.header}
        onPress={collapsible ? toggleExpanded : undefined}
        activeOpacity={collapsible ? 0.7 : 1}
        disabled={!collapsible}
      >
        <View style={styles.headerLeft}>
          {Icon && (
            <View style={styles.iconContainer}>
              <Icon size={20} color={BuyerColors.primaryGreen} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        {collapsible &&
          (expanded ? (
            <ChevronUp size={20} color={BuyerColors.textGray} />
          ) : (
            <ChevronDown size={20} color={BuyerColors.textGray} />
          ))}
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.content}>{children}</View>

          {actions && <View style={styles.actionsContainer}>{actions}</View>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BuyerColors.cardWhite,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BuyerColors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BuyerColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: BuyerColors.border,
    padding: 16,
    gap: 12,
  },
});
