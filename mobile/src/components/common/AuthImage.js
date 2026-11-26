import React, { useEffect, useState } from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../config/api';

/** An image only signed-in staff may fetch. Tap to view it full screen. */
export default function AuthImage({ path, size = 88 }) {
  const [token, setToken] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem('userToken').then((value) => mounted && setToken(value));
    return () => { mounted = false; };
  }, []);

  if (!token) return <View style={[styles.thumb, { width: size, height: size }]} />;
  const source = { uri: `${api.defaults.baseURL}${path}`, headers: { Authorization: `Bearer ${token}` } };

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} accessibilityLabel="View photo">
        <Image source={source} style={[styles.thumb, { width: size, height: size }]} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <Image source={source} style={styles.full} resizeMode="contain" />
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: 8, backgroundColor: '#f0f0f0' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.9)', justifyContent: 'center' },
  full: { width: '100%', height: '85%' },
});
