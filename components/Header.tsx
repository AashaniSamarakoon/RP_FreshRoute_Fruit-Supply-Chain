import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Bell } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
  showNotification?: boolean;
  onNotificationPress?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  showBackButton,
  rightComponent,
  showNotification,
  onNotificationPress,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const renderRight = () => {
    if (rightComponent) return rightComponent;
    if (showNotification) {
      return (
        <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn}>
          <Bell size={24} color="#000" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      );
    }
    return <View style={{ width: 24 }} />;
  };

  const shouldShowBack = onBack || showBackButton;

  return (
    <View style={styles.header}>
      {shouldShowBack ? (
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      {renderRight()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#000" },
  iconBtn: {
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "red",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
});

export default Header;
