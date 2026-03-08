import Header from "@/components/Header";
import { BuyerColors } from "@/constants/theme";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
// Import Bottom Sheet components
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const { width, height } = Dimensions.get("window");

export default function TrackDeliveryScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    farmerLat?: string;
    farmerLng?: string;
    buyerLat?: string;
    buyerLng?: string;
    driverLat?: string;
    driverLng?: string;
  }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["15%", "15%"], []);

  useEffect(() => {
    if (params.orderId) fetchOrder();
    else setLoading(false);
  }, [params.orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("placed_orders")
        .select("*")
        .eq("id", params.orderId)
        .single();
      if (!error && data) setOrder(data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const farmerLocation = {
    latitude: params.farmerLat ? Number(params.farmerLat) : 6.9271,
    longitude: params.farmerLng ? Number(params.farmerLng) : 79.8612,
  };
  const buyerLocation = {
    latitude: params.buyerLat ? Number(params.buyerLat) : 6.8407,
    longitude: params.buyerLng ? Number(params.buyerLng) : 79.993,
  };

  const driverLocation =
    params.driverLat && params.driverLng
      ? {
          latitude: Number(params.driverLat),
          longitude: Number(params.driverLng),
        }
      : {
          latitude: (farmerLocation.latitude + buyerLocation.latitude) / 2,
          longitude: (farmerLocation.longitude + buyerLocation.longitude) / 2,
        };

  const mapCenter = {
    latitude: (farmerLocation.latitude + buyerLocation.latitude) / 2,
    longitude: (farmerLocation.longitude + buyerLocation.longitude) / 2,
  };
  const latDelta =
    Math.abs(farmerLocation.latitude - buyerLocation.latitude) * 2.5 + 0.06;
  const lngDelta =
    Math.abs(farmerLocation.longitude - buyerLocation.longitude) * 2.5 + 0.06;

  const handleCallDriver = () => {
    const phone = order?.driver_phone ?? "+94771234567";
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="Live Tracking" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Connecting to GPS...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <Header title="Live Tracking" showBackButton />

      <View style={styles.container}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: mapCenter.latitude,
            longitude: mapCenter.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: lngDelta,
          }}
          mapPadding={{ top: 0, right: 0, bottom: height * 0.45, left: 0 }}
        >
          <Marker coordinate={farmerLocation} title="Pickup Location">
            <View style={styles.markerContainer}>
              <View
                style={[styles.smallMarkerIcon, { backgroundColor: "#F59E0B" }]}
              >
                <Ionicons name="storefront" size={14} color="#FFF" />
              </View>
            </View>
          </Marker>

          <Marker coordinate={buyerLocation} title="Delivery Destination">
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.smallMarkerIcon,
                  { backgroundColor: BuyerColors.primaryGreen },
                ]}
              >
                <Ionicons name="location" size={14} color="#FFF" />
              </View>
            </View>
          </Marker>

          <Marker coordinate={driverLocation} title={order?.driver_name ?? "Driver"}>
            <View style={styles.markerContainer}>
              <View style={[styles.driverMarkerIcon, { backgroundColor: "#3B82F6" }]}> 
                <Ionicons name="car" size={20} color="#FFF" />
              </View>
            </View>
          </Marker>
        </MapView>

        <View style={styles.etaOverlay}>
          <Text style={styles.etaTitle}>Estimated Arrival</Text>
          <Text style={styles.etaTime}>45 Mins</Text>
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          style={styles.bottomSheetShadow}
          handleIndicatorStyle={styles.grabHandle}
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.cardHeader}>
              <View style={styles.driverInfo}>
                <View style={styles.driverAvatar}>
                  <Ionicons name="person" size={20} color="#9CA3AF" />
                </View>
                <View>
                  <Text style={styles.driverName}>{order?.driver_name ?? "Sunil Perera"}</Text>
                  <Text style={styles.vehicleDetails}>{order?.vehicle_details ?? "WP CA-1234 • Mini Truck"}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                <Ionicons name="call" size={20} color="#16A34A" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "500",
  },
  container: { flex: 1, backgroundColor: "#F3F4F6", position: "relative" },

  // --- Map Styles ---
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  smallMarkerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  driverMarkerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  // --- ETA Overlay ---
  etaOverlay: {
    position: "absolute",
    top: 20,
    alignSelf: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  etaTitle: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  etaTime: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
  },

  // --- Bottom Sheet Styles ---
  bottomSheetShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  grabHandle: {
    width: 48,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },

  // --- Driver Info Section ---
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  driverAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  driverName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  // --- Timeline Section ---
  timelineContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  timelineWrapper: {
    paddingLeft: 8,
  },

  // --- Order Details Card ---
  orderDetailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderDetailItem: {},
  orderDetailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  orderDetailsDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginBottom: 12,
  },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  orderInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    lineHeight: 18,
  },
});