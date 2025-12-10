// app/transporter/job/[jobId].tsx

import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Job, MOCK_JOBS, Order, OrderStatus } from "../../../data/mockJobs";

const ACCENT = "#16a34a";

export default function JobDetails() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const id = Array.isArray(jobId) ? jobId[0] : jobId;

  const initialJob = useMemo(() => MOCK_JOBS.find((j) => j.id === id), [id]);

  const [job, setJob] = useState<Job | null>(
    initialJob ? JSON.parse(JSON.stringify(initialJob)) : null
  );

  if (!job) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Job not found</Text>
      </View>
    );
  }

  const orderedOrders = [...job.orders].sort(
    (a, b) => a.pickupOrder - b.pickupOrder
  );

  const updateJobStatusFromOrders = (orders: Order[]): Job["status"] => {
    if (orders.every((o) => o.status === "delivered")) return "completed";
    if (
      orders.some((o) => o.status === "picked_up" || o.status === "delivered")
    )
      return "in_progress";
    return "pending";
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setJob((prev) => {
      if (!prev) return prev;
      const orders = prev.orders.map((o) =>
        o.id === orderId ? { ...o, status } : o
      );
      const newStatus = updateJobStatusFromOrders(orders);
      return { ...prev, orders, status: newStatus };
    });
  };

  const handleMarkPickedUp = (order: Order) => {
    if (order.status === "delivered") return;
    if (order.status === "picked_up") {
      Alert.alert(
        "Already picked up",
        "This order is already marked as picked up."
      );
      return;
    }
    updateOrderStatus(order.id, "picked_up");
  };

  const handleMarkDelivered = (order: Order) => {
    if (order.status === "pending") {
      Alert.alert(
        "Pickup required",
        "Please mark this order as picked up before marking delivered."
      );
      return;
    }
    if (order.status === "delivered") {
      Alert.alert(
        "Already delivered",
        "This order is already marked as delivered."
      );
      return;
    }
    updateOrderStatus(order.id, "delivered");
  };

  const handleMarkCompleted = () => {
    if (!job.orders.every((o) => o.status === "delivered")) {
      Alert.alert(
        "Cannot complete job",
        "All orders must be delivered before marking the job as completed."
      );
      return;
    }
    setJob((prev) => (prev ? { ...prev, status: "completed" } : prev));
    Alert.alert("Job completed", "This job has been marked as completed.");
  };

  const nextStop = orderedOrders.find((o) => o.status !== "delivered");

  const goToNavigation = () => {
    router.push({
      pathname: "/transporter/job/[jobId]/navigation",
      params: { jobId: job.id },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Job Details</Text>
        <Text style={styles.jobId}>{job.id}</Text>

        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {new Date(job.date).toDateString()}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.label}>Buyer</Text>
            <Text style={styles.value}>{job.buyer.name}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.label}>Delivery address</Text>
            <Text style={styles.value}>
              {job.buyer.address.line1}, {job.buyer.address.city}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.label}>Driver</Text>
            <Text style={styles.value}>
              {job.driverName} • {job.vehiclePlate}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Job status</Text>
            <View
              style={[
                styles.statusBadge,
                styles[`status_${job.status}` as const],
              ]}
            >
              <Text style={styles.statusText}>
                {job.status.replace("_", " ")}
              </Text>
            </View>
          </View>
          {nextStop && (
            <View style={styles.nextStop}>
              <Text style={styles.nextStopLabel}>Next stop</Text>
              <Text style={styles.nextStopValue}>
                Pickup {nextStop.pickupOrder} - {nextStop.farmer.name}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.navButton} onPress={goToNavigation}>
          <Text style={styles.navButtonText}>See navigation & route</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Pickups</Text>

        {orderedOrders.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
              <View>
                <Text style={styles.orderTitle}>
                  Pickup {order.pickupOrder} • {order.fruitType}
                </Text>
                <Text style={styles.orderSubtitle}>Order ID: {order.id}</Text>
              </View>
              <View
                style={[
                  styles.orderStatusBadge,
                  order.status === "pending" && styles.orderStatusPending,
                  order.status === "picked_up" && styles.orderStatusPicked,
                  order.status === "delivered" && styles.orderStatusDelivered,
                ]}
              >
                <Text style={styles.orderStatusText}>{order.status}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Farmer</Text>
              <Text style={styles.value}>{order.farmer.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Farmer address</Text>
              <Text style={styles.value}>
                {order.farmer.address.line1}, {order.farmer.address.city}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Quantity</Text>
              <Text style={styles.value}>{order.quantityKg} kg</Text>
            </View>

            <View style={styles.orderActionsRow}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleMarkPickedUp(order)}
              >
                <Text style={styles.secondaryButtonText}>Mark picked up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => handleMarkDelivered(order)}
              >
                <Text style={styles.primaryButtonText}>Mark delivered</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.completeButton,
          !job.orders.every((o) => o.status === "delivered") &&
            styles.completeButtonDisabled,
        ]}
        onPress={handleMarkCompleted}
        disabled={!job.orders.every((o) => o.status === "delivered")}
      >
        <Text style={styles.completeButtonText}>Mark job as completed</Text>
      </TouchableOpacity>
    </View>
  );
}

const CARD_BG = "#f9fafb";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  jobId: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  headerCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
    maxWidth: "60%",
    textAlign: "right",
  },
  statusRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  status_pending: {
    backgroundColor: "#fef3c7",
  },
  status_in_progress: {
    backgroundColor: "#dcfce7",
  },
  status_completed: {
    backgroundColor: "#bbf7d0",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
    textTransform: "capitalize",
  },
  nextStop: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  nextStopLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  nextStopValue: {
    fontSize: 13,
    fontWeight: "600",
    color: ACCENT,
    marginTop: 2,
  },
  navButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: ACCENT,
    alignItems: "center",
  },
  navButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  orderCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  orderSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  orderStatusPending: {
    backgroundColor: "#fef3c7",
  },
  orderStatusPicked: {
    backgroundColor: "#dbeafe",
  },
  orderStatusDelivered: {
    backgroundColor: "#dcfce7",
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
  },
  orderActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  primaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: ACCENT,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: ACCENT,
  },
  completeButton: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: ACCENT,
  },
  completeButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  completeButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
