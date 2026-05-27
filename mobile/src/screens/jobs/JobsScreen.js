import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { statusColors, spacing, touchTargets, typography } from '../../theme/theme';
import { format } from 'date-fns';
import SearchBellHeader from '../../components/common/SearchBellHeader';

const TABS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function JobsScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const filters = getUserFilters();
      filters.limit = 50;
      const response = await jobService.getJobs(filters);

      if (response.success) {
        const raw = response.data?.data || response.data || [];
        setJobs(Array.isArray(raw) ? raw : []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getUserFilters = () => {
    const role = user?.role;
    if (role === 'driver') return { assignedDriverId: user.id };
    if (role === 'delivery_agent') return { status: 'Out for Delivery' };
    if (role === 'warehouse_staff') return { status: 'At Warehouse' };
    return {};
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const normalize = (text) => (text || '').toLowerCase().trim().replace(/_/g, ' ');

  const getStatusTone = (status) => {
    const normalized = normalize(status);
    if (normalized.includes('ready for delivery')) return { bg: '#f0e9ff', text: '#7a45d1' };
    if (normalized.includes('delivered') || normalized.includes('completed') || normalized.includes('closed')) {
      return { bg: '#e8f8ed', text: '#23a455' };
    }
    if (normalized.includes('in progress') || normalized.includes('out for delivery') || normalized.includes('en route')) {
      return { bg: '#e8f1ff', text: '#1f7ae0' };
    }
    if (normalized.includes('pending') || normalized.includes('assigned')) {
      return { bg: '#fff4df', text: '#d99000' };
    }
    return { bg: statusColors[status] ? `${statusColors[status]}22` : '#efefef', text: '#666' };
  };

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const matchesSearch =
          (job.trackingId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (job.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        const st = normalize(job.status);
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return st.includes('pending') || st.includes('assigned');
        if (activeTab === 'in_progress') {
          return st.includes('in progress') || st.includes('ready for delivery') || st.includes('out for delivery') || st.includes('en route');
        }
        if (activeTab === 'completed') return st.includes('delivered') || st.includes('completed') || st.includes('closed');
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [jobs, searchQuery, activeTab]);

  const extractCity = (address) => {
    if (!address) return 'Unknown location';
    const parts = address.split(',').map((x) => x.trim()).filter(Boolean);
    return parts.length > 1 ? parts[parts.length - 2] : parts[0];
  };

  const renderJobItem = ({ item }) => {
    const tone = getStatusTone(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
        style={styles.jobCard}
      >
        <View style={styles.jobMainRow}>
          <View style={styles.jobLeftIconCol}>
            <View style={styles.packageBadge}>
              <Ionicons name="cube-outline" style={styles.packageIcon} color="#ff9800" />
            </View>
          </View>

          <View style={styles.jobContentCol}>
            <View style={styles.jobTopRow}>
              <Text style={styles.trackingId}>{item.trackingId}</Text>
              <Chip style={[styles.statusChip, { backgroundColor: tone.bg }]} textStyle={[styles.statusText, { color: tone.text }]}> 
                {item.status}
              </Chip>
            </View>

            <Text style={styles.customerName}>{item.customer?.name || 'Unknown customer'}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" style={styles.metaIcon} color="#8f8f8f" />
              <Text style={styles.locationText}>{extractCity(item.pickupAddress)}</Text>
            </View>

            <View style={styles.jobDateRow}>
              <Ionicons name="calendar-outline" style={styles.metaIcon} color="#9a9a9a" />
              <Text style={styles.jobDate}>{format(new Date(item.createdAt), 'MMM dd, yyyy')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.jobChevronWrap}>
          <Ionicons name="chevron-forward" size={18} color="#a7a7a7" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && jobs.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBellHeader
        topInset={insets.top + 8}
        placeholder="Search for jobs"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.tabPillWrap}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={styles.tabBtn} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
              {active && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loadError ? (
              <>
                <Image
                  source={require('../../../assets/something-went-wrong.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyText}>Something went wrong</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadJobs} activeOpacity={0.85}>
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
                <Text style={styles.emptyText}>No jobs found</Text>
              </>
            )}
          </View>
        }
      />

      {(user?.role === 'admin' || user?.role === 'customer-service') && (
        <FAB
          icon="plus"
          style={[styles.fab, { right: spacing.md, bottom: insets.bottom + 88 }]}
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
    backgroundColor: '#f6f6f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f8',
  },
  tabPillWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ececec',
    paddingVertical: 2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    position: 'relative',
  },
  tabLabel: {
    fontSize: typography.xs,
    color: '#686868',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#d79000',
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    width: 64,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#d79000',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 110,
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
    paddingRight: 22,
  },
  jobLeftIconCol: {
    width: 34,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 8,
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
  jobContentCol: {
    flex: 1,
  },
  jobTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  trackingId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b1b1b',
    flexShrink: 1,
    paddingRight: 8,
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
  customerName: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
  locationRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 11,
    color: '#8d8d8d',
  },
  jobDateRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaIcon: {
    fontSize: 15,
    lineHeight: 15,
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
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImage: {
    width: 250,
    height: 250,
    marginBottom: 8,
  },
  emptyText: {
    color: '#8a8a8a',
    fontSize: typography.md,
    fontWeight: '500',
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
  fab: {
    position: 'absolute',
    backgroundColor: '#ff9800',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    zIndex: 1000,
  },
});
