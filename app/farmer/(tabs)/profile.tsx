import { getOrdersOverview, getSMSPreferences, updateSMSPreferences } from "@/services/farmerApi";
import { supabase } from "@/utils/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
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
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
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

      // Fetch farmer profile from database
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

        // Fetch profile data directly from Supabase farmers table and users table
        const { data: profileData, error: profileError } = await supabase
          .from('farmers')
          .select('user_id, farm_name, primary_crops')
          .eq('user_id', session.user.id)
          .single();

        // Also fetch user data including avatar
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, first_name, last_name, avatar_url')
          .eq('id', session.user.id)
          .single();

        console.log('Database query result:', { 
          profileData, 
          profileError, 
          userData, 
          userError, 
          userId: session.user.id 
        });

        if (profileError || userError) {
          console.error('Failed to fetch profile from database:', { profileError, userError });
        } else if (profileData && userData) {
          console.log('Profile data loaded from database:', profileData);
          console.log('User data loaded from database:', userData);

          // Use avatar from users table
          const avatarUrl = userData.avatar_url || null;

          // Get first name and last name from users table
          const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim();
          let farmerName = 'Farmer';

          if (fullName) {
            // Use the full name from users table
            farmerName = fullName;
          } else if (profileData.farm_name && profileData.farm_name.trim()) {
            // Use farm_name as fallback if it contains the name
            farmerName = profileData.farm_name.trim();
          } else if (userData.email) {
            // As last resort, capitalize email prefix
            const emailPrefix = userData.email.split('@')[0];
            farmerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
          }

          console.log('Name sources:', {
            fullName: fullName,
            farmName: profileData.farm_name,
            email: userData.email,
            finalName: farmerName
          });

          // Parse primary_crops if it's a string
          let selectedFruits = [];
          if (profileData.primary_crops) {
            if (Array.isArray(profileData.primary_crops)) {
              selectedFruits = profileData.primary_crops;
            } else if (typeof profileData.primary_crops === 'string') {
              try {
                selectedFruits = JSON.parse(profileData.primary_crops);
              } catch {
                selectedFruits = [];
              }
            }
          }

          // Map database fields to expected format
          const currentDate = new Date();
          const memberSinceDate = user?.memberSince ||
                                  `Member since ${currentDate.getFullYear()}`;

          const mappedProfileData = {
            farmerName: farmerName,
            memberSince: memberSinceDate,
            avatarUri: avatarUrl,
            selectedFruits: selectedFruits,
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
      // Use orders overview API
      const response = await getOrdersOverview();
      console.log("Orders overview response:", response);

      if (response) {
        // Map API response to order overview format
        const newOrderStats = {
          completedCount: response.completedCount || response.completed || 0,
          pendingCount: response.pendingCount || response.pending || 0,
          lastCompletedDate: response.lastCompletedDate || response.lastCompleted || "No orders yet",
          nextOrderDate: response.nextOrderDate || response.nextOrder || "Not scheduled",
        };
        setOrderStats(newOrderStats);

        // Update nextOrderDate state for the calendar
        const nextOrder = response.nextOrderDate || response.nextOrder;
        if (nextOrder && nextOrder !== "Not scheduled" && nextOrder !== "N/A") {
          try {
            // Try to parse as date, fallback to current date if parsing fails
            const parsedDate = new Date(nextOrder);
            if (!isNaN(parsedDate.getTime())) {
              setNextOrderDate(parsedDate);
            } else {
              setNextOrderDate(new Date()); // fallback
            }
          } catch {
            setNextOrderDate(new Date()); // fallback
          }
        }
      } else {
        // Fallback to demo data
        setOrderStats(demoOrderStats);
        setNextOrderDate(new Date(demoOrderStats.nextOrderDate));
      }
    } catch (err) {
      // API not available, use demo data for now
      console.log("Orders overview API not available, using demo data");
      setOrderStats(demoOrderStats);
      setNextOrderDate(new Date(demoOrderStats.nextOrderDate));
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
    console.log("[SMS] updateSMSSetting called with value:", value);

    // Update local state immediately for better UX
    setSmsAlertsEnabled(value);
    console.log("[SMS] setting local state to:", value);

    try {
      // Update SMS setting via API
      await updateSMSPreferences({ sms_alerts_enabled: value });
      console.log('[SMS] Successfully updated SMS setting via API');
    } catch (err) {
      console.error("[SMS] Error updating SMS setting via API:", err);
      // Revert on error
      setSmsAlertsEnabled(!value);
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
      console.log("[SMS] loadSMSPreferences called");

      // Fetch SMS setting via API
      const response = await getSMSPreferences();
      if (response?.preferences) {
        const smsEnabled = response.preferences.sms_alerts_enabled ?? true;
        console.log("[SMS] Setting SMS alerts enabled from API:", smsEnabled);
        setSmsAlertsEnabled(smsEnabled);
      } else {
        // Set default if no preferences returned
        console.log("[SMS] No preferences from API, setting default");
        setSmsAlertsEnabled(true);
      }
    } catch (err) {
      console.log("[SMS] SMS preferences API not available, using default");
      // Set default on error
      setSmsAlertsEnabled(true);
    }
  };

  const pickImage = async () => {
    Alert.alert(
      "Change Profile Picture",
      "Choose an option",
      [
        { text: "Camera", onPress: openCamera },
        { text: "Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Camera permission is required to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0]);
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Gallery permission is required to select photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      // Check if bucket exists (skip if check fails to avoid blocking uploads)
      try {
        const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
        if (bucketError) {
          console.warn('Bucket check warning:', bucketError.message);
          // Continue with upload attempt - bucket might still work
        } else {
          const bucketExists = buckets?.some(bucket => bucket.name === 'Farmer');
          if (!bucketExists) {
            console.warn('Farmer bucket not found in list, but continuing with upload attempt');
          }
        }
      } catch (checkError) {
        console.warn('Bucket check failed, continuing with upload:', checkError);
        // Continue with upload attempt
      }

      // Create unique filename
      let fileName = `avatar_${session.user.id}_${Date.now()}.jpg`;
      let filePath = `profile/${fileName}`;

      // Convert to blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Upload to Supabase storage
      console.log('Attempting upload to Farmer/profile/', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Farmer')
        .upload(filePath, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          statusCode: uploadError.statusCode
        });

        // Handle "already exists" by retrying with new filename
        if (uploadError.message?.includes('already exists') || uploadError.message?.includes('Duplicate')) {
          const newFileName = `avatar_${session.user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
          const newFilePath = `profile/${newFileName}`;
          console.log('Retrying upload with new filename:', newFilePath);

          const retryResult = await supabase.storage
            .from('Farmer')
            .upload(newFilePath, blob, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (retryResult.error) {
            console.error('Retry upload failed:', retryResult.error);
            Alert.alert("Upload Failed", "Failed to upload image. Please try again.");
            return;
          }

          // Use the new file path for URL generation
          filePath = newFilePath;
        } else {
          // Other errors - show specific message
          let errorMessage = "Failed to upload image";
          if (uploadError.message?.includes('Network request failed')) {
            errorMessage = "Network error. Please check your internet connection and try again.";
          } else if (uploadError.message?.includes('permission') || uploadError.message?.includes('unauthorized') || uploadError.message?.includes('403')) {
            errorMessage = "Permission denied. Please ensure the Farmer bucket allows authenticated uploads.";
          } else if (uploadError.message?.includes('size') || uploadError.message?.includes('too large') || uploadError.message?.includes('413')) {
            errorMessage = "Image file is too large. Please choose a smaller image.";
          } else if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found') || uploadError.message?.includes('404')) {
            errorMessage = "Storage bucket 'Farmer' not found. Please create it in Supabase Storage.";
          }

          Alert.alert("Upload Failed", errorMessage);
          return;
        }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Farmer')
        .getPublicUrl(filePath);

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        Alert.alert("Error", "Failed to update profile. Image uploaded but profile not updated.");
        return;
      }

      // Update local state
      setProfileData((prev: any) => prev ? { ...prev, avatarUri: publicUrl } : null);

      // Update cached data
      const cachedData = await AsyncStorage.getItem("profile_data");
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        parsed.avatarUri = publicUrl;
        await AsyncStorage.setItem("profile_data", JSON.stringify(parsed));
      }

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
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
            userName={profileData?.farmerName || user?.name || "Farmer"}
            farmName=""
            memberSince={profileData?.memberSince || "Member since 2026"}
            avatarUri={profileData?.avatarUri}
            onEditAvatar={pickImage}
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
                {nextOrderDate instanceof Date && !isNaN(nextOrderDate.getTime())
                  ? nextOrderDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'No date'
                }
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
                value={smsAlertsEnabled}
                onValueChange={updateSMSSetting}
                trackColor={{ false: '#ccc', true: PRIMARY_GREEN }}
                thumbColor={smsAlertsEnabled ? '#fff' : '#f4f3f4'}
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

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={nextOrderDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
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
