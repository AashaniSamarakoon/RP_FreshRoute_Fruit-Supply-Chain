import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = '#2f855a';
const LIGHT_GRAY = '#f5f5f5';

interface ProfileHeaderProps {
  userName: string;
  farmName: string;
  memberSince: string;
  avatarUri?: string;
  onMessagePress?: () => void;
}

export default function ProfileHeader({
  userName,
  farmName,
  memberSince,
  avatarUri,
  onMessagePress,
}: ProfileHeaderProps) {
  const { t } = useTranslationContext();

  return (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri:
              avatarUri ||
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          }}
          style={styles.avatar}
        />
      </View>
      <Text style={styles.userName}>{userName}</Text>
      <Text style={styles.farmName}>{farmName}</Text>
      <Text style={styles.memberSince}>{memberSince}</Text>
      <TouchableOpacity style={styles.messageButton} onPress={onMessagePress}>
        <Text style={styles.messageButtonText}>{t('profile.message')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: LIGHT_GRAY,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  farmName: {
    fontSize: 14,
    color: PRIMARY_GREEN,
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  messageButton: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 80,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
