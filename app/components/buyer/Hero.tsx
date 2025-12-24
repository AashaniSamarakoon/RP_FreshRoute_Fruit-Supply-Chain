import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BuyerColors } from "../../../constants/theme";

const Hero = () => {
  const router = useRouter();

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroTitle}>Wanna{"\n"}Best Deals?</Text>
      <Text style={styles.heroDescription}>
        Tell us what you need, we will match you with the perfect farmers for
        the best price and quality.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.push("/buyer/screens/PlaceOrder")}
      >
        <Text style={styles.primaryButtonText}>Place Order Now </Text>
        <ChevronRight size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: BuyerColors.cardWhite,
    marginHorizontal: 20,
    marginTop: 24,
    padding: 24,
    borderRadius: 20,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 3,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: BuyerColors.textBlack,
    marginBottom: 12,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroDescription: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: BuyerColors.primaryGreen,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 50,
    alignSelf: "flex-start",
  },
  primaryButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 4,
  },
});

export default Hero;
