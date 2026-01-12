import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Chip, FAB, Searchbar, ActivityIndicator, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { statusColors, theme, spacing, touchTargets } from '../../theme/theme';
import { format } from 'date-fns';

export default function JobsScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const filters = getUserFilters();
      if (statusFilter) {
        filters.status = statusFilter;
      }
      const response = await jobService.getJobs(filters);
      
      if (response.success) {
        setJobs(response.data || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getUserFilters = () => {
    const role = user?.role;
    if (role === 'driver') {
      return { assignedDriverId: user.id };
    } else if (role === 'delivery_agent') {
      return { status: 'Out for Delivery' };
    } else if (role === 'warehouse_staff') {
      return { status: 'At Warehouse' };
    }
    return {};
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.trackingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderJobItem = ({ item, index }) => (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        style={styles.jobItem}
      >
        <View style={styles.jobItemContent}>
          <View style={styles.jobItemLeft}>
            <Text style={styles.trackingId}>{item.trackingId}</Text>
            <Text style={styles.customerName} numberOfLines={1}>
              {item.customer?.name || 'N/A'}
            </Text>
            {item.pickupAddress && (
              <Text style={styles.address} numberOfLines={1}>
                {item.pickupAddress}
              </Text>
            )}
            <Text style={styles.date}>
              {format(new Date(item.createdAt), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.jobItemRight}>
            {item.priority && (
              <Chip
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor:
                      item.priority === 'Urgent'
                        ? '#ff4d4f'
                        : item.priority === 'Express'
                        ? '#faad14'
                        : '#d9d9d9',
                  },
                ]}
                textStyle={styles.chipText}
              >
                {item.priority}
              </Chip>
            )}
            <Chip
              style={[
                styles.statusChip,
                { backgroundColor: statusColors[item.status] || '#d9d9d9' },
              ]}
              textStyle={styles.chipText}
            >
              {item.status}
            </Chip>
            <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
          </View>
        </View>
      </TouchableOpacity>
      {index < filteredJobs.length - 1 && <Divider style={styles.divider} />}
    </View>
  );

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: insets.top }]}>
        <Searchbar
          placeholder="Search by tracking ID or customer name"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No jobs found
            </Text>
          </View>
        }
      />

      {(user?.role === 'admin' || user?.role === 'customer-service') && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + spacing.md }]}
          onPress={() => navigation.navigate('CreateJob')}
          color="#ffffff"
          customSize={56}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  searchbar: {
    backgroundColor: theme.colors.background,
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  jobItem: {
    backgroundColor: theme.colors.surface,
  },
  jobItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.listItemHeight,
  },
  jobItemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  trackingId: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  customerName: {
    color: theme.colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  address: {
    color: theme.colors.placeholder,
    fontSize: 13,
    marginBottom: 4,
  },
  date: {
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  jobItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusChip: {
    height: 24,
  },
  priorityChip: {
    height: 22,
  },
  chipText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '500',
  },
  divider: {
    marginLeft: spacing.md,
    backgroundColor: theme.colors.divider,
  },
  emptyContainer: {
    padding: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    color: theme.colors.placeholder,
    fontSize: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#ff9800', // Orange
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    zIndex: 1000,
  },
});



