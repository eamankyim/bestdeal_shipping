import useScreenRefresh from '../../hooks/useScreenRefresh';
import { hasAdminAccess } from '../../utils/permissions';
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  FAB,
  TextInput,
  Button,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { spacing } from '../../theme/theme';
import logger from '../../utils/logger';
import { customerService } from '../../services/customerService';
import SearchBellHeader from '../../components/common/SearchBellHeader';
import ThreeDotsLoader from '../../components/common/ThreeDotsLoader';

export default function CustomersScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    customerType: 'Individual',
  });



  const resetCustomerForm = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      customerType: 'Individual',
    });
  };

  const validateCustomerForm = () => {
    if (!customerForm.name?.trim()) {
      Alert.alert('Missing customer name', 'Please add the customer name before saving.');
      return false;
    }
    if (!customerForm.phone?.trim()) {
      Alert.alert('Missing phone number', 'Please add the customer phone number so we can contact them.');
      return false;
    }
    if (customerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerForm.email)) {
      Alert.alert('Invalid email', 'Please use a valid email address or leave it blank.');
      return false;
    }
    if (!customerForm.address?.trim()) {
      Alert.alert('Missing address', 'Please add the customer address before creating the record.');
      return false;
    }
    return true;
  };

  const handleCreateCustomer = async () => {
    if (!validateCustomerForm()) return;

    setCreatingCustomer(true);
    try {
      const payload = {
        name: customerForm.name.trim(),
        email: customerForm.email.trim() || undefined,
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        customerType: customerForm.customerType,
      };

      if (editingCustomer) await customerService.updateCustomer(editingCustomer.id, payload);
      else await customerService.createCustomer(payload);
      Alert.alert('Success', 'Customer saved successfully.');
      setCreateModalVisible(false);
      resetCustomerForm();
      await loadCustomers();
    } catch (error) {
      const message = error?.response?.data?.message || 'We could not create this customer right now. Please try again.';
      Alert.alert('Could not create customer', message);
    } finally {
      setCreatingCustomer(false);
    }
  };

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

  useScreenRefresh(loadCustomers);

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
      onPress={() => {
        if (!hasAdminAccess(user)) return Alert.alert(item.name || 'Customer', [item.email, item.phone, item.address].filter(Boolean).join('\n'));
        Alert.alert(item.name || 'Customer', [item.email, item.phone, item.address].filter(Boolean).join('\n'), [
          { text: 'Close' },
          { text: 'Edit', onPress: () => { setEditingCustomer(item); setCustomerForm({ name: item.name || '', email: item.email || '', phone: item.phone || '', address: item.address || '', customerType: item.customerType || 'Individual' }); setCreateModalVisible(true); } },
          { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Delete customer?', 'Customers with jobs may not be deleted.', [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
            try { await customerService.deleteCustomer(item.id); await loadCustomers(); } catch (error) { Alert.alert('Error', error.response?.data?.message || error.message); }
          } }]) },
        ]);
      }}
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
        <ThreeDotsLoader />
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
              onPress={() => { resetCustomerForm(); setCreateModalVisible(true); }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add New Customer</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      />

      {(hasAdminAccess(user)) && (
        <FAB
          icon="plus"
          style={[styles.fab, { right: spacing.md, bottom: insets.bottom + 88 }]}
          onPress={() => { resetCustomerForm(); setCreateModalVisible(true); }}
          color="#ffffff"
          customSize={56}
        />
      )}

      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCustomer ? 'Edit customer' : 'Add customer'}</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={22} color="#444" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                label="Customer name"
                value={customerForm.name}
                onChangeText={(value) => setCustomerForm((prev) => ({ ...prev, name: value }))}
                mode="outlined"
                style={styles.modalInput}
              />

              <TextInput
                label="Phone number"
                value={customerForm.phone}
                onChangeText={(value) => setCustomerForm((prev) => ({ ...prev, phone: value }))}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.modalInput}
              />

              <TextInput
                label="Email (optional)"
                value={customerForm.email}
                onChangeText={(value) => setCustomerForm((prev) => ({ ...prev, email: value }))}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.modalInput}
              />

              <TextInput
                label="Address"
                value={customerForm.address}
                onChangeText={(value) => setCustomerForm((prev) => ({ ...prev, address: value }))}
                mode="outlined"
                multiline
                style={styles.modalInput}
              />

              <TextInput
                label="Customer type"
                value={customerForm.customerType}
                onChangeText={(value) => setCustomerForm((prev) => ({ ...prev, customerType: value || 'Individual' }))}
                mode="outlined"
                style={styles.modalInput}
              />

              <View style={styles.modalActions}>
                <Button mode="text" onPress={() => {
                  setCreateModalVisible(false);
                  resetCustomerForm();
                }}>
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateCustomer}
                  loading={creatingCustomer}
                  disabled={creatingCustomer}
                  buttonColor="#ff9800"
                >
                  Save customer
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  modalInput: {
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
});
