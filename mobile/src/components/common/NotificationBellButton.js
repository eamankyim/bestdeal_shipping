import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notificationService } from '../../services/notificationService';

export default function NotificationBellButton({ onPress, badgeCount, style }) {
  const [unreadCount, setUnreadCount] = useState(
    typeof badgeCount === 'number' ? badgeCount : 0
  );

  useFocusEffect(
    useCallback(() => {
      if (typeof badgeCount === 'number') {
        setUnreadCount(badgeCount);
        return undefined;
      }

      let active = true;
      const loadCount = async () => {
        try {
          const response = await notificationService.getUnreadCount();
          if (active && response?.success) {
            setUnreadCount(response.data?.unreadCount || 0);
          }
        } catch (_error) {
          // Keep last known count; bell should still navigate.
        }
      };

      loadCount();
      const interval = setInterval(loadCount, 60000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }, [badgeCount])
  );

  const displayCount = typeof badgeCount === 'number' ? badgeCount : unreadCount;

  return (
    <TouchableOpacity
      style={[styles.iconBtn, style]}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <Ionicons name="notifications-outline" size={20} color="#111" />
      {displayCount > 0 ? (
        <View style={styles.notifBadge}>
          <Text style={styles.notifBadgeText}>
            {displayCount > 99 ? '99+' : displayCount}
          </Text>
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
