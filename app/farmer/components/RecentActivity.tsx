import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslationContext } from '../../../context/TranslationContext';

const PRIMARY_GREEN = '#2f855a';

interface Activity {
  id: string;
  title: string;
  date: string;
  amount: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const { t } = useTranslationContext();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('profile.recentActivity')}</Text>
      {activities.map((activity) => (
        <View key={activity.id} style={styles.activityItem}>
          <View style={styles.activityLeft}>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            <Text style={styles.activityDate}>{activity.date}</Text>
          </View>
          <Text style={styles.activityAmount}>{activity.amount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  activityLeft: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#999',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY_GREEN,
  },
});
