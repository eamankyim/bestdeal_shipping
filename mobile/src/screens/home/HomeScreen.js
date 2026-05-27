import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { statusColors, spacing, touchTargets, typography } from '../../theme/theme';
import { format } from 'date-fns';
import SearchBellHeader from '../../components/common/SearchBellHeader';

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
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const response = await jobService.getJobs({ limit: 50 });

      if (response.success) {
        const jobsRaw =
          response?.data?.jobs ||
          response?.data?.data?.jobs ||
          response?.data?.data ||
          response?.data ||
          [];
        const jobs = Array.isArray(jobsRaw) ? jobsRaw : [];
        calculateStats(jobs);
        setRecentJobs(jobs.slice(0, 4));
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (jobs) => {
    const next = {
      total: jobs.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
    };

    jobs.forEach((job) => {
      if (job.status === 'Delivered' || job.status === 'Closed') {
        next.completed += 1;
      } else if (job.status === 'Pending Collection' || job.status === 'Assigned') {
        next.pending += 1;
      } else {
        next.inProgress += 1;
      }
    });

    setStats(next);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getStatusTone = (status) => {
    const normalized = (status || '').toLowerCase().trim();
    const normalizedForMatch = normalized.replace(/_/g, ' ');
    if (normalizedForMatch.includes('ready for delivery')) {
      return { bg: '#f0e9ff', text: '#7a45d1' };
    }
    if (normalizedForMatch.includes('delivered')) {
      return { bg: '#e8f8ed', text: '#23a455' };
    }
    if (normalizedForMatch.includes('in progress')) {
      return { bg: '#e8f1ff', text: '#1f7ae0' };
    }
    if (normalizedForMatch.includes('pending')) {
      return { bg: '#fff4df', text: '#d99000' };
    }
    return {
      bg: statusColors[status] ? `${statusColors[status]}22` : '#efefef',
      text: '#666',
    };
  };

  const filteredRecentJobs = recentJobs.filter((job) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (job.trackingId || '').toLowerCase().includes(q) ||
      (job.customer?.name || '').toLowerCase().includes(q)
    );
  });

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
      contentContainerStyle={{ paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <SearchBellHeader
        topInset={insets.top + 8}
        placeholder="Search jobs or customers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={styles.content}>
        <Text style={styles.greeting}>Good morning, 👋</Text>
        <Text style={styles.userName}>{user?.name || 'Admin User'}</Text>
        <Text style={styles.subtitle}>Here's what's happening today.</Text>

        <View style={styles.statsGrid}>
          <StatCard icon="briefcase-outline" value={stats.total} label="Total Jobs" type="total" />
          <StatCard icon="time-outline" value={stats.pending} label="Pending" type="pending" />
          <StatCard icon="refresh-circle-outline" value={stats.inProgress} label="In Progress" type="progress" />
          <StatCard icon="checkmark-circle" value={stats.completed} label="Completed" type="completed" />
        </View>

        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Jobs')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {filteredRecentJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            {loadError ? (
              <>
                <Image
                  source={require('../../../assets/something-went-wrong.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>Something went wrong</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadDashboardData} activeOpacity={0.85}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Image
                  source={require('../../../assets/no-jobs.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>No recent jobs yet</Text>
              </>
            )}
          </View>
        ) : (
          filteredRecentJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate('Jobs', {
                  screen: 'JobDetail',
                  params: { jobId: job.id },
                })
              }
            >
              <View style={styles.jobMainRow}>
                <View style={styles.jobLeftIconCol}>
                  <View style={styles.packageBadge}>
                    <Ionicons name="cube-outline" style={styles.packageIcon} color="#ff9800" />
                  </View>
                </View>

                <View style={styles.jobContentCol}>
                  <View style={styles.jobTopRow}>
                    <Text style={styles.trackingId}>{job.trackingId}</Text>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: getStatusTone(job.status).bg }]}
                      textStyle={[styles.statusText, { color: getStatusTone(job.status).text }]}
                    >
                      {job.status}
                    </Chip>
                  </View>

                  <Text style={styles.customerName}>{job.customer?.name || 'Unknown customer'}</Text>
                  <View style={styles.jobDateRow}>
                    <Ionicons name="calendar-outline" style={styles.dateIcon} color="#9a9a9a" />
                    <Text style={styles.jobDate}>{format(new Date(job.createdAt), 'MMM dd, yyyy')}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.jobChevronWrap}>
                <Ionicons name="chevron-forward" size={18} color="#a7a7a7" />
              </View>
            </TouchableOpacity>
          ))
        )}

      </View>
    </ScrollView>
  );
}

function StatCard({ icon, value, label, type }) {
  const themeByType = {
    total: {
      bg: '#fff7ef',
      iconBg: '#fff3e3',
      iconColor: '#f08a00',
      valueColor: '#f08a00',
    },
    pending: {
      bg: '#fffaf2',
      iconBg: '#fff4e6',
      iconColor: '#d68a00',
      valueColor: '#d68a00',
    },
    progress: {
      bg: '#f3f8ff',
      iconBg: '#ecf4ff',
      iconColor: '#1f7ae0',
      valueColor: '#1f7ae0',
    },
    completed: {
      bg: '#f2fff7',
      iconBg: '#e8fff1',
      iconColor: '#1ea95f',
      valueColor: '#1ea95f',
    },
  };
  const tone = themeByType[type] || themeByType.total;

  return (
    <View style={[styles.statCard, { backgroundColor: tone.bg }]}>
      <View style={styles.statRow}>
        <View style={styles.statIconColumn}>
          <View style={styles.statIconWrap}>
            <Ionicons name={icon} style={styles.statIcon} color={tone.iconColor} />
          </View>
        </View>
        <View style={styles.statTextColumn}>
          <View style={styles.statCaretRow}>
            <Ionicons name="chevron-forward" size={15} color="#a7a7a7" />
          </View>
          <Text style={[styles.statValue, { color: tone.valueColor }]}>{value}</Text>
          <Text style={styles.statLabel}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f8',
  },
  content: {
    paddingHorizontal: 16,
  },
  greeting: {
    fontSize: typography.sm,
    color: '#8f8f8f',
    marginBottom: 2,
  },
  userName: {
    fontSize: typography.title,
    fontWeight: '700',
    color: '#141414',
  },
  subtitle: {
    marginTop: 2,
    marginBottom: 16,
    fontSize: typography.md,
    color: '#7f7f7f',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
  statCard: {
    width: '48.5%',
    borderRadius: 14,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    alignSelf: 'flex-start',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconColumn: {
    width: 46,
    alignItems: 'flex-start',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 32,
  },
  statTextColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  statCaretRow: {
    height: '100%',
    alignItems: 'flex-end',
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    lineHeight: 15,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: '#191919',
  },
  viewAll: {
    fontSize: typography.xs,
    color: '#ff9800',
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyImage: {
    width: 210,
    height: 210,
    marginBottom: 6,
  },
  emptyText: {
    color: '#777',
    marginBottom: 8,
  },
  retryBtn: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingHorizontal: 14,
    minHeight: touchTargets.buttonHeight,
    justifyContent: 'center',
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ececec',
    position: 'relative',
  },
  jobMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  jobLeftIconCol: {
    width: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 8,
  },
  jobContentCol: {
    flex: 1,
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  packageBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff4e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageIcon: {
    fontSize: 20,
    lineHeight: 20,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    minHeight: 0,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 10,
  },
  trackingId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b1b1b',
    flexShrink: 1,
    paddingRight: 8,
  },
  customerName: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  jobDateRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateIcon: {
    fontSize: 16,
    lineHeight: 16,
  },
  jobDate: {
    fontSize: 11,
    color: '#9a9a9a',
  },
  jobChevronWrap: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
