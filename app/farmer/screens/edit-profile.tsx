import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../../utils/supabaseClient';

const PRIMARY_GREEN = '#2f855a';
const LIGHT_GRAY = '#f5f5f5';

interface FruitCategory {
  id: string;
  name: string;
  emoji: string;
}

interface ProfileData {
  id?: string;
  first_name: string; // Maps to farm_name in database
  last_name: string; // Not used in farmers table
  email: string; // Not stored in farmers table
  phone: string; // Not stored in farmers table
  selected_fruits: string[]; // Maps to primary_crops in database
}

const FRUIT_CATEGORIES: FruitCategory[] = [
  { id: 'mango', name: 'Mango', emoji: '🥭' },
  { id: 'banana', name: 'Banana', emoji: '🍌' },
  { id: 'pineapple', name: 'Pineapple', emoji: '🍍' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    selected_fruits: [],
  });
  const [loading, setLoading] = useState(false);
  const [availableFruits, setAvailableFruits] = useState<FruitCategory[]>(FRUIT_CATEGORIES);

  useEffect(() => {
    loadProfileData();
    loadAvailableFruits();
  }, []);

   const loadProfileData = async () => {
     try {
       setLoading(true);
       logger.log('Loading profile data...');

       // Check authentication first
       const { data: { session }, error: sessionError } = await supabase.auth.getSession();
       if (sessionError) {
         logger.error('Session error:', sessionError);
         Alert.alert('Authentication Error', 'Please log in again.');
         return;
       }
       if (!session?.user?.id) {
         logger.log('No authenticated user found');
         Alert.alert('Authentication Required', 'Please log in to view your profile.');
         return;
       }
       logger.log('User authenticated, fetching profile from database...');

       // Fetch profile data directly from Supabase farmers table
       // Based on onboarding data, the table likely has different column names
       const { data: profileData, error: profileError } = await supabase
         .from('farmers')
         .select('user_id, farm_name, primary_crops')
         .eq('user_id', session.user.id)
         .single();

       logger.log('Profile query result:', { profileData, profileError });

       if (profileError) {
         logger.error('Failed to fetch profile:', profileError);
         Alert.alert('Error', 'Failed to load profile data. Please try again.');
         return;
       }

       if (profileData) {
         const selectedFruits = Array.isArray(profileData.primary_crops) ? profileData.primary_crops : [];
         logger.log('Setting selected_fruits to:', selectedFruits, 'from primary_crops:', profileData.primary_crops);
         setProfileData({
           id: profileData.user_id,
           first_name: profileData.farm_name || '', // Use farm_name as first_name
           last_name: '', // No last_name in farmers table
           email: session.user.email || '', // Get email from auth session
           phone: session.user.phone || '', // Get phone from auth session
           selected_fruits: selectedFruits,
         });
         logger.log('Profile data set successfully');
       } else {
         logger.log('No profile data found in database');
         Alert.alert('Profile Not Found', 'Please complete your farmer onboarding first.');
       }
     } catch (err: any) {
       logger.error('Failed to load profile data:', err);
       Alert.alert('Error', 'Failed to load profile data. Please try again.');
     } finally {
       setLoading(false);
     }
   };

   const loadAvailableFruits = async () => {
     try {
       logger.log('Loading available fruits...');

       // For now, use the hardcoded fruits. In the future, this could come from an API or database
       // const { data: fruitsData, error } = await supabase.from('fruits').select('*');
       // if (error) logger.error('Failed to load fruits:', error);

       // Temporary: keep the existing fruit categories
       setAvailableFruits(FRUIT_CATEGORIES);
       logger.log('Fruits loaded successfully:', FRUIT_CATEGORIES.length, 'fruits');
     } catch (err: any) {
       logger.error('Failed to load available fruits:', err);
       // Keep the default fruits as fallback
     }
   };

   const toggleFruit = (fruitId: string) => {
     logger.log('toggleFruit called with:', fruitId, 'current selected_fruits:', profileData.selected_fruits);
     setProfileData((prev) => {
       const currentSelected = prev.selected_fruits || [];
       logger.log('prev.selected_fruits:', prev.selected_fruits, 'currentSelected:', currentSelected);
       const selected = currentSelected.includes(fruitId)
         ? currentSelected.filter((id) => id !== fruitId)
         : [...currentSelected, fruitId];
       return { ...prev, selected_fruits: selected };
     });
   };

  const saveProfile = async () => {
    if (!profileData.first_name) {
      Alert.alert('Validation Error', 'Please enter your farm name.');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving profile data...');

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        Alert.alert('Authentication Error', 'Please log in again.');
        return;
      }

      const updateData = {
        farm_name: profileData.first_name, // Map first_name to farm_name
        primary_crops: profileData.selected_fruits, // Map selected_fruits to primary_crops
        updated_at: new Date().toISOString(),
      };

      // Update the farmers table
      const { error } = await supabase
        .from('farmers')
        .update(updateData)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Failed to save profile:', error);
        Alert.alert('Error', 'Failed to save profile. Please try again.');
        return;
      }

      console.log('Profile saved successfully');
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={saveProfile} disabled={loading}>
            <Text style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Photo Section - Disabled since not stored in farmers table */}
          {/*
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={showImagePickerOptions}
            >
              {profileData.avatar_url ? (
                <Image source={{ uri: profileData.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#999" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>
          */}

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Farm Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Farm Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={profileData.first_name}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, first_name: text }))
                }
                placeholder="Enter your farm name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={profileData.email || 'Not provided'}
                editable={false}
                placeholder="Email managed through account settings"
                placeholderTextColor="#999"
              />
              <Text style={styles.hintText}>
                Email is managed through your account settings
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={profileData.phone || 'Not provided'}
                editable={false}
                placeholder="Phone managed through account settings"
                placeholderTextColor="#999"
              />
              <Text style={styles.hintText}>
                Phone number is managed through your account settings
              </Text>
            </View>
          </View>

          {/* Fruits Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fruits You Grow</Text>
            <Text style={styles.sectionSubtitle}>
              Select the fruits you currently grow on your farm
            </Text>

            {availableFruits.map((fruit) => (
              <TouchableOpacity
                key={fruit.id}
                style={styles.fruitOption}
                onPress={() => toggleFruit(fruit.id)}
              >
                <View style={styles.fruitLeft}>
                  <Text style={styles.fruitEmoji}>{fruit.emoji}</Text>
                  <Text style={styles.fruitName}>{fruit.name}</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    (profileData.selected_fruits || []).includes(fruit.id) &&
                      styles.checkboxChecked,
                  ]}
                >
                  {(profileData.selected_fruits || []).includes(fruit.id) && (
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_GREEN,
  },
  saveButtonDisabled: {
    color: '#999',
  },
  scrollView: {
    flex: 1,
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e53e3e',
  },
  input: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  fruitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    marginBottom: 12,
  },
  fruitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fruitEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  fruitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: PRIMARY_GREEN,
    borderColor: PRIMARY_GREEN,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
