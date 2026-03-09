import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = '#2f855a';
const LIGHT_GREEN = '#e8f4ef';
const DARK_GREEN = '#1a4d3a';

interface ProfileHeaderProps {
  userName: string;
  farmName: string;
  memberSince: string;
  avatarUri?: string;
  onEditAvatar?: () => void;
}

export default function ProfileHeader({
  userName,
  farmName,
  memberSince,
  avatarUri,
  onEditAvatar,
}: ProfileHeaderProps) {
  const { t } = useTranslationContext();

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={styles.patternCircle1} />
          <View style={styles.patternCircle2} />
          <View style={styles.patternCircle3} />
        </View>

        <View style={styles.content}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    avatarUri ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
                }}
                style={styles.avatar}
              />
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
              </View>
              {onEditAvatar && (
                <TouchableOpacity style={styles.editAvatarButton} onPress={onEditAvatar}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{userName}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color={PRIMARY_GREEN} />
              </View>
            </View>

            {farmName && farmName.trim() !== '' && (
              <Text style={styles.farmName}>{farmName}</Text>
            )}

            <View style={styles.roleContainer}>
              <View style={styles.roleBadge}>
                <Ionicons name="leaf" size={16} color="#fff" />
                <Text style={styles.roleText}>Certified Farmer</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.statText}>{memberSince}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#ffd700" />
                <Text style={styles.statText}>4.8 Rating</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(47,133,90,0.08)',
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
  },
  patternCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(47,133,90,0.06)',
  },
  patternCircle2: {
    position: 'absolute',
    top: 20,
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(47,133,90,0.04)',
  },
  patternCircle3: {
    position: 'absolute',
    top: 40,
    right: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(47,133,90,0.03)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    marginRight: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: LIGHT_GREEN,
    borderWidth: 3,
    borderColor: PRIMARY_GREEN,
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editAvatarButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  infoSection: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: DARK_GREEN,
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: LIGHT_GREEN,
    borderRadius: 10,
    padding: 4,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_GREEN,
    marginBottom: 12,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: PRIMARY_GREEN,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#ddd',
    marginHorizontal: 12,
  },
});
