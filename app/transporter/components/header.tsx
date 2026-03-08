// // components/Header.tsx
// import api from "@/services/api";
// import { Ionicons } from "@expo/vector-icons";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useRouter } from "expo-router";
// import React, { useEffect, useState } from "react";
// import {
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";
// // Assuming you have this context, otherwise you can remove the hook and hardcode text
// import { useTranslationContext } from "../../../context/TranslationContext";

// const PRIMARY_GREEN = "#2f855a";
// const LIGHT_GRAY = "#f5f5f5";

// interface HeaderProps {
//   onSearch?: (text: string) => void;
// }

// export default function Header({ onSearch }: HeaderProps) {
//   const router = useRouter();
//   // If you don't have translation context set up for transporter yet,
//   // you can remove t/locale logic and just use English strings.
//   const { t, locale, setLocale } = useTranslationContext();

//   const [unreadCount, setUnreadCount] = useState(0);
//   const [userName, setUserName] = useState("Transporter");

//   useEffect(() => {
//     const loadData = async () => {
//       try {
//         const token = await AsyncStorage.getItem("token");
//         const userStr = await AsyncStorage.getItem("user");

//         // 1. Get Name from Local Storage
//         if (userStr) {
//           const user = JSON.parse(userStr);
//           // Extracting from user_metadata based on your specific log
//           const firstName = user.user_metadata?.first_name;
//           const lastName = user.user_metadata?.last_name;

//           if (firstName) {
//             setUserName(`${firstName} ${lastName || ""}`.trim());
//           } else {
//             setUserName("Transporter");
//           }
//         }

//         if (!token) return;

//         // 2. Get Notifications (Switched to transporter endpoint)
//         try {
//           const data = await api.get(`/api/transporter/notifications`);
//           setUnreadCount(data.unreadCount || 0);
//         } catch (_e) {
//           // ignore
//         }
//       } catch (err) {
//         console.error("[Header] Failed to load header data", err);
//       }
//     };

//     loadData();
//     const interval = setInterval(loadData, 30000); // Refresh every 30s
//     return () => clearInterval(interval);
//   }, []);

//   return (
//     <>
//       {/* Fixed Header */}
//       <View style={styles.header}>
//         <View>
//           <Text style={styles.logo}>🍃 FreshRoute</Text>
//           <Text style={styles.greeting}>
//             {/* Fallback to English if translation key missing */}
//             {t
//               ? t("farmer.greeting", { name: userName })
//               : `Hello, ${userName}`}
//           </Text>
//         </View>
//         <View style={styles.headerIcons}>
//           <TouchableOpacity
//             onPress={() => router.push("/transporter/notifications" as any)} // Adjust route as needed
//             style={styles.notificationButton}
//           >
//             <Ionicons name="notifications-outline" size={24} color="#000" />
//             {unreadCount > 0 && (
//               <View style={styles.badge}>
//                 <View style={styles.badgeDot} />
//               </View>
//             )}
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.langToggle, { marginLeft: 12 }]}
//             onPress={() => {
//               const nextLocale = locale === "en" ? "si" : "en";
//               setLocale(nextLocale);
//             }}
//           >
//             <Text style={styles.langToggleText}>
//               {locale === "en" ? "සි" : "EN"}
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Search Bar */}
//       <View style={styles.searchContainer}>
//         <Ionicons name="search" size={18} color="#999" />
//         <TextInput
//           style={styles.searchInput}
//           placeholder="Search jobs..."
//           placeholderTextColor="#999"
//           onChangeText={onSearch}
//         />
//       </View>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   header: {
//     paddingHorizontal: 16,
//     paddingTop: 50, // Safe area padding
//     paddingBottom: 20,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#fff",
//   },
//   logo: {
//     fontSize: 18,
//     fontWeight: "bold",
//     color: PRIMARY_GREEN,
//   },
//   greeting: {
//     fontSize: 20,
//     fontWeight: "700",
//     marginTop: 4,
//     color: "#000",
//     textTransform: "capitalize",
//   },
//   headerIcons: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   notificationButton: {
//     position: "relative",
//     padding: 4,
//   },
//   badge: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     backgroundColor: "#fff",
//     borderRadius: 8,
//     padding: 2,
//   },
//   badgeDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: "#ef4444",
//   },
//   langToggle: {
//     borderWidth: 1,
//     borderColor: "#d1d5db",
//     borderRadius: 8,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     backgroundColor: "#fff",
//   },
//   langToggleText: {
//     fontSize: 12,
//     fontWeight: "700",
//     color: PRIMARY_GREEN,
//   },
//   searchContainer: {
//     marginHorizontal: 16,
//     marginBottom: 10, // Reduced margin
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: LIGHT_GRAY,
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 8,
//     fontSize: 16,
//     color: "#000",
//   },
// });

// components/Header.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslationContext } from "../../../context/TranslationContext";
import {
  isTrackingActive,
  startLocationTracking,
  stopLocationTracking,
} from "../../../utils/locationTask"; // Adjust this path if needed

const PRIMARY_GREEN = "#2f855a";
const LIGHT_GRAY = "#f5f5f5";

interface HeaderProps {
  onSearch?: (text: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const router = useRouter();
  const { t } = useTranslationContext();

  const [unreadCount, setUnreadCount] = useState(0);
  const [userName, setUserName] = useState("Transporter");
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // 1. Check if background tracking is already running OR was previously enabled
    const checkTrackingStatus = async () => {
      const isCurrentlyActive = await isTrackingActive();
      const wantsTracking = await AsyncStorage.getItem("auto_track_enabled");

      if (isCurrentlyActive) {
        setIsTracking(true);
      } else if (wantsTracking === "true") {
        // Auto-resume tracking because they had it on before leaving the dashboard
        const started = await startLocationTracking();
        setIsTracking(started);
      } else {
        setIsTracking(false);
      }
    };

    checkTrackingStatus();

    // 2. Load user and notification data
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");

        if (userStr) {
          const user = JSON.parse(userStr);
          const firstName = user.user_metadata?.first_name;
          const lastName = user.user_metadata?.last_name;

          if (firstName) {
            setUserName(`${firstName} ${lastName || ""}`.trim());
          } else {
            setUserName("Transporter");
          }
        }

        if (!token) return;

        try {
          // const data = await api.get(`/api/transporter/notifications`);
          // setUnreadCount(data.unreadCount || 0);
        } catch (_e) {
          // ignore
        }
      } catch (err) {
        console.error("[Header] Failed to load header data", err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const toggleTracking = async () => {
    if (isTracking) {
      await stopLocationTracking();
      await AsyncStorage.setItem("auto_track_enabled", "false"); // Remember they turned it off
      setIsTracking(false);
    } else {
      const started = await startLocationTracking();
      if (started) {
        await AsyncStorage.setItem("auto_track_enabled", "true"); // Remember they turned it on
        setIsTracking(true);
      }
    }
  };

  return (
    <>
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🍃 FreshRoute</Text>
          <Text style={styles.greeting}>
            {t
              ? t("farmer.greeting", { name: userName })
              : `Hello, ${userName}`}
          </Text>
        </View>

        <View style={styles.headerIcons}>
          {/* Location Tracking Toggle */}
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: isTracking ? "#e6fffa" : "transparent" },
            ]}
            onPress={toggleTracking}
          >
            <Ionicons
              name={isTracking ? "location" : "location-outline"}
              size={24}
              color={isTracking ? PRIMARY_GREEN : "#666"}
            />
            {isTracking && <View style={styles.trackingDot} />}
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            onPress={() => router.push("/transporter/notifications" as any)}
            style={[styles.iconButton, { marginLeft: 8 }]}
          >
            <Ionicons name="notifications-outline" size={24} color="#000" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search jobs..."
          placeholderTextColor="#999"
          onChangeText={onSearch}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 50, // Safe area padding
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_GREEN,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    color: "#000",
    textTransform: "capitalize",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    position: "relative",
    padding: 8,
    borderRadius: 50,
  },
  trackingDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_GREEN,
    borderWidth: 1,
    borderColor: "#fff",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 2,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#000",
  },
});
