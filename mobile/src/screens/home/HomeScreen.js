import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { statusColors, theme, spacing, touchTargets } from '../../theme/theme';
import { format } from 'date-fns';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const filters = getUserFilters();
      const response = await jobService.getJobs(filters);
      
      if (response.success) {
        const jobs = response.data || [];
        calculateStats(jobs);
        setRecentJobs(jobs.slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getUserFilters = () => {
    const role = user?.role;
    if (role === 'driver') {
      return { assignedDriverId: user.id, limit: 50 };
    } else if (role === 'delivery_agent') {
      return { status: 'Out for Delivery', limit: 50 };
    } else if (role === 'warehouse_staff') {
      return { status: 'At Warehouse', limit: 50 };
    }
    return { limit: 50 };
  };

  const calculateStats = (jobs) => {
    const stats = {
      total: jobs.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    jobs.forEach((job) => {
      if (job.status === 'Delivered' || job.status === 'Closed') {
        stats.completed++;
      } else if (
        job.status === 'Pending Collection' ||
        job.status === 'Assigned'
      ) {
        stats.pending++;
      } else {
        stats.inProgress++;
      }
    });

    setStats(stats);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {/* Stats Section - WhatsApp Style */}
        <View style={styles.statsSection}>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Jobs')}
          >
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Jobs')}
          >
            <Text style={[styles.statNumber, { color: '#faad14' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Jobs')}
          >
            <Text style={[styles.statNumber, { color: '#ff9800' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('Jobs')}
          >
            <Text style={[styles.statNumber, { color: '#52c41a' }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Jobs - WhatsApp Style List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No jobs found</Text>
              <Text style={styles.emptySubtext}>Jobs will appear here once created</Text>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {recentJobs.map((job, index) => (
                <View key={job.id}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation.navigate('Jobs', {
                        screen: 'JobDetail',
                        params: { jobId: job.id },
                      })
                    }
                    style={styles.jobItem}
                  >
                    <View style={styles.jobItemContent}>
                      <View style={styles.jobItemLeft}>
                        <Text style={styles.jobTrackingId}>{job.trackingId}</Text>
                        <Text style={styles.customerName} numberOfLines={1}>
                          {job.customer?.name || 'N/A'}
                        </Text>
                        <Text style={styles.jobDate}>
                          {format(new Date(job.createdAt), 'MMM dd, yyyy')}
                        </Text>
                      </View>
                      <View style={styles.jobItemRight}>
                        <Chip
                          style={[
                            styles.statusChip,
                            { backgroundColor: statusColors[job.status] || '#d9d9d9' },
                          ]}
                          textStyle={styles.chipText}
                        >
                          {job.status}
                        </Chip>
                        <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
                      </View>
                    </View>
                  </TouchableOpacity>
                  {index < recentJobs.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions - WhatsApp Style */}
        {user?.role === 'admin' && (
          <View style={styles.quickActionsSection}>
            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={() => navigation.navigate('Jobs', { screen: 'CreateJob' })}
            >
              <Ionicons name="add-circle-outline" size={24} color="#ff9800" style={styles.quickActionIcon} />
              <Text style={styles.quickActionText}>Create New Job</Text>
              <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
  content: {
    paddingTop: spacing.md,
  },
  // Stats Section - WhatsApp Style
  statsSection: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
    paddingVertical: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ff9800',
    marginBottom: spacing.xs,
  },
  statLabel: {
    color: theme.colors.placeholder,
    fontSize: 12,
    fontWeight: '400',
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.divider,
  },
  // Section
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.text,
  },
  viewAllText: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: '500',
  },
  // Jobs List - WhatsApp Style
  jobsList: {
    backgroundColor: theme.colors.surface,
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
  jobTrackingId: {
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
  jobDate: {
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  jobItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusChip: {
    height: 24,
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
  // Empty State
  emptyContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  // Quick Actions - WhatsApp Style
  quickActionsSection: {
    backgroundColor: theme.colors.surface,
    marginBottom: spacing.md,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.listItemHeight,
  },
  quickActionIcon: {
    marginRight: spacing.md,
    width: 28,
  },
  quickActionText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
});



