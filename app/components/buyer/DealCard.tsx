import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { DealData } from '../../../types';
import { BuyerColors } from '../../../constants/theme';

const { width } = Dimensions.get('window');

const DealCard: React.FC<{ deal: DealData }> = ({ deal }) => (
  <View style={styles.dealCard}>
    <View style={styles.dealHeader}>
      <Text style={styles.dealTitle}>{deal.title}</Text>
    </View>
    <Text style={styles.priceText}>
      {deal.price}<Text style={styles.unitText}>{deal.unit}</Text>
    </Text>
    <Text style={styles.dealDesc}>
      {deal.description}
    </Text>
    <TouchableOpacity style={styles.linkRow}>
      <Text style={styles.linkText}>View Deals</Text>
      <ChevronRight size={16} color={BuyerColors.primaryGreen} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  dealCard: {
    backgroundColor: BuyerColors.cardWhite,
    width: width * 0.45,
    padding: 16,
    borderRadius: 16,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dealHeader: {
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BuyerColors.textBlack,
    marginBottom: 4,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: BuyerColors.textBlack,
    marginBottom: 8,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '400',
    color: BuyerColors.textGray,
  },
  dealDesc: {
    fontSize: 13,
    color: BuyerColors.textGray,
    lineHeight: 18,
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    color: BuyerColors.primaryGreen,
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
});

export default DealCard;