import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { spacing } from '../../theme/theme';
import logger from '../../utils/logger';
import { customerService } from '../../services/customerService';
import SearchBellHeader from '../../components/common/SearchBellHeader';

export default function CustomersScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      logger.info('Loading customers');
      const response = await customerService.getCustomers({ limit: 100 });
      const list =
        response?.data?.customers ||
        response?.data?.data?.customers ||
        response?.data?.data ||
        response?.customers ||
        response?.data ||
        [];
      setCustomers(Array.isArray(list) ? list : []);
    } catch (error) {
      logger.error('Failed to load customers', error);
      setCustomers([]);
      Alert.alert('Error', 'Failed to load customers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCustomerItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.customerCard}
      onPress={() => Alert.alert('Customer', `${item.name || 'Unnamed customer'}`)}
    >
      <View style={styles.customerTopRow}>
        <View style={styles.avatarWrap}>
          <Ionicons name="person-outline" size={18} color="#ff9800" />
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.name || 'Unnamed customer'}</Text>
          <Text style={styles.customerEmail}>{item.email || 'No email'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#b8b8b8" />
      </View>
      <View style={styles.customerMetaRow}>
        <Text style={styles.customerMetaText}>{item.phone || 'No phone'}</Text>
        <Text style={styles.customerMetaText}>
          {(item._count?.jobs ?? item.jobsCount ?? 0)} jobs
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBellHeader
        topInset={insets.top + 8}
        placeholder="Search customers..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item, index) => item.id || item.email || `customer-${index}`}
        renderItem={renderCustomerItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Image
              source={require('../../../assets/no-customers.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />

            <Text style={styles.emptyTitle}>No customers yet</Text>
            <Text style={styles.emptySub}>Add your first customer to get started and manage your shipments</Text>

            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.85}
              onPress={() => Alert.alert('Coming Soon', 'Create Customer feature coming soon')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add New Customer</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      />

      {(user?.role === 'admin' || user?.role === 'customer-service') && (
        <FAB
          icon="plus"
          style={[styles.fab, { right: spacing.md, bottom: insets.bottom + 88 }]}
          onPress={() => Alert.alert('Coming Soon', 'Create Customer feature coming soon')}
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
    backgroundColor: '#fafafa',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  customerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#efefef',
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
  },
  customerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff4e8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#141414',
  },
  customerEmail: {
    marginTop: 2,
    fontSize: 12,
    color: '#777',
  },
  customerMetaRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f4f4f4',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerMetaText: {
    fontSize: 12,
    color: '#8b8b8b',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyImage: {
    width: 270,
    height: 270,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  emptySub: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8b8b8b',
    lineHeight: 20,
    marginBottom: 20,
  },
  addButton: {
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ff9800',
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    backgroundColor: '#ff9800',
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    zIndex: 1000,
  },
});
