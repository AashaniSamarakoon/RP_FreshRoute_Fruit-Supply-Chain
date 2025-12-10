// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
// import { BACKEND_URL } from "../../config";

// interface TransporterDashboardData {
//   message?: string;
//   todayJobs?: unknown[];
//   vehicleStatus?: {
//     latitude: number;
//     longitude: number;
//     timestamp: string;
//   };
// }

// export default function TransporterDashboard() {
//   const router = useRouter();
//   const [data, setData] = useState<TransporterDashboardData | null>(null);

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         if (!token) return;

//         // Fetch transporter dashboard data (jobs, vehicle status, etc.)
//         const res = await fetch(`${BACKEND_URL}/api/transporter/dashboard`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const body = await res.json();
//         if (!res.ok) {
//           return Alert.alert(
//             "Error",
//             body.message || "Failed to load dashboard"
//           );
//         }
//         setData(body);
//       } catch (err) {
//         console.error(err);
//         Alert.alert("Error", "Could not load dashboard");
//       }
//     };
//     load();
//   }, []);

//   const logout = async () => {
//     await AsyncStorage.multiRemove(["token", "user"]);
//     router.replace("/login");
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Transporter Dashboard</Text>
//       <Text style={styles.subtitle}>{data?.message}</Text>

//       <Text style={{ marginTop: 16 }}>
//         Today's jobs: {data?.todayJobs?.length ?? 0}
//       </Text>

//       {data?.todayJobs && data.todayJobs.length > 0 ? (
//         data.todayJobs.map((job: any, index: number) => (
//           <View key={index} style={styles.jobItem}>
//             <Text>Job ID: {job.id}</Text>
//             <Text>Pickup Location: {job.pickup_location}</Text>
//             <Text>Status: {job.status}</Text>
//           </View>
//         ))
//       ) : (
//         <Text>No jobs for today</Text>
//       )}

//       {data?.vehicleStatus && (
//         <View style={styles.vehicleStatus}>
//           <Text style={styles.statusText}>Vehicle Status:</Text>
//           <Text>Latitude: {data.vehicleStatus.latitude}</Text>
//           <Text>Longitude: {data.vehicleStatus.longitude}</Text>
//           <Text>Last Updated: {data.vehicleStatus.timestamp}</Text>
//         </View>
//       )}

//       <TouchableOpacity style={styles.logoutButton} onPress={logout}>
//         <Text style={styles.logoutText}>Logout</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 24, backgroundColor: "#fff" },
//   title: { fontSize: 24, fontWeight: "bold" },
//   subtitle: { marginTop: 8, fontSize: 16 },
//   vehicleStatus: { marginTop: 20 },
//   statusText: { fontWeight: "bold" },
//   logoutButton: {
//     marginTop: 24,
//     borderWidth: 1,
//     borderColor: "#e53e3e",
//     padding: 10,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   logoutText: { color: "#e53e3e", fontWeight: "bold" },
//   jobItem: { marginTop: 16, padding: 12, borderWidth: 1, borderRadius: 8 },
// });

// app/transporter/index.tsx
// import { router } from "expo-router";
// import React, { useState } from "react";
// import {
//   Button,
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// type LatLng = { latitude: number; longitude: number };

// type Stop = {
//   id: string;
//   type: "pickup" | "drop";
//   address: string;
//   coords: LatLng;
//   assigned?: boolean;
//   collected?: boolean;
// };

// type TransportJob = {
//   id: string;
//   title: string;
//   stops: Stop[]; // pickups first, then drop
//   status: "idle" | "en_route" | "completed";
// };

// const mockJobs: TransportJob[] = [
//   {
//     id: "job-1",
//     title: "Order #1001 - Fruits",
//     status: "idle",
//     stops: [
//       {
//         id: "p1",
//         type: "pickup",
//         address: "Farm A",
//         coords: { latitude: 6.9271, longitude: 79.8612 },
//       },
//       {
//         id: "p2",
//         type: "pickup",
//         address: "Collection B",
//         coords: { latitude: 6.934, longitude: 79.8625 },
//       },
//       {
//         id: "drop",
//         type: "drop",
//         address: "Marketplace",
//         coords: { latitude: 6.9415, longitude: 79.873 },
//       },
//     ],
//   },
//   {
//     id: "job-2",
//     title: "Order #1002 - Vegetables",
//     status: "idle",
//     stops: [
//       {
//         id: "p1",
//         type: "pickup",
//         address: "Farm C",
//         coords: { latitude: 6.93, longitude: 79.855 },
//       },
//       {
//         id: "drop",
//         type: "drop",
//         address: "Store X",
//         coords: { latitude: 6.94, longitude: 79.87 },
//       },
//     ],
//   },
// ];

// export default function TransporterDashboard() {
//   const [jobs, setJobs] = useState<TransportJob[]>(mockJobs);

//   const assignJob = (jobId: string) => {
//     setJobs((prev) =>
//       prev.map((j) =>
//         j.id === jobId
//           ? {
//               ...j,
//               status: "en_route",
//               stops: j.stops.map((s) => ({ ...s, assigned: true })),
//             }
//           : j
//       )
//     );
//   };

//   const markCollected = (jobId: string, stopId: string) => {
//     setJobs((prev) =>
//       prev.map((j) =>
//         j.id === jobId
//           ? {
//               ...j,
//               stops: j.stops.map((s) =>
//                 s.id === stopId ? { ...s, collected: true } : s
//               ),
//             }
//           : j
//       )
//     );
//   };

//   const markDelivered = (jobId: string) => {
//     setJobs((prev) =>
//       prev.map((j) => (j.id === jobId ? { ...j, status: "completed" } : j))
//     );
//   };

//   const openRoute = (jobId: string) => {
//     router.push(`/transporter/route?jobId=${jobId}`);
//   };

//   const renderJob = ({ item }: { item: TransportJob }) => (
//     <View style={styles.card}>
//       <Text style={styles.title}>{item.title}</Text>
//       <Text>Status: {item.status}</Text>

//       <FlatList
//         data={item.stops}
//         keyExtractor={(s) => s.id}
//         renderItem={({ item: stop }) => (
//           <View style={styles.stopRow}>
//             <Text>
//               {stop.type.toUpperCase()}: {stop.address}{" "}
//               {stop.collected ? "✅" : ""}
//             </Text>

//             {item.status === "idle" && stop.type === "pickup" && (
//               <TouchableOpacity
//                 style={styles.smallBtn}
//                 onPress={() => markCollected(item.id, stop.id)}
//               >
//                 <Text style={styles.smallBtnText}>Collect</Text>
//               </TouchableOpacity>
//             )}
//             {/* If en_route show collect/deliver */}
//             {item.status === "en_route" &&
//               stop.type === "pickup" &&
//               !stop.collected && (
//                 <TouchableOpacity
//                   style={styles.smallBtn}
//                   onPress={() => markCollected(item.id, stop.id)}
//                 >
//                   <Text style={styles.smallBtnText}>Mark Collected</Text>
//                 </TouchableOpacity>
//               )}
//           </View>
//         )}
//       />

//       <View style={styles.actions}>
//         {item.status === "idle" && (
//           <Button title="Assign & Start" onPress={() => assignJob(item.id)} />
//         )}
//         {item.status === "en_route" && (
//           <Button
//             title="Open Map / Navigate"
//             onPress={() => openRoute(item.id)}
//           />
//         )}
//         {item.status !== "completed" && (
//           <Button
//             title="Mark Delivered"
//             onPress={() => markDelivered(item.id)}
//           />
//         )}
//       </View>
//     </View>
//   );

//   return (
//     <View style={{ flex: 1, padding: 16 }}>
//       <Text style={{ fontSize: 22, marginBottom: 8 }}>
//         Transporter Dashboard
//       </Text>

//       <FlatList data={jobs} keyExtractor={(j) => j.id} renderItem={renderJob} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 12,
//     elevation: 2,
//   },
//   title: { fontSize: 16, fontWeight: "600", marginBottom: 6 },
//   stopRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginVertical: 6,
//   },
//   smallBtn: {
//     backgroundColor: "#0a84ff",
//     paddingHorizontal: 8,
//     paddingVertical: 6,
//     borderRadius: 6,
//   },
//   smallBtnText: { color: "#fff" },
//   actions: {
//     marginTop: 8,
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
// });

// app/transporter/TransporterDashboard.tsx (adjust path as needed)

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MOCK_JOBS } from "../../data/mockJobs";

const ACCENT = "#16a34a"; // green accent

export default function TransporterDashboard() {
  const router = useRouter();

  const logout = async () => {
    await AsyncStorage.multiRemove(["token", "user"]);
    router.replace("/login");
  };

  const handleJobPress = (jobId: string) => {
    router.push({
      pathname: "/transporter/job/[jobId]",
      params: { jobId },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transporter Dashboard</Text>
      <Text style={styles.subtitle}>Collection jobs for today</Text>

      <ScrollView
        style={{ marginTop: 20 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_JOBS.map((job) => {
          const totalPickups = job.orders.length;
          const pickedUp = job.orders.filter(
            (o) => o.status === "picked_up" || o.status === "delivered"
          ).length;
          const orderIds = job.orders.map((o) => o.id).join(", ");

          return (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => handleJobPress(job.id)}
              activeOpacity={0.85}
            >
              <View style={styles.jobHeaderRow}>
                <View>
                  <Text style={styles.jobId}>{job.id}</Text>
                  <Text style={styles.jobDate}>
                    {new Date(job.date).toDateString()}
                  </Text>
                </View>
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

              <View style={styles.row}>
                <Text style={styles.label}>Buyer</Text>
                <Text style={styles.value}>{job.buyer.name}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Orders</Text>
                <Text style={styles.value}>{orderIds}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Pickups</Text>
                <Text style={styles.value}>
                  {pickedUp}/{totalPickups} completed
                </Text>
              </View>

              <View style={styles.jobFooterRow}>
                <Text style={styles.smallText}>
                  Driver: {job.driverName} • {job.vehiclePlate}
                </Text>
                <Text style={styles.linkText}>View details ⟶</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
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
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
  jobCard: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jobHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  jobDate: {
    marginTop: 2,
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
  row: {
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
  jobFooterRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  linkText: {
    fontSize: 13,
    fontWeight: "600",
    color: ACCENT,
  },
  logoutButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    padding: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "600",
  },
});
