import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EmptyState = ({ message }: { message: string }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#888',
  },
});

export default EmptyState;
