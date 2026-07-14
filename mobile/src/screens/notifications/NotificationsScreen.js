import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { spacing, typography } from '../../theme/theme';
import { notificationService } from '../../services/notificationService';
import logger from '../../utils/logger';

function getNotificationIcon(type) {
  switch (type) {
    case 'job_status':
      return 'cube-outline';
    case 'assignment':
      return 'person-outline';
    case 'invoice':
      return 'cash-outline';
    case 'system':
      return 'settings-outline';
    default:
      return 'notifications-outline';
  }
}

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setLoadError(false);
      const response = await notificationService.getNotifications({ limit: 50 });
      if (response?.success) {
        setNotifications(response.data?.notifications || []);
        setUnreadCount(response.data?.unreadCount || 0);
      } else {
        setLoadError(true);
      }
    } catch (error) {
      logger.error('Failed to load notifications screen', error);
      setLoadError(true);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications({ silent: true });
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await loadNotifications({ silent: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert('Clear all', 'Remove all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationService.clearAll();
            setNotifications([]);
            setUnreadCount(0);
          } catch (error) {
            Alert.alert('Error', 'Failed to clear notifications');
          }
        },
      },
    ]);
  };

  const handleNotificationPress = async (item) => {
    try {
      if (!item.isRead) {
        await notificationService.markAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      logger.error('Failed to mark notification as read', error);
    }

    if (item.relatedEntityType === 'job' && item.relatedEntityId) {
      navigation.navigate('MainTabs', {
        screen: 'Jobs',
        params: {
          screen: 'JobDetail',
          params: { jobId: item.relatedEntityId },
        },
      });
    } else if (item.relatedEntityType === 'invoice') {
      navigation.navigate('MainTabs', {
        screen: 'Account',
        params: { screen: 'Invoices' },
      });
    } else if (item.relatedEntityType === 'batch') {
      navigation.navigate('MainTabs', {
        screen: 'Account',
        params: { screen: 'BatchJobs' },
      });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      activeOpacity={0.85}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={getNotificationIcon(item.type)} size={20} color="#ff9800" />
      </View>
      <View style={styles.itemBody}>
        <View style={styles.itemTitleRow}>
          <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]} numberOfLines={1}>
            {item.title || 'Notification'}
          </Text>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        {item.message ? (
          <Text style={styles.itemMessage} numberOfLines={2}>
            {item.message}
          </Text>
        ) : null}
        {item.createdAt ? (
          <Text style={styles.itemTime}>
            {format(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color="#111" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      {notifications.length > 0 ? (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={handleMarkAllAsRead} activeOpacity={0.7}>
            <Text style={styles.actionText}>Mark all read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text style={[styles.actionText, styles.actionDanger]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#ff9800" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => item.id || `notification-${index}`}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyListContent : styles.listContent
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Image
                source={
                  loadError
                    ? require('../../../assets/something-went-wrong.png')
                    : require('../../../assets/no-notifications.png')
                }
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>
                {loadError ? 'Something went wrong' : 'No notifications'}
              </Text>
              <Text style={styles.emptySub}>
                {loadError
                  ? 'Could not load notifications. Pull to retry.'
                  : "You're all caught up. New alerts will show up here."}
              </Text>
              {loadError ? (
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={() => loadNotifications()}
                  activeOpacity={0.85}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#efefef',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: '#111',
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff9800',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 40,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  actionText: {
    color: '#ff9800',
    fontSize: typography.sm,
    fontWeight: '600',
  },
  actionDanger: {
    color: '#f44336',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  emptyListContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#efefef',
  },
  itemUnread: {
    backgroundColor: '#fff8f0',
    borderColor: '#ffe0b2',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff3e0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    flex: 1,
    fontSize: typography.md,
    color: '#333',
    fontWeight: '500',
  },
  itemTitleUnread: {
    color: '#111',
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
  },
  itemMessage: {
    marginTop: 4,
    fontSize: typography.sm,
    color: '#666',
    lineHeight: 20,
  },
  itemTime: {
    marginTop: 6,
    fontSize: 11,
    color: '#999',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  emptyImage: {
    width: 180,
    height: 180,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: typography.sm,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.sm,
  },
});
