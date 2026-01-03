// // app/transporter/index.tsx
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   FlatList,
//   RefreshControl,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { BACKEND_URL } from "../../config";

// // Types
// interface Job {
//   id: string;
//   route_name: string;
//   job_date: string;
//   total_weight_kg: number;
//   status: string;
//   vehicle_type_assigned: string;
// }

// export default function TransporterDashboard() {
//   const router = useRouter();
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [vehicleInfo, setVehicleInfo] = useState<any>(null);

//   const fetchJobs = async () => {
//     try {
//       const token = await AsyncStorage.getItem("token");
//       if (!token) return;

//       const res = await fetch(`${BACKEND_URL}/api/transporter/jobs`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const data = await res.json();

//       if (res.ok) {
//         setJobs(data.jobs || []);
//         setVehicleInfo(data.vehicle);
//       }
//     } catch (error) {
//       console.error("Failed to load jobs", error);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     fetchJobs();
//   }, []);

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchJobs();
//   };

//   const renderJobCard = ({ item }: { item: Job }) => (
//     <TouchableOpacity
//       style={styles.card}
//       onPress={() => router.push(`/transporter/job/${item.id}`)}
//     >
//       <View style={styles.cardHeader}>
//         <Text style={styles.routeTitle}>{item.route_name}</Text>
//         <View
//           style={[
//             styles.badge,
//             item.status === "SCHEDULED" ? styles.badgeBlue : styles.badgeGreen,
//           ]}
//         >
//           <Text style={styles.badgeText}>{item.status}</Text>
//         </View>
//       </View>

//       <View style={styles.row}>
//         <Ionicons name="calendar-outline" size={16} color="#666" />
//         <Text style={styles.infoText}>
//           {new Date(item.job_date).toDateString()}
//         </Text>
//       </View>

//       <View style={styles.row}>
//         <Ionicons name="cube-outline" size={16} color="#666" />
//         <Text style={styles.infoText}>Load: {item.total_weight_kg} kg</Text>
//       </View>

//       <View style={styles.footer}>
//         <Text style={styles.clickHint}>Tap to view details & route</Text>
//         <Ionicons name="chevron-forward" size={16} color="#999" />
//       </View>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.welcomeText}>My Jobs</Text>
//         {vehicleInfo && (
//           <Text style={styles.subHeader}>
//             Vehicle: {vehicleInfo.vehicle_license_plate}
//           </Text>
//         )}
//       </View>

//       {loading ? (
//         <ActivityIndicator
//           size="large"
//           color="#2f855a"
//           style={{ marginTop: 50 }}
//         />
//       ) : (
//         <FlatList
//           data={jobs}
//           keyExtractor={(item) => item.id}
//           renderItem={renderJobCard}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//           ListEmptyComponent={
//             <Text style={styles.emptyText}>No active jobs assigned.</Text>
//           }
//           contentContainerStyle={{ paddingBottom: 20 }}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#f5f7fa", padding: 16 },
//   header: { marginBottom: 20, marginTop: 40 },
//   welcomeText: { fontSize: 28, fontWeight: "bold", color: "#2d3748" },
//   subHeader: { fontSize: 14, color: "#718096", marginTop: 4 },

//   card: {
//     backgroundColor: "#fff",
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     shadowColor: "#000",
//     shadowOpacity: 0.05,
//     shadowRadius: 5,
//     elevation: 3,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 12,
//   },
//   routeTitle: { fontSize: 18, fontWeight: "bold", color: "#2d3748" },

//   badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
//   badgeBlue: { backgroundColor: "#bee3f8" },
//   badgeGreen: { backgroundColor: "#c6f6d5" },
//   badgeText: { fontSize: 12, fontWeight: "bold", color: "#2c5282" },

//   row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
//   infoText: { marginLeft: 8, color: "#4a5568", fontSize: 14 },

//   footer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginTop: 12,
//     paddingTop: 12,
//     borderTopWidth: 1,
//     borderTopColor: "#edf2f7",
//   },
//   clickHint: { fontSize: 12, color: "#a0aec0" },
//   emptyText: { textAlign: "center", marginTop: 50, color: "#a0aec0" },
// });

// app/transporter/index.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BACKEND_URL } from "../../config";

// Types
interface Job {
  id: string;
  route_name: string;
  job_date: string;
  total_weight_kg: number;
  status: string;
  vehicle_type_assigned: string;
}

// New Alert Type
interface AlertItem {
  id: string;
  alert_type: string;
  message: string;
  created_at: string;
  value_at_time: number;
}

export default function TransporterDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]); // State for alerts
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${BACKEND_URL}/api/transporter/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setJobs(data.jobs || []);
        setAlerts(data.alerts || []); // Set alerts from backend
        setVehicleInfo(data.vehicle);
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderAlertItem = ({ item }: { item: AlertItem }) => (
    <View style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Ionicons name="warning" size={20} color="#c53030" />
        <Text style={styles.alertTitle}>
          {item.alert_type.replace("_", " ")}
        </Text>
      </View>
      <Text style={styles.alertMessage}>{item.message}</Text>
      <Text style={styles.alertTime}>
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderJobCard = ({ item }: { item: Job }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/transporter/job/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.routeTitle}>{item.route_name}</Text>
        <View
          style={[
            styles.badge,
            item.status === "SCHEDULED" ? styles.badgeBlue : styles.badgeGreen,
          ]}
        >
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          {new Date(item.job_date).toDateString()}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="cube-outline" size={16} color="#666" />
        <Text style={styles.infoText}>Load: {item.total_weight_kg} kg</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.clickHint}>Tap to view details & route</Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );

  // Combine content for the main FlatList to allow scrolling everything together
  const ListHeader = () => (
    <View>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>My Jobs</Text>
        {vehicleInfo && (
          <Text style={styles.subHeader}>
            Vehicle: {vehicleInfo.vehicle_license_plate}
          </Text>
        )}
      </View>

      {/* ALERT SECTION */}
      {alerts.length > 0 && (
        <View style={styles.alertSection}>
          <Text style={styles.sectionTitle}>⚠️ Active Alerts</Text>
          {alerts.map((alert) => (
            <View key={alert.id} style={{ marginBottom: 10 }}>
              {renderAlertItem({ item: alert })}
            </View>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2f855a"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJobCard}
          ListHeaderComponent={ListHeader} // Added header component
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No active jobs assigned.</Text>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7fa", padding: 16 },
  header: { marginBottom: 20, marginTop: 40 },
  welcomeText: { fontSize: 28, fontWeight: "bold", color: "#2d3748" },
  subHeader: { fontSize: 14, color: "#718096", marginTop: 4 },

  // Alert Styles
  alertSection: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#c53030",
  },
  alertCard: {
    backgroundColor: "#fff5f5",
    borderLeftWidth: 4,
    borderLeftColor: "#c53030",
    padding: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    elevation: 2,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  alertTitle: {
    fontWeight: "bold",
    color: "#c53030",
    marginLeft: 6,
    textTransform: "uppercase",
    fontSize: 12,
  },
  alertMessage: { color: "#2d3748", fontSize: 14, marginBottom: 4 },
  alertTime: { color: "#718096", fontSize: 11, textAlign: "right" },

  // Job Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  routeTitle: { fontSize: 18, fontWeight: "bold", color: "#2d3748" },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeBlue: { backgroundColor: "#bee3f8" },
  badgeGreen: { backgroundColor: "#c6f6d5" },
  badgeText: { fontSize: 12, fontWeight: "bold", color: "#2c5282" },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  infoText: { marginLeft: 8, color: "#4a5568", fontSize: 14 },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#edf2f7",
  },
  clickHint: { fontSize: 12, color: "#a0aec0" },
  emptyText: { textAlign: "center", marginTop: 50, color: "#a0aec0" },
});
