import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BuyerColors } from '../../../constants/theme';
import { NavItemProps } from '../../../types';

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, active }) => (
  <TouchableOpacity style={styles.navItem}>
    <Icon
      size={24}
      color={active ? BuyerColors.primaryGreen : BuyerColors.textGray}
      strokeWidth={active ? 2.5 : 2}
    />
    <Text style={[
      styles.navLabel,
      {
        color: active ? BuyerColors.primaryGreen : BuyerColors.textGray,
        fontWeight: active ? '600' : '400'
      }
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
    } ,
    navLabel: {
        fontSize: 10,
        marginTop: 4,
    },
});

export default NavItem;