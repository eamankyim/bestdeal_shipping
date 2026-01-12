import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Searchbar,
  Chip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import { format } from 'date-fns';
import logger from '../../utils/logger';

export default function InvoicesScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      // TODO: Implement invoice API service
      logger.info('Loading invoices');
      // Placeholder - will be implemented with actual API
      setInvoices([]);
    } catch (error) {
      logger.error('Failed to load invoices', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#4caf50';
      case 'pending':
        return '#ff9800';
      case 'overdue':
        return '#f44336';
      default:
        return theme.colors.placeholder;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, { paddingTop: insets.top }]}>
        <Searchbar
          placeholder="Search invoices..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <View style={styles.filterContainer}>
          <Chip
            selected={statusFilter === null}
            onPress={() => setStatusFilter(null)}
            style={styles.filterChip}
          >
            All
          </Chip>
          <Chip
            selected={statusFilter === 'paid'}
            onPress={() => setStatusFilter('paid')}
            style={styles.filterChip}
          >
            Paid
          </Chip>
          <Chip
            selected={statusFilter === 'pending'}
            onPress={() => setStatusFilter('pending')}
            style={styles.filterChip}
          >
            Pending
          </Chip>
          <Chip
            selected={statusFilter === 'overdue'}
            onPress={() => setStatusFilter('overdue')}
            style={styles.filterChip}
          >
            Overdue
          </Chip>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredInvoices.length === 0 ? (
          <Card style={styles.card} elevation={0}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No invoices found
              </Text>
              <Text variant="bodySmall" style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Invoices will appear here'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => (
            <TouchableOpacity key={invoice.id}>
              <Card style={styles.card} elevation={0}>
                <Card.Content>
                  <View style={styles.invoiceHeader}>
                    <View>
                      <Text variant="titleMedium">{invoice.invoiceNumber}</Text>
                      <Text variant="bodySmall" style={styles.customerName}>
                        {invoice.customerName}
                      </Text>
                    </View>
                    <Chip
                      style={[
                        styles.statusChip,
                        { backgroundColor: getStatusColor(invoice.status) + '20' },
                      ]}
                      textStyle={{ color: getStatusColor(invoice.status) }}
                    >
                      {invoice.status?.toUpperCase()}
                    </Chip>
                  </View>
                  <View style={styles.invoiceDetails}>
                    <Text variant="bodyMedium" style={styles.amount}>
                      £{invoice.amount?.toFixed(2)}
                    </Text>
                    <Text variant="bodySmall" style={styles.date}>
                      {invoice.dueDate
                        ? format(new Date(invoice.dueDate), 'MMM dd, yyyy')
                        : 'N/A'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    backgroundColor: theme.colors.background,
  },
  searchbar: {
    ...standardStyles,
    elevation: 0,
    shadowOpacity: 0,
    marginBottom: spacing.sm,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    marginRight: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    ...standardStyles,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  customerName: {
    color: theme.colors.placeholder,
    marginTop: spacing.xs,
  },
  statusChip: {
    height: 28,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  amount: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  date: {
    color: theme.colors.placeholder,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    textAlign: 'center',
    color: theme.colors.placeholder,
  },
});

