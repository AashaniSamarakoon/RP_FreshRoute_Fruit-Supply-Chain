import Header from "@/components/Header";
import { BACKEND_URL } from "@/config";
import { BuyerColors } from "@/constants/theme";
import { FarmerInfo, PlacedOrder, TransporterInfo } from "@/types";
import { formatCurrency, formatDate, formatTime } from "@/utils/formatters";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<PlacedOrder | null>(null);
  const [farmer, setFarmer] = useState<FarmerInfo | null>(null);
  const [transporter, setTransporter] = useState<TransporterInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bankDetailsVisible, setBankDetailsVisible] = useState(false);
  const [harvestDate, setHarvestDate] = useState<string | null>(null);

  useEffect(() => {
    if (params.orderId) {
      fetchOrderDetails();
    }
  }, [params.orderId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (params.orderId && !loading) {
        fetchOrderDetails(true); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [params.orderId, loading]);

  const fetchOrderDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      if (!params.orderId) throw new Error("No orderId provided");

      const token = await AsyncStorage.getItem("token");

      const res = await fetch(
        `${BACKEND_URL}/api/buyer/place-order/details/${params.orderId}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              }
            : { "Content-Type": "application/json" },
        },
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch order details: ${res.status}`);
      }

      const data = await res.json();
      console.log("order detail response", data);

      // Expecting backend to return an object with `order` (and optional related data)
      // unwrap prices located at root of response
      const orderData = data.order || {};
      // copy price/delivery fields from root if present
      const merged: any = { ...orderData };
      [
        "unitPrice",
        "basePrice",
        "serviceCharge",
        "deliveryFee",
        "totalPrice",
        "deliveryType",
      ].forEach((key) => {
        if (data[key] !== undefined) merged[key] = data[key];
      });
      setOrder(merged || null);

      // If backend returns farmer info include it; otherwise leave existing state
      if (data.farmer) {
        const userData = data.farmer.user || data.farmer.users || {};
        setFarmer({
          id: data.farmer.id,
          name: userData?.name || userData?.full_name || "Unknown",
          phone: userData?.phone || "",
          rating: undefined,
          location: data.farmer.location || undefined,
        });
      }

      // If backend includes images/harvest info populate them
      if (orderData?.product_images) {
        setProductImages(
          Array.isArray(orderData.product_images)
            ? orderData.product_images
            : [orderData.product_images],
        );
      } else {
        setProductImages([]);
      }

      if (orderData?.harvest_date || orderData?.estimated_harvest_date) {
        setHarvestDate(
          orderData.harvest_date || orderData.estimated_harvest_date,
        );
      } else {
        setHarvestDate(null);
      }
    } catch (error) {
      // Silent error handling - keep UI stable
      setOrder(null);
      setProductImages([]);
      setFarmer(null);
      setTransporter(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const getPrimaryAction = () => {
    if (!order) return null;

    switch (order.status) {
      case "AWAITING_PAYMENT":
        return {
          label: "Upload Payment Slip",
          onPress: () =>
            router.push({
              pathname: "/buyer/upload-payment" as any,
              params: { orderId: order.id },
            }),
        };
      case "IN_TRANSIT":
        return {
          label: "Track Your Order",
          onPress: () =>
            router.push({
              pathname: "/buyer/track-delivery" as any,
              params: { orderId: order.id },
            }),
        };
      case "DELIVERED":
        return {
          label: "Confirm Receipt",
          onPress: () => {},
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Summary" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Order Summary" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const primaryAction = getPrimaryAction();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Order Summary" showBackButton />
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Order Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <View style={styles.infoItemThree}>
                <Text style={styles.infoLabel}>ORDER ID</Text>
                <Text style={styles.infoValue}>
                  {order.id.substring(0, 8).toUpperCase()}
                </Text>
              </View>
              <View style={styles.infoItemThree}>
                <Text style={styles.infoLabel}>ORDER PLACED</Text>
                <Text style={styles.infoValue}>
                  {formatDate(order.created_at)}
                </Text>
                <Text style={styles.infoValueSmall}>
                  {formatTime(order.created_at)}
                </Text>
              </View>
              {order.farmer_accepted_at && (
                <View style={styles.infoItemThree}>
                  <Text style={styles.infoLabel}>FARMER ACCEPTED</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(order.farmer_accepted_at)}
                  </Text>
                  <Text style={styles.infoValueSmall}>
                    {formatTime(order.farmer_accepted_at)}
                  </Text>
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.statusDivider} />
          </View>

          {/* Product Detail */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Product Detail</Text>
            <View style={styles.productCard}>
              {/* Product Image */}
              <TouchableOpacity
                style={styles.productImageContainer}
                onPress={() => {
                  if (productImages.length > 0) {
                    setSelectedImageIndex(0);
                    setImageViewerVisible(true);
                  }
                }}
              >
                {productImages.length > 0 ? (
                  <>
                    <Image
                      source={{ uri: productImages[0] }}
                      style={styles.productImage}
                    />
                    {productImages.length > 1 && (
                      <View style={styles.imageCountBadge}>
                        <Text style={styles.imageCountText}>
                          +{productImages.length - 1}
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.emptyImagePlaceholder} />
                )}
              </TouchableOpacity>

              {/* Product Info */}
              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {order.fruit_type} - {order.variant}
                </Text>
                <Text style={styles.productDetail}>Grade {order.grade}</Text>
                <Text style={styles.productDetail}>
                  Qty: {order.quantity} kg
                </Text>
                {harvestDate && (
                  <Text style={styles.productDetail}>
                    Est. Harvest: {formatDate(harvestDate)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.statusDivider} />

          {/* Pickup & Delivery Locations */}
          <View style={styles.card}>
            <View style={styles.locationContainer}>
              {/* Pickup Location */}
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>Pickup Location</Text>
                <View style={styles.addressCard}>
                  <MapPin size={20} color={BuyerColors.textGray} />
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressText}>
                      {farmer?.location ||
                        "Green Valley Farm, Nuwara Eliya Road, Pussellawa, Central Province"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vertical Dashed Line */}
              <View style={styles.verticalDashedLine} />

              {/* Delivery Address */}
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <View style={styles.addressCard}>
                  <MapPin size={20} color={BuyerColors.textGray} />
                  <View style={styles.addressInfo}>
                    <Text style={styles.addressText}>
                      {order.delivery_location ||
                        "No. 123, Main Street, Colombo 07, Western Province, Sri Lanka"}
                    </Text>
                    {/* Delivery estimate - Show after payment */}
                    {/* {order.required_date && (
                      <Text style={styles.deliveryEstimate}>
                        Delivery estimate: {formatDate(order.required_date)}
                      </Text>
                    )} */}
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Fixed Bottom Section - Price Details & Action Button */}
        <View style={styles.fixedBottom}>
          <View style={styles.fixedBottomContent}>
            <Text style={styles.sectionTitle}>Price Details</Text>
            <View style={styles.priceCard}>
              {order.unitPrice != null && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Unit Price</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(order.unitPrice)}
                  </Text>
                </View>
              )}
              {order.basePrice != null && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Base Price</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(order.basePrice)}
                  </Text>
                </View>
              )}
              {order.serviceCharge != null && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Service Charge</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(order.serviceCharge)}
                  </Text>
                </View>
              )}
              {order.deliveryFee != null && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Fee</Text>
                  <Text style={styles.priceValue}>
                    {formatCurrency(order.deliveryFee)}
                  </Text>
                </View>
              )}
              {order.deliveryType && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Delivery Type</Text>
                  <Text style={styles.priceValue}>{order.deliveryType}</Text>
                </View>
              )}
              <View style={styles.priceRow}></View>
              {order.target_price &&
                order.totalPrice &&
                order.totalPrice < order.target_price && (
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Discount</Text>
                    <Text style={styles.priceDiscount}>
                      -{formatCurrency(order.target_price - order.totalPrice)}
                    </Text>
                  </View>
                )}

              <View style={styles.priceDivider} />
              <View style={styles.priceRow}>
                <Text style={styles.priceTotalLabel}>Total Amount</Text>
                <Text style={styles.priceTotalValue}>
                  Rs.{" "}
                  {order.totalPrice ? formatCurrency(order.totalPrice) : "N/A"}
                </Text>
              </View>
            </View>

            {/* Primary Action Button */}
            {primaryAction && (
              <>
                {order.status === "AWAITING_PAYMENT" && (
                  <TouchableOpacity
                    style={styles.viewBankDetailsLink}
                    onPress={() => setBankDetailsVisible(true)}
                  >
                    <Text style={styles.viewBankDetailsText}>
                      View Bank Details
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={primaryAction.onPress}
                >
                  <Text style={styles.primaryButtonText}>
                    {primaryAction.label}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageViewerVisible(false)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x /
                  Dimensions.get("window").width,
              );
              setSelectedImageIndex(index);
            }}
          >
            {productImages.map((uri, index) => (
              <View key={index} style={styles.modalImageContainer}>
                <Image
                  source={{ uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {productImages.length > 1 && (
            <View style={styles.modalImageCounter}>
              <Text style={styles.modalImageCounterText}>
                {selectedImageIndex + 1} / {productImages.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Bank Details Modal */}
      <Modal
        visible={bankDetailsVisible}
        transparent={false}
        animationType="slide"
        backdropColor="rgba(0, 0, 0, 0)"
        onRequestClose={() => setBankDetailsVisible(false)}
      >
        <View style={styles.bankModalWrapper}>
          <View style={styles.bankModalContainer}>
            <View style={styles.bankModalHeader}>
              <Text style={styles.bankModalTitle}>Bank Account Details</Text>
              <TouchableOpacity
                onPress={() => setBankDetailsVisible(false)}
                style={styles.bankModalClose}
              >
                <Text style={styles.bankModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.bankModalContent}>
              <Text style={styles.bankModalSubtitle}>
                Please transfer the total amount to any of the following bank
                accounts:
              </Text>

              {/* Bank 1 - Commercial Bank */}
              <View style={styles.bankCard}>
                <Text style={styles.bankName}>Commercial Bank of Ceylon</Text>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Name:</Text>
                  <Text style={styles.bankDetailValue}>FreshRoute Pvt Ltd</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Number:</Text>
                  <Text style={styles.bankDetailValue}>1234567890</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch:</Text>
                  <Text style={styles.bankDetailValue}>
                    Colombo Main Branch
                  </Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch Code:</Text>
                  <Text style={styles.bankDetailValue}>001</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>SWIFT Code:</Text>
                  <Text style={styles.bankDetailValue}>CCEYLKLX</Text>
                </View>
              </View>

              {/* Bank 2 - Bank of Ceylon */}
              <View style={styles.bankCard}>
                <Text style={styles.bankName}>Bank of Ceylon</Text>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Name:</Text>
                  <Text style={styles.bankDetailValue}>FreshRoute Pvt Ltd</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Number:</Text>
                  <Text style={styles.bankDetailValue}>9876543210</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch:</Text>
                  <Text style={styles.bankDetailValue}>Kandy Branch</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch Code:</Text>
                  <Text style={styles.bankDetailValue}>305</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>SWIFT Code:</Text>
                  <Text style={styles.bankDetailValue}>BCEYLKLX</Text>
                </View>
              </View>

              {/* Bank 3 - Sampath Bank */}
              <View style={styles.bankCard}>
                <Text style={styles.bankName}>Sampath Bank PLC</Text>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Name:</Text>
                  <Text style={styles.bankDetailValue}>FreshRoute Pvt Ltd</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Account Number:</Text>
                  <Text style={styles.bankDetailValue}>5647382910</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch:</Text>
                  <Text style={styles.bankDetailValue}>Galle Road Branch</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>Branch Code:</Text>
                  <Text style={styles.bankDetailValue}>125</Text>
                </View>
                <View style={styles.bankDetailRow}>
                  <Text style={styles.bankDetailLabel}>SWIFT Code:</Text>
                  <Text style={styles.bankDetailValue}>BSAMLKLX</Text>
                </View>
              </View>

              <View style={styles.bankModalNote}>
                <Text style={styles.bankModalNoteTitle}>Important Note:</Text>
                <Text style={styles.bankModalNoteText}>
                  • Please use your Order ID (
                  {order?.id.substring(0, 8).toUpperCase()}) as the payment
                  reference
                </Text>
                <Text style={styles.bankModalNoteText}>
                  • After making the payment, upload the payment slip to confirm
                  your order
                </Text>
                <Text style={styles.bankModalNoteText}>
                  • Payment confirmation may take 1-2 business days
                </Text>
              </View>
            </ScrollView>

            {/* <TouchableOpacity
              style={styles.bankModalButton}
              onPress={() => setBankDetailsVisible(false)}
            >
              <Text style={styles.bankModalButtonText}>Close</Text>
            </TouchableOpacity> */}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  mainContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
  },
  infoCard: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  infoGrid: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    width: "50%",
    marginBottom: 14,
  },
  infoItemThree: {
    width: "33.33%",
    paddingHorizontal: 4,
  },
  infoLabel: {
    fontSize: 10,
    color: "#888",
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 13,
    color: BuyerColors.textBlack,
    fontWeight: "600",
    marginBottom: 2,
  },
  infoValueSmall: {
    fontSize: 12,
    color: "#666",
    fontWeight: "400",
  },
  infoValuePrimary: {
    fontSize: 18,
    color: BuyerColors.primaryGreen,
    fontWeight: "700",
  },
  timelineContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    gap: 16,
  },
  timelineItem: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    padding: 12,
  },
  timelineLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 14,
    color: BuyerColors.textBlack,
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineTime: {
    fontSize: 13,
    color: "#666",
  },
  statusDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    marginBottom: 14,
  },
  locationContainer: {
    gap: 20,
  },
  locationSection: {
    flex: 1,
  },
  verticalDashedLine: {
    width: 1,
    height: 40,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    alignSelf: "flex-start",
    marginStart: 8,
    marginVertical: 0,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  emptyImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F8F8F8",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: BuyerColors.textBlack,
    marginBottom: 8,
  },
  productDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressInfo: {
    flex: 1,
    marginLeft: 12,
  },
  addressText: {
    fontSize: 14,
    color: BuyerColors.textBlack,
    lineHeight: 22,
    marginBottom: 8,
  },
  deliveryEstimate: {
    fontSize: 13,
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
  },
  fixedBottom: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedBottomContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  priceCard: {
    gap: 14,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 15,
    color: "#333",
  },
  priceValue: {
    fontSize: 15,
    color: "#333",
  },
  priceDiscount: {
    fontSize: 15,
    color: "#d32f2f",
    fontWeight: "500",
  },
  priceFree: {
    fontSize: 15,
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
  },
  priceDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 4,
  },
  priceTotalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  priceTotalValue: {
    fontSize: 17,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  viewBankDetailsLink: {
    alignItems: "flex-start",
    paddingVertical: 12,
    marginTop: 12,
  },
  viewBankDetailsText: {
    color: BuyerColors.primaryGreen,
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  primaryButton: {
    backgroundColor: "#000",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  bottomPadding: {
    height: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  modalImageContainer: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageCounter: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modalImageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bankModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bankModalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bankModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "95%",
    paddingBottom: 20,
  },
  bankModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bankModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BuyerColors.textBlack,
  },
  bankModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  bankModalCloseText: {
    fontSize: 18,
    color: "#666",
    fontWeight: "600",
  },
  bankModalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bankModalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    lineHeight: 20,
  },
  bankCard: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  bankName: {
    fontSize: 16,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#D0D0D0",
  },
  bankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bankDetailLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  bankDetailValue: {
    fontSize: 13,
    color: BuyerColors.textBlack,
    fontWeight: "600",
  },
  bankModalNote: {
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FFB800",
  },
  bankModalNoteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  bankModalNoteText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
    lineHeight: 20,
  },
  bankModalButton: {
    backgroundColor: "#000",
    marginHorizontal: 20,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  bankModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
