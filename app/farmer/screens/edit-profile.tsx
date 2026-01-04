import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = '#2f855a';
const LIGHT_GREEN = '#e8f4f0';
const LIGHT_GRAY = '#f5f5f5';

interface FruitCategory {
  id: string;
  name: string;
  emoji: string;
}

const FRUIT_CATEGORIES: FruitCategory[] = [
  { id: 'mango', name: 'Mango', emoji: '🥭' },
  { id: 'banana', name: 'Banana', emoji: '🍌' },
  { id: 'pineapple', name: 'Pineapple', emoji: '🍍' },
];

interface ProfileData {
  name: string;
  farmName: string;
  location: string;
  phone: string;
  email: string;
  avatarUri: string;
  selectedFruits: string[];
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslationContext();
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    farmName: '',
    location: '',
    phone: '',
    email: '',
    avatarUri: '',
    selectedFruits: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const profileJson = await AsyncStorage.getItem('profile_data');
      
      if (userJson) {
        const user = JSON.parse(userJson);
        setProfileData((prev) => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
        }));
      }

      if (profileJson) {
        const profile = JSON.parse(profileJson);
        setProfileData((prev) => ({
          ...prev,
          ...profile,
        }));
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileData((prev) => ({
        ...prev,
        avatarUri: result.assets[0].uri,
      }));
    }
  };

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileData((prev) => ({
        ...prev,
        avatarUri: result.assets[0].uri,
      }));
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      { text: 'Take Photo', onPress: takePicture },
      { text: 'Choose from Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleFruit = (fruitId: string) => {
    setProfileData((prev) => {
      const selected = prev.selectedFruits.includes(fruitId)
        ? prev.selectedFruits.filter((id) => id !== fruitId)
        : [...prev.selectedFruits, fruitId];
      return { ...prev, selectedFruits: selected };
    });
  };

  const saveProfile = async () => {
    if (!profileData.name || !profileData.farmName) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem('profile_data', JSON.stringify(profileData));
      
      // Update user data
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        user.name = profileData.name;
        user.farmName = profileData.farmName;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
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
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={showImagePickerOptions}
            >
              {profileData.avatarUri ? (
                <Image source={{ uri: profileData.avatarUri }} style={styles.avatar} />
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

          {/* Form Fields */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={profileData.name}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Farm Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={profileData.farmName}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, farmName: text }))
                }
                placeholder="Enter your farm name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={profileData.location}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, location: text }))
                }
                placeholder="Enter your farm location"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, phone: text }))
                }
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={profileData.email}
                onChangeText={(text) =>
                  setProfileData((prev) => ({ ...prev, email: text }))
                }
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>
          </View>

          {/* Fruits Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Fruits You Grow</Text>
            <Text style={styles.sectionSubtitle}>
              Select the fruits you currently grow on your farm
            </Text>

            {FRUIT_CATEGORIES.map((fruit) => (
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
                    profileData.selectedFruits.includes(fruit.id) &&
                      styles.checkboxChecked,
                  ]}
                >
                  {profileData.selectedFruits.includes(fruit.id) && (
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
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: LIGHT_GRAY,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  photoHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#666',
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
});
