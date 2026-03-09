import { getFarmerComplaints } from "@/services/farmerApi";
import { Complaint } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

const ComplaintsList = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await getFarmerComplaints();

      // Try different response formats
      let complaintsData = [];
      if (response?.data?.complaints && Array.isArray(response.data.complaints)) {
        complaintsData = response.data.complaints;
      } else if (response?.complaints && Array.isArray(response.complaints)) {
        complaintsData = response.complaints;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        complaintsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        complaintsData = response.data;
      }

      setComplaints(complaintsData);
    } catch (err) {
      console.error("Error fetching complaints:", err);
      setError("Failed to load complaints");
      setComplaints([]); // Ensure complaints is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleComplaintPress = (complaintId: string) => {
    router.push(`/farmer/screens/complaint-details?id=${complaintId}`);
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "resolved":
        return "Resolved";
      case "in_review":
        return "In Review";
      case "admin_reviewed":
        return "Admin Review";
      case "pending":
        return "Pending";
      default:
        return status || "Unknown";
    }
  };

  const getStatusColor = (status: string | undefined | null) => {
    const statusValue = status?.toString().toLowerCase();
    switch (statusValue) {
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_GREEN} />
          <Text style={styles.loadingText}>Loading complaints...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchComplaints}>
            <Text style={styles.retryButtonText}>Retry</Text>
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
        <Text style={styles.headerTitle}>Complaints</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {(!complaints || complaints.length === 0) ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={80} color={PRIMARY_GREEN} />
            </View>
            <Text style={styles.emptyTitle}>No Complaints Yet</Text>
            <Text style={styles.emptyText}>Your complaints will appear here once submitted</Text>
          </View>
        ) : (
          <View style={styles.complaintsContainer}>
            {/* Stats Card */}
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{complaints.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {complaints.filter(c => c.status === 'resolved').length}
                </Text>
                <Text style={styles.statLabel}>Resolved</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {complaints.filter(c => c.status === 'in_review').length}
                </Text>
                <Text style={styles.statLabel}>In Review</Text>
              </View>
            </View>

            {/* Complaints List */}
            {complaints.map((complaint, index) => (
              <TouchableOpacity
                key={complaint.id}
                style={[styles.complaintCard, index === 0 && styles.firstCard]}
                onPress={() => handleComplaintPress(complaint.id)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(complaint.user_name || "U")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.userName}>{complaint.user_name || "Unknown User"}</Text>
                      <Text style={styles.complaintDate}>
                        {new Date(complaint.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(complaint.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>{getStatusText(complaint.status)}</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.complaintPreview} numberOfLines={2}>
                    {complaint.user_complaint}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.orderInfo}>
                    <Ionicons name="document-text-outline" size={16} color="#6b7280" />
                    <Text style={styles.orderId}>Order #{complaint.order_id.slice(-8)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: 32,
    padding: 24,
    backgroundColor: "#f0f9f4",
    borderRadius: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  complaintsContainer: {
    padding: 20,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: "#e6f7f0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 15,
  },
  complaintCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
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
  firstCard: {
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    minHeight: 50, // Ensure minimum height for status badge
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8, // Add margin to prevent overlap
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY_GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  complaintDate: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    maxWidth: 100, // Limit width to prevent overflow
    alignSelf: 'flex-start', // Align to top
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardContent: {
    marginBottom: 16,
  },
  complaintPreview: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  orderId: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginLeft: 4,
  },
});

export default ComplaintsList;