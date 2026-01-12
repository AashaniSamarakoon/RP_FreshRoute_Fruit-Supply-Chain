import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { BACKEND_URL } from "../../config";

interface Complaint {
  id: string;
  orderId: string;
  reason: string;
  description: string;
  date: string;
  status: string;
  images?: string[];
  verifiedResults?: Array<{ imageUri: string; detectedGrade?: string }>;
}

export default function MyComplaints() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userJson = await AsyncStorage.getItem("user");
        if (!userJson) {
          router.replace("/login");
          return;
        }
        const user = JSON.parse(userJson);
        if (user.role !== "buyer") {
          router.replace("/buyer");
          return;
        }
        setIsAuthenticated(true);
      } catch (e) {
        router.replace("/login");
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadComplaints = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) return;

        // For now, use mock data. Replace with actual API call
        const mockComplaints: Complaint[] = [
          {
            id: "1",
            orderId: "ORD-001",
            reason: "Damaged goods",
            description: "Received damaged fruits",
            date: new Date().toISOString(),
            status: "Under Review",
            images: [],
            verifiedResults: [],
          },
        ];

        setComplaints(mockComplaints);
      } catch (error) {
        console.error("Error loading complaints:", error);
      }
    };

    loadComplaints();
  }, [isAuthenticated]);

  const handleComplaintPress = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleChatAgent = (complaintId: string) => {
    router.push({
      pathname: "/buyer/chat",
      params: { complaintId },
    });
  };

  if (checkingAuth || !isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Complaints</Text>

      <ScrollView style={styles.listContainer}>
        {complaints.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No complaints yet</Text>
          </View>
        ) : (
          complaints.map((complaint) => (
            <View key={complaint.id} style={styles.complaintCard}>
              <TouchableOpacity
                onPress={() => handleComplaintPress(complaint)}
                style={styles.complaintContent}
              >
                <View style={styles.complaintHeader}>
                  <Text style={styles.complaintOrderId}>
                    Order: {complaint.orderId}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      complaint.status === "Resolved"
                        ? styles.statusResolved
                        : styles.statusPending,
                    ]}
                  >
                    <Text style={styles.statusText}>{complaint.status}</Text>
                  </View>
                </View>
                <Text style={styles.complaintReason}>{complaint.reason}</Text>
                <Text style={styles.complaintDate}>
                  {new Date(complaint.date).toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => handleChatAgent(complaint.id)}
              >
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Chat Agent</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailsModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={28} color="#11181C" />
              </TouchableOpacity>
            </View>

            {selectedComplaint && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedComplaint.orderId}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>
                    {selectedComplaint.reason}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>
                    {selectedComplaint.description}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedComplaint.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={styles.detailValue}>
                    {selectedComplaint.status}
                  </Text>
                </View>

                {selectedComplaint.verifiedResults &&
                  selectedComplaint.verifiedResults.length > 0 && (
                    <View style={styles.imagesSection}>
                      <Text style={styles.imagesTitle}>Verified Images</Text>
                      <View style={styles.imagesGrid}>
                        {selectedComplaint.verifiedResults.map((result, idx) => (
                          <View key={idx} style={styles.imageCard}>
                            <Image
                              source={{ uri: result.imageUri }}
                              style={styles.resultImage}
                            />
                            {result.detectedGrade && (
                              <Text style={styles.gradeText}>
                                {result.detectedGrade}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalChatButton}
              onPress={() => {
                if (selectedComplaint) {
                  setShowDetailsModal(false);
                  handleChatAgent(selectedComplaint.id);
                }
              }}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={styles.modalChatButtonText}>Chat Agent</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 24,
    paddingBottom: 16,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
  },
  complaintCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  complaintContent: {
    marginBottom: 12,
  },
  complaintHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  complaintOrderId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#11181C",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: "#fff3cd",
  },
  statusResolved: {
    backgroundColor: "#d4edda",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#856404",
  },
  complaintReason: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  complaintDate: {
    fontSize: 12,
    color: "#999",
  },
  chatButton: {
    backgroundColor: "#2f855a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  chatButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#11181C",
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#11181C",
    fontWeight: "600",
  },
  imagesSection: {
    marginTop: 20,
  },
  imagesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#11181C",
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageCard: {
    width: "48%",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  resultImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2f855a",
  },
  modalChatButton: {
    backgroundColor: "#2f855a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    gap: 8,
  },
  modalChatButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

