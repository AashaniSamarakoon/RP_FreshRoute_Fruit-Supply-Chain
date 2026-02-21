import Header from "@/components/Header";
import DetailRow from "@/components/ui/DetailRow";
import InfoCard from "@/components/ui/InfoCard";
import { BuyerColors } from "@/constants/theme";
import { Payment, SlipVerificationStatus } from "@/types";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import { supabase } from "@/utils/supabaseClient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Phone,
  XCircle,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

interface StatusConfig {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
  message: string;
  estimatedTime?: string;
}

const STATUS_CONFIGS: Record<SlipVerificationStatus, StatusConfig> = {
  PENDING: {
    icon: Clock,
    iconColor: "#F57C00",
    bgColor: "#FFF3E0",
    title: "Payment Under Review",
    message: "Your payment slip is being verified by our team.",
    estimatedTime: "2-4 hours",
  },
  AUTO_APPROVED: {
    icon: CheckCircle,
    iconColor: "#2E7D32",
    bgColor: "#E8F5E9",
    title: "Payment Automatically Verified",
    message: "Order confirmed. Waiting for driver assignment.",
  },
  FLAGGED: {
    icon: AlertCircle,
    iconColor: "#F57C00",
    bgColor: "#FFF3E0",
    title: "Requires Manual Review",
    message: "Our team will verify your payment slip manually.",
    estimatedTime: "Within 24 hours",
  },
  APPROVED: {
    icon: CheckCircle,
    iconColor: "#2E7D32",
    bgColor: "#E8F5E9",
    title: "Payment Verified",
    message: "Your payment has been approved by our admin.",
  },
  REJECTED: {
    icon: XCircle,
    iconColor: "#C62828",
    bgColor: "#FFEBEE",
    title: "Payment Rejected",
    message: "Please review the notes below and upload a new payment slip.",
  },
};

export default function PaymentStatusScreen() {
  const params = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (params.orderId) {
      fetchPaymentStatus();
    }
  }, [params.orderId]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (params.orderId && !loading) {
        fetchPaymentStatus(true); // Silent refresh
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [params.orderId, loading]);

  const fetchPaymentStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      console.log(
        "[PaymentStatus] Fetching payment status for orderId:",
        params.orderId,
        silent ? "(silent)" : "",
      );

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("order_id", params.orderId)
        .single();

      if (error) {
        console.error("[PaymentStatus] Error fetching payment:", error);
        throw error;
      }
      console.log("[PaymentStatus] Payment data received:", {
        status: data.status,
        verification_status: data.slip_verification_status,
        amount: data.amount,
        has_slip: !!data.payment_slip_url,
        has_ocr_data: !!data.slip_ocr_data,
      });
      setPayment(data);
    } catch (error) {
      console.error(
        "[PaymentStatus] Fatal error in fetchPaymentStatus:",
        error,
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentStatus();
  };

  const handleUploadNewSlip = () => {
    router.push({
      pathname: "/buyer/upload-payment" as any,
      params: { orderId: params.orderId },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Payment Status" showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BuyerColors.primaryGreen} />
          <Text style={styles.loadingText}>Loading payment status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!payment) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Payment Status" showBackButton />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Payment information not found</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUploadNewSlip}
          >
            <Text style={styles.primaryButtonText}>Upload Payment Slip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusConfig = STATUS_CONFIGS[payment.slip_verification_status];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Payment Status" showBackButton />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View
          style={[styles.statusCard, { backgroundColor: statusConfig.bgColor }]}
        >
          <View style={styles.statusIconContainer}>
            <statusConfig.icon size={48} color={statusConfig.iconColor} />
          </View>
          <Text style={styles.statusTitle}>{statusConfig.title}</Text>
          <Text style={styles.statusMessage}>{statusConfig.message}</Text>
          {statusConfig.estimatedTime && (
            <View style={styles.estimatedTimeContainer}>
              <Clock size={16} color={BuyerColors.textGray} />
              <Text style={styles.estimatedTimeText}>
                Estimated time: {statusConfig.estimatedTime}
              </Text>
            </View>
          )}
        </View>

        {/* Rejection Notes */}
        {payment.slip_verification_status === "REJECTED" &&
          payment.slip_verification_notes && (
            <InfoCard
              title="Rejection Reason"
              icon={AlertCircle}
              defaultExpanded
            >
              <Text style={styles.rejectionNotes}>
                {payment.slip_verification_notes}
              </Text>
            </InfoCard>
          )}

        {/* Payment Details */}
        <InfoCard title="Payment Details" icon={CreditCard} defaultExpanded>
          <DetailRow
            label="Amount"
            value={formatCurrency(payment.amount)}
            bold
            large
          />
          <DetailRow label="Currency" value={payment.currency} />
          <DetailRow label="Method" value="Bank Slip" />
          <DetailRow
            label="Status"
            value={payment.slip_verification_status.replace(/_/g, " ")}
          />
          {payment.slip_uploaded_at && (
            <DetailRow
              label="Uploaded At"
              value={formatDateTime(payment.slip_uploaded_at)}
            />
          )}
          {payment.slip_verified_at && (
            <DetailRow
              label="Verified At"
              value={formatDateTime(payment.slip_verified_at)}
              showDivider={false}
            />
          )}
        </InfoCard>

        {/* OCR Data */}
        {payment.slip_ocr_data && (
          <InfoCard title="Extracted Information" icon={Eye} defaultExpanded>
            <DetailRow
              label="Amount"
              value={formatCurrency(payment.slip_ocr_data.amount)}
            />
            <DetailRow label="Date" value={payment.slip_ocr_data.date} />
            <DetailRow
              label="Reference"
              value={payment.slip_ocr_data.reference}
            />
            <DetailRow label="Bank" value={payment.slip_ocr_data.bank} />
            <DetailRow
              label="Confidence"
              value={`${Math.round(payment.slip_ocr_data.confidence * 100)}%`}
              showDivider={false}
            />
          </InfoCard>
        )}

        {/* Payment Slip Image */}
        {payment.payment_slip_url && (
          <TouchableOpacity
            style={styles.imagePreviewContainer}
            onPress={() => setImageModalVisible(true)}
          >
            <Text style={styles.imagePreviewLabel}>Uploaded Payment Slip</Text>
            <Image
              source={{ uri: payment.payment_slip_url }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <View style={styles.viewFullButton}>
              <Eye size={16} color={BuyerColors.primaryGreen} />
              <Text style={styles.viewFullText}>Tap to view full image</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {payment.slip_verification_status === "REJECTED" && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUploadNewSlip}
            >
              <Text style={styles.primaryButtonText}>Upload New Slip</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() =>
              router.push("/buyer/screens/OrderDetailScreen" as any)
            }
          >
            <Text style={styles.secondaryButtonText}>
              Back to Order Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton}>
            <Phone size={18} color={BuyerColors.primaryGreen} />
            <Text style={styles.secondaryButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Full Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.modalContent}>
              {payment.payment_slip_url && (
                <Image
                  source={{ uri: payment.payment_slip_url }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BuyerColors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
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
    color: BuyerColors.textGray,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    marginBottom: 16,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    textAlign: "center",
    marginBottom: 8,
  },
  statusMessage: {
    fontSize: 14,
    color: BuyerColors.textGray,
    textAlign: "center",
    marginBottom: 12,
  },
  estimatedTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  estimatedTimeText: {
    fontSize: 13,
    color: BuyerColors.textGray,
  },
  rejectionNotes: {
    fontSize: 14,
    color: "#C62828",
    lineHeight: 20,
    padding: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
  },
  imagePreviewContainer: {
    backgroundColor: BuyerColors.cardWhite,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BuyerColors.border,
  },
  imagePreviewLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: BuyerColors.textBlack,
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
  },
  viewFullButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    padding: 8,
  },
  viewFullText: {
    fontSize: 14,
    color: BuyerColors.primaryGreen,
    fontWeight: "600",
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: BuyerColors.primaryGreen,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: BuyerColors.primaryLight,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: BuyerColors.primaryGreen,
    fontSize: 16,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: BuyerColors.primaryGreen,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
