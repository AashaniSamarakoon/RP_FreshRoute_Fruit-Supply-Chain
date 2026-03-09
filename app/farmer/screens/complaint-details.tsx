import { getComplaintDetails } from "@/services/farmerApi";
import { Complaint } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIMARY_GREEN = "#2f855a";

const ComplaintDetails = () => {
  const { id } = useLocalSearchParams();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("Complaint details page - ID from params:", id);
    if (id && !hasFetched) {
      setHasFetched(true);
      fetchComplaintDetails(id as string);
    } else if (!id) {
      console.log("No ID parameter found");
      setError("No complaint ID provided");
      setLoading(false);
    }
  }, [id, hasFetched]);

  const fetchComplaintDetails = async (complaintId: string) => {
    const startTime = Date.now();
    console.log(`Starting complaint details fetch for ID: ${complaintId} at ${new Date().toISOString()}`);

    // Set a timeout for the API call
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
    });

    try {
      setLoading(true);
      setError(null);

      const apiPromise = getComplaintDetails(complaintId);
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;

      const fetchTime = Date.now() - startTime;
      console.log(`API call completed in ${fetchTime}ms`);
      console.log("Complaint details API response:", response);

      // Try different possible response formats
      const complaintData = response || response?.data || response?.complaint || response?.data?.complaint || response?.data?.data;
      console.log("Parsed complaint data:", complaintData);

      if (complaintData && typeof complaintData === 'object' && complaintData.id) {
        setComplaint(complaintData);
        console.log(`Total successful load time: ${Date.now() - startTime}ms`);
      } else {
        console.error("Invalid or empty complaint data received");
        setError("No complaint data found");
      }
    } catch (err: any) {
      const errorTime = Date.now() - startTime;
      console.error(`Request failed after ${errorTime}ms:`, err);

      if (err?.message === 'Request timeout') {
        setError("Request timed out. Please check your connection.");
      } else {
        setError("Failed to load complaint details");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "#10b981";
      case "in_review":
        return "#f59e0b";
      case "admin_reviewed":
        return "#3b82f6";
      case "pending":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "Resolved";
      case "in_review":
        return "In Review";
      case "admin_reviewed":
        return "Admin Reviewed";
      case "pending":
        return "Pending";
      default:
        return status || "Unknown";
    }
  };

  const DetailRow = ({ label, value, icon }: { label: string; value: string; icon?: string }) => (
    <View style={styles.detailRow}>
      {icon && <Ionicons name={icon as any} size={20} color={PRIMARY_GREEN} style={styles.detailIcon} />}
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Loading complaint details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !complaint) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || "Complaint not found"}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Standard Header matching other pages */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaint Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="information-circle" size={24} color={PRIMARY_GREEN} />
            <Text style={styles.statusCardTitle}>Complaint Status</Text>
          </View>
          <View style={styles.statusBadgeContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(complaint.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusText(complaint.status)}</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.detailsContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={PRIMARY_GREEN} />
            <Text style={styles.sectionTitle}>Complaint Information</Text>
          </View>

          <DetailRow label="Complaint ID" value={complaint.id} icon="key" />
          <DetailRow label="Order ID" value={complaint.order_id} icon="receipt" />
          <DetailRow label="User Name" value={complaint.user_name} icon="person" />
          <DetailRow
            label="Created At"
            value={new Date(complaint.created_at).toLocaleString()}
            icon="calendar"
          />
          <DetailRow label="Farmer ID" value={complaint.farmer_id} icon="storefront" />
        </View>

        {/* Complaint Text Card */}
        <View style={styles.complaintContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-ellipses" size={20} color={PRIMARY_GREEN} />
            <Text style={styles.sectionTitle}>User Complaint</Text>
          </View>
          <View style={styles.complaintTextContainer}>
            <Text style={styles.complaintText}>{complaint.user_complaint}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PRIMARY_GREEN,
  },
  headerRight: {
    width: 32, // To balance the back button
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  detailsContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e6f7f0",
  },
  statusCard: {
    backgroundColor: "#fff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#e6f7f0",
  },
  complaintContainer: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e6f7f0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f9f4",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  statusBadgeContainer: {
    alignItems: "flex-start",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-start",
  },
  detailIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
  },
  statusText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  complaintTextContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6f7f0",
  },
  complaintText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    fontWeight: "400",
  },
});

export default ComplaintDetails;