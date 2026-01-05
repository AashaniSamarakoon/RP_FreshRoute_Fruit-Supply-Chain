import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OrderListItem = () => {
  return (
    <View style={styles.container}>
      <Text>Order List Item</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default OrderListItem;