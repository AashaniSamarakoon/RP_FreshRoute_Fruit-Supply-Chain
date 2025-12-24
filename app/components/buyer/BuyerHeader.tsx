import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, Bell } from 'lucide-react-native';
import { BuyerColors } from '../../../constants/theme';

const BuyerHeader = () => (
  <View style={styles.header}>
    <View style={styles.logoContainer}>
      {/* Logo Placeholder - Replace with <Image /> if needed */}
      <View style={styles.logoIcon} />
      <Text style={styles.headerTitle}>Fresh Route</Text>
    </View>
    <View style={styles.headerIcons}>
      <TouchableOpacity style={styles.iconBtn}>
        <Search size={24} color={BuyerColors.textBlack} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn}>
        <Bell size={24} color={BuyerColors.textBlack} />
        <View style={styles.notificationDot} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: BuyerColors.cardWhite,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#8BC34A',
    borderRadius: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BuyerColors.textBlack,
    letterSpacing: -0.5,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconBtn: {
    padding: 4,
  },
  notificationDot: {
    position: 'absolute',
    top: 0,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    borderWidth: 1.5,
    borderColor: BuyerColors.cardWhite,
  },
});

export default BuyerHeader;
