import { getFarmerDashboard, getSMSPreferences, updateSMSPreferences } from "@/services/farmerApi";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTranslationContext } from "../../../context/TranslationContext";
import {
  GrowingFruits,
  ProfileHeader,
} from "../components";

const PRIMARY_GREEN = "#2f855a";

interface UserData {
  name?: string;
  email?: string;
  role?: string;
  farmName?: string;
  location?: string;
  memberSince?: string;
}

interface Fruit {
  id: string;
  name: string;
  imageUri: string;
}

const mockFruits: Fruit[] = [
  {
    id: "mango",
    name: "Mango",
    imageUri: "🥭",
  },
  {
    id: "banana",
    name: "Banana",
    imageUri: "🍌",
  },
  {
    id: "pineapple",
    name: "Pineapple",
    imageUri: "🍍",
  },
];

const demoOrderStats = {
  completedCount: 15,
  pendingCount: 3,
  lastCompletedDate: "Jan 05, 2026",
  nextOrderDate: "Jan 12, 2026",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslationContext();
  const [user, setUser] = useState<UserData | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [orderStats, setOrderStats] = useState(demoOrderStats);
  const [settings, setSettings] = useState({
    notifications: true,
  });
  const [smsPreferences, setSmsPreferences] = useState({
    sms_alerts_enabled: true,
    sms_frequency: 'daily',
    phone: '',
  });
  const [nextOrderDate, setNextOrderDate] = useState(new Date(orderStats.nextOrderDate));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadUser = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem("user");
      if (userJson) {
        setUser(JSON.parse(userJson));
      }

      // Load cached profile data from AsyncStorage
      const profileJson = await AsyncStorage.getItem("profile_data");
      if (profileJson) {
        setProfileData(JSON.parse(profileJson));
      }

      // Fetch farmer profile from Supabase (since API endpoint doesn't exist)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }
        if (!session?.user?.id) {
          console.log('No authenticated user found');
          return;
        }

        // Fetch profile data directly from Supabase farmers table
        const { data: profileData, error: profileError } = await supabase
          .from('farmers')
          .select('user_id, farm_name, primary_crops')
          .eq('user_id', session.user.id)
          .single();

        console.log('Database query result:', { profileData, profileError, userId: session.user.id });

        if (profileError) {
          console.error('Failed to fetch profile from database:', profileError);
        } else if (profileData) {
          console.log('Profile data loaded from database:', profileData);
          // Map database fields to expected format
          const mappedProfileData = {
            farmName: profileData.farm_name || 'Farm Name',
            memberSince: user?.memberSince || 'Member since Jan 2026',
            avatarUri: null,
            selectedFruits: Array.isArray(profileData.primary_crops) ? profileData.primary_crops : [],
          };
          console.log('Mapped profile data:', mappedProfileData);
          setProfileData(mappedProfileData);
          console.log('Profile data set to state:', mappedProfileData);
          await AsyncStorage.setItem("profile_data", JSON.stringify(mappedProfileData));
        }
      } catch (dbErr) {
        console.error("[Profile] Failed to fetch from database:", dbErr);
      }

      // Fetch order statistics
      await fetchOrderStats();

      // Load settings
      await loadSettings();

      // Load SMS preferences
      await loadSMSPreferences();
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchOrderStats = async () => {
    try {
      // Use dashboard API since orders/overview endpoint doesn't exist
      const response = await getFarmerDashboard();
      if (response?.stats) {
        // Map dashboard stats to order overview format
        const totalShipments = response.stats.totalShipments || 0;
        const spoilageReduced = response.stats.spoilageReduced || 0;

        setOrderStats({
          completedCount: totalShipments,
          pendingCount: Math.max(0, spoilageReduced - totalShipments), // Estimate pending from spoilage data
          lastCompletedDate: totalShipments > 0 ? "Recent" : "No orders yet",
          nextOrderDate: response.upcomingPickups?.length > 0 ? "Scheduled" : "Not scheduled",
        });
      } else {
        // Fallback to demo data
        setOrderStats(demoOrderStats);
      }
    } catch (err) {
      console.error("Error fetching order stats:", err);
      // Fallback to demo data
      setOrderStats(demoOrderStats);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Reload profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [loadUser]),
  );

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signOut failed", e);
    }
    await AsyncStorage.multiRemove([
      "token",
      "user",
      "onboarded",
      "onboarding_farmer",
    ]);
    router.replace("/login");
  };

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem("farmer_settings", JSON.stringify(newSettings));
  };

  const updateSMSSetting = async (value: boolean) => {
    // Update local state immediately for better UX
    setSmsPreferences(prev => ({ ...prev, sms_alerts_enabled: value }));

    try {
      await updateSMSPreferences({ sms_alerts_enabled: value });
    } catch (err) {
      console.error("Error updating SMS preferences:", err);
      // Revert on error
      setSmsPreferences(prev => ({ ...prev, sms_alerts_enabled: !value }));
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setNextOrderDate(selectedDate);
      // Here you could save to backend or AsyncStorage
    }
  };

  const loadSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem("farmer_settings");
      if (settingsJson) {
        setSettings(JSON.parse(settingsJson));
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    }
  };

  const loadSMSPreferences = async () => {
    try {
      const response = await getSMSPreferences();
      if (response?.preferences) {
        setSmsPreferences(response.preferences);
      }
    } catch (err) {
      console.error("Error loading SMS preferences:", err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Ionicons name="chevron-back" size={24} color={PRIMARY_GREEN} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("profile.headerTitle")}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/farmer/screens/edit-profile")}
            style={styles.headerButton}
          >
            <Ionicons name="create-outline" size={24} color={PRIMARY_GREEN} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Component */}
          <ProfileHeader
            userName={profileData?.farmName || user?.farmName || "Farmer"}
            farmName=""
            memberSince={
              profileData?.memberSince ||
              user?.memberSince ||
              "Member since Jan 2026"
            }
            avatarUri={profileData?.avatarUri}
          />

          <GrowingFruits
            fruits={
              Array.isArray(profileData?.selectedFruits) && profileData.selectedFruits.length > 0
                ? mockFruits.filter((fruit) =>
                    profileData.selectedFruits.includes(fruit.id),
                  )
                : mockFruits
            }
          />

          <Text style={styles.sectionTitle}>Overview</Text>

          {/* Compact Overview */}
          <View style={styles.compactOverview}>
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.statValue}>{orderStats.completedCount}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.statValue}>{orderStats.pendingCount}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.calendarButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar" size={20} color={PRIMARY_GREEN} style={styles.calendarIcon} />
              <Text style={styles.calendarLabel}>Next Order</Text>
              <Text style={styles.calendarDate}>
                {nextOrderDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/farmer/screens/complaints-list")}
            >
              <Ionicons name="warning" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Complaints</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/farmer/orders")}
            >
              <Ionicons name="list" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>My Orders</Text>
            </TouchableOpacity>
          </View>

          {/* Settings Section */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsContainer}>
            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Ionicons name="chatbubble" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.settingLabel}>SMS Service</Text>
              </View>
              <Switch
                value={smsPreferences.sms_alerts_enabled}
                onValueChange={updateSMSSetting}
                trackColor={{ false: '#ccc', true: PRIMARY_GREEN }}
                thumbColor={smsPreferences.sms_alerts_enabled ? '#fff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Ionicons name="notifications" size={20} color={PRIMARY_GREEN} />
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSetting('notifications', value)}
                trackColor={{ false: '#ccc', true: PRIMARY_GREEN }}
                thumbColor={settings.notifications ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>{t("profile.logout")}</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerButton: {
    padding: 8,
    marginHorizontal: -8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  scrollView: {
    flex: 1,
  },
  compactOverview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f7fdf9",
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.12)",
  },
  overviewStats: {
    flexDirection: "row",
    gap: 20,
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY_GREEN,
  },
  statLabel: {
    fontSize: 12,
    color: "#4b5563",
  },
  calendarButton: {
    alignItems: "center",
    padding: 8,
    backgroundColor: "rgba(47,133,90,0.1)",
    borderRadius: 8,
    minWidth: 80,
  },
  calendarIcon: {
    marginBottom: 4,
  },
  calendarLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
  },
  calendarDate: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY_GREEN,
    textAlign: "center",
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e53e3e",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e53e3e",
  },
  settingsContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#f7fdf9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.12)",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(47,133,90,0.1)",
  },
  settingTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  calendarContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: "#f7fdf9",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(47,133,90,0.12)",
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_GREEN,
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_GREEN,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
