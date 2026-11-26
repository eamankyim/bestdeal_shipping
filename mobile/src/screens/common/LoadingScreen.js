import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import ThreeDotsLoader from '../../components/common/ThreeDotsLoader';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ThreeDotsLoader />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#8c8c8c',
  },
});



