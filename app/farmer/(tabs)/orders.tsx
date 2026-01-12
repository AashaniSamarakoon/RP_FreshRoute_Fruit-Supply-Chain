import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CheckCircle,
  ChevronRight,
  ShieldCheck,
  ShoppingCart,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BACKEND_URL } from "../../../config";

const PRIMARY_GREEN = "#2E7D32";
const LIGHT_GREEN = "#e8f4f0";
const LIGHT_GRAY = "#f5f5f5";
const DANGER_RED = "#d32f2f";

interface Proposal {
  id: string;
  order_id: string;
  stock_id: string;
  quantity_proposed: number;
  status: "PENDING_FARMER" | "ACCEPTED" | "REJECTED";
  expires_at: string;
  created_at: string;
  order: {
    buyer: {
      id: string;
      user: {
        name: string;
        email: string;
      };
    };
    grade: string;
    variant: string;
    quantity: number;
    fruit_type: string;
    required_date: string;
    delivery_location: string;
  };
}

export default function OrdersTab() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingProposals, setProcessingProposals] = useState<Set<string>>(
    new Set()
  );

  const fetchPendingProposals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setError("Authentication failed. Please log in again.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/farmer/proposals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch proposals");
      }

      setProposals(data.proposals || []);
    } catch (err) {
      console.error("Error fetching proposals:", err);
      setError(err instanceof Error ? err.message : "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingProposals();
  }, [fetchPendingProposals]);

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      setProcessingProposals((prev) => new Set(prev).add(proposalId));

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authentication failed. Please log in again.");
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/farmer/proposals/${proposalId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept proposal");
      }

      // Update local state
      setProposals((prev) =>
        prev.map((proposal) =>
          proposal.id === proposalId
            ? { ...proposal, status: "ACCEPTED" }
            : proposal
        )
      );

      Alert.alert("Success", "Proposal accepted successfully!");
    } catch (err) {
      console.error("Error accepting proposal:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to accept proposal"
      );
    } finally {
      setProcessingProposals((prev) => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    try {
      setProcessingProposals((prev) => new Set(prev).add(proposalId));

      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Error", "Authentication failed. Please log in again.");
        return;
      }

      const response = await fetch(
        `${BACKEND_URL}/api/farmer/proposals/${proposalId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reject proposal");
      }

      // Remove from local state (rejected proposals are no longer pending)
      setProposals((prev) =>
        prev.filter((proposal) => proposal.id !== proposalId)
      );

      Alert.alert(
        "Success",
        "Proposal rejected. Buyer can select another farmer."
      );
    } catch (err) {
      console.error("Error rejecting proposal:", err);
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to reject proposal"
      );
    } finally {
      setProcessingProposals((prev) => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
    }
  };

  const handleViewProfile = (order: Proposal) => {
    // Navigate to the dynamic trust profile route with buyer data
    router.push({
      pathname: "/farmer/screens/buyer-trust-profile/[id]",
      params: {
        id: order.order.buyer.id,
        buyerName: order.order.buyer.user.name,
        buyerLocation:
          order.order.delivery_location || "Location not specified",
        trustScore: "Not rated", // Trust score not available in proposal data
      },
    });
  };

  const pendingProposals = proposals.filter(
    (proposal) => proposal.status === "PENDING_FARMER"
  );
  const acceptedProposals = proposals.filter(
    (proposal) => proposal.status === "ACCEPTED"
  );

  const OrderCard = ({ order }: { order: Proposal }) => (
    <View style={styles.orderCard}>
      {/* Header Section - Clickable Profile Button */}
      <TouchableOpacity
        style={styles.cardHeader}
        activeOpacity={0.7}
        onPress={() => handleViewProfile(order)}
      >
        <View style={styles.buyerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.buyerName}>{order.order.buyer.user.name}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={10} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Text style={styles.orderId}>Proposal #{order.id.slice(-6)}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <ChevronRight size={16} color={PRIMARY_GREEN} />
        </View>
      </TouchableOpacity>

      {/* Product Name */}
      <View style={styles.productRow}>
        <Text style={styles.productName}>
          {order.order.fruit_type} - Grade {order.order.grade} (
          {order.order.variant})
        </Text>
      </View>

      {/* Order Details */}
      <View style={styles.orderDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Quantity</Text>
          <Text style={styles.detailValue}>{order.quantity_proposed} kg</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Delivery</Text>
          <Text style={styles.detailValue}>
            {new Date(order.order.required_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>

      {order.status === "PENDING_FARMER" && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAcceptProposal(order.id)}
            disabled={processingProposals.has(order.id)}
          >
            {processingProposals.has(order.id) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <CheckCircle size={16} color="#fff" />
                <Text style={styles.buttonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleRejectProposal(order.id)}
            disabled={processingProposals.has(order.id)}
          >
            {processingProposals.has(order.id) ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <XCircle size={16} color="#fff" />
                <Text style={styles.buttonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {order.status === "ACCEPTED" && (
        <View style={styles.acceptedBadge}>
          <CheckCircle size={18} color={PRIMARY_GREEN} />
          <Text style={styles.acceptedText}>Proposal Accepted</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_GREEN} />
            <Text style={styles.loadingText}>Loading proposals...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchPendingProposals}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {pendingProposals.length > 0 && (
              <View>
                <Text style={styles.sectionTitle}>
                  Pending Proposals ({pendingProposals.length})
                </Text>
                <FlatList
                  data={pendingProposals}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => <OrderCard order={item} />}
                />
              </View>
            )}

            {acceptedProposals.length > 0 && (
              <View style={styles.acceptedSection}>
                <Text style={styles.sectionTitle}>
                  Accepted Proposals ({acceptedProposals.length})
                </Text>
                <FlatList
                  data={acceptedProposals}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => <OrderCard order={item} />}
                />
              </View>
            )}

            {proposals.length === 0 && (
              <View style={styles.emptyState}>
                <ShoppingCart size={48} color={LIGHT_GRAY} />
                <Text style={styles.emptyText}>No proposals yet</Text>
                <Text style={styles.emptySubText}>
                  Proposals from buyers will appear here
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 12,
  },
  acceptedSection: {
    marginTop: 20,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },

  // Header Section
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },

  buyerInfo: {
    flex: 1,
    marginRight: 8,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },

  buyerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    gap: 3,
  },

  verifiedText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "600",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 5,
  },

  orderId: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  headerRight: {
    alignItems: "flex-end",
    gap: 6,
  },

  dateBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },

  dateText: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY_GREEN,
  },

  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
  },

  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },

  detailItem: {
    flex: 1,
    alignItems: "center",
  },

  detailLabel: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 3,
    textTransform: "uppercase",
  },

  detailValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },

  detailDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
  },

  amountText: {
    color: PRIMARY_GREEN,
    fontSize: 14,
  },

  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    shadowColor: PRIMARY_GREEN,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButton: {
    backgroundColor: PRIMARY_GREEN,
  },
  rejectButton: {
    backgroundColor: DANGER_RED,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  acceptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    backgroundColor: "#d1fae5",
    borderRadius: 20,
    gap: 6,
  },
  acceptedText: {
    color: "#065f46",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: PRIMARY_GREEN,
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: DANGER_RED,
    textAlign: "center",
    marginBottom: 20,
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
});
