import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = '#2f855a';
const LIGHT_GRAY = '#f5f5f5';

interface ProfileHeaderProps {
  userName: string;
  farmName: string;
  memberSince: string;
  avatarUri?: string;
}

export default function ProfileHeader({
  userName,
  farmName,
  memberSince,
  avatarUri,
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
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <Text style={styles.farmName}>{farmName}</Text>
        <View style={styles.farmerBadge}>
          <Ionicons name="leaf" size={14} color={PRIMARY_GREEN} />
          <Text style={styles.farmerBadgeText}>Farmer</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.memberSince}>{memberSince}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 22,
    backgroundColor: '#f7fdf9',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(47,133,90,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: '#e1efe7',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  userName: {
    fontSize: 21,
    fontWeight: '700',
    color: '#000',
  },
  farmName: {
    fontSize: 14,
    color: PRIMARY_GREEN,
    marginBottom: 10,
  },
  farmerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e8f4ef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  farmerBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PRIMARY_GREEN,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f3',
    borderRadius: 12,
  },
  memberSince: {
    fontSize: 12,
    color: '#999',
    marginBottom: 0,
  },
});
