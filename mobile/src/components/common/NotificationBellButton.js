import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationBellButton({ onPress, badgeCount = 3, style }) {
  return (
    <TouchableOpacity style={[styles.iconBtn, style]} activeOpacity={0.7} onPress={onPress}>
      <Ionicons name="notifications-outline" size={20} color="#111" />
      {badgeCount > 0 ? (
        <View style={styles.notifBadge}>
          <Text style={styles.notifBadgeText}>{badgeCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -1,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: '#ff9800',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
});

