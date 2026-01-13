import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Searchbar,
  Divider,
  Avatar,
  FAB,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { theme, spacing, touchTargets } from '../../theme/theme';
import logger from '../../utils/logger';

export default function CustomersScreen({ navigation }) {
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
      // TODO: Implement customer API service
      logger.info('Loading customers');
      // Placeholder - will be implemented with actual API
      setCustomers([]);
    } catch (error) {
      logger.error('Failed to load customers', error);
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

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderCustomerItem = ({ item, index }) => (
    <View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          // TODO: Navigate to customer details
        }}
        style={styles.customerItem}
      >
        <View style={styles.customerItemContent}>
          <Avatar.Text
            size={48}
            label={item.name?.charAt(0).toUpperCase() || 'C'}
            style={styles.avatar}
          />
          <View style={styles.customerItemLeft}>
            <Text style={styles.customerName}>{item.name || 'Unknown'}</Text>
            <Text style={styles.customerEmail} numberOfLines={1}>
              {item.email || 'No email'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#c7c7cc" />
        </View>
      </TouchableOpacity>
      {index < filteredCustomers.length - 1 && <Divider style={styles.divider} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: insets.top }]}>
        <Searchbar
          placeholder="Search customers..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No customers found' : 'No customers'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try adjusting your search' : 'Customers will appear here'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      
      {/* Floating Action Button for Add Customer */}
      {(user?.role === 'admin' || user?.role === 'customer-service') && (
        <FAB
          icon="plus"
          style={[styles.fab, { bottom: insets.bottom + spacing.md }]}
          onPress={() => {
            // TODO: Navigate to CreateCustomer screen when implemented
            Alert.alert('Coming Soon', 'Create Customer feature coming soon');
          }}
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
  customerItem: {
    backgroundColor: theme.colors.surface,
  },
  customerItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: touchTargets.listItemHeight,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
    marginRight: spacing.md,
  },
  customerItemLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  customerName: {
    fontWeight: '600',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  customerEmail: {
    color: theme.colors.placeholder,
    fontSize: 14,
  },
  divider: {
    marginLeft: spacing.md + 48 + spacing.md, // Align with content (avatar + margin)
    backgroundColor: theme.colors.divider,
  },
  emptyContainer: {
    paddingVertical: spacing.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
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

