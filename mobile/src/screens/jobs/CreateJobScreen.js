import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { TextInput, Button, Text, Menu, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { jobService } from '../../services/jobService';
import { PRIORITY_LEVELS, FREIGHT_TYPES, JOB_STATUSES } from '../../config/constants';
import DropdownWithOther from '../../components/common/DropdownWithOther';
import { touchTargets, typography } from '../../theme/theme';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../hooks/useAuth';
import { canEditJobValue } from '../../utils/permissions';

const STEPS = ['Job Details', 'Customer', 'Receiver', 'Package', 'Review'];

export default function CreateJobScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const editingJob = route?.params?.job;
  const editingDraft = String(editingJob?.status || '').toLowerCase() === 'draft';
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerMode, setCustomerMode] = useState('existing');
  const [customerDropdownVisible, setCustomerDropdownVisible] = useState(false);
  const [formData, setFormData] = useState({
    referenceNumber: editingJob?.referenceNumber || '',
    pickupAddress: editingJob?.pickupAddress || '',
    deliveryAddress: editingJob?.deliveryAddress || '',
    pickupDate: editingJob?.pickupDate || '',

    customerName: editingJob?.customer?.name || '',
    customerEmail: editingJob?.customer?.email || '',
    customerPhone: editingJob?.customer?.phone || '',
    customerId: editingJob?.customer?.id || '',
    customerCity: editingJob?.customer?.city || '',
    customerCountry: editingJob?.customer?.country || 'United Kingdom',
    customerType: editingJob?.customer?.customerType || 'Individual',
    customerAddress: editingJob?.customer?.address || '',

    receiverName: editingJob?.receiverName || '',
    receiverAddress: editingJob?.receiverAddress || '',
    receiverPhone: editingJob?.receiverContact || editingJob?.receiverPhone || '',

    description: editingJob?.description || editingJob?.parcelDetails?.description || '',
    freightType: editingJob ? editingJob.freightType || '' : FREIGHT_TYPES.AIR,
    estimatedPrice: editingJob?.value != null ? String(editingJob.value) : '',
    priority: editingJob?.priority || PRIORITY_LEVELS.STANDARD,
  });

  const canGoBack = currentStep > 0;
  const isReviewStep = currentStep === STEPS.length - 1;

  // Reload on every focus, not just first mount, so a customer created
  // moments ago (e.g. while creating the previous job) shows up in the
  // "Existing customer" list right away.
  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [])
  );

  useEffect(() => {
    navigation.setOptions({ title: editingJob ? 'Edit Job' : 'Create Job' });
    if (editingJob?.customer?.id) {
      setCustomerMode('existing');
    }
  }, [editingJob]);

  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+(\.[^\s@]+)*@[^\s@]+(\.[^\s@]+)*\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const showValidationError = (title, message) => {
    Alert.alert(title, message);
  };

  // The backend returns { message, errors: [{ field, message }] } on
  // validation failures (400s). Surface the actual per-field messages
  // instead of the generic "Validation failed" summary.
  const getErrorMessage = (payload) => {
    const errors = payload?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map((e) => e.message || e.msg).filter(Boolean).join('\n');
    }
    return payload?.message || 'Please check the job details and try again.';
  };

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
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
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const selectExistingCustomer = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer.id || '',
      customerName: customer.name || '',
      customerEmail: customer.email || '',
      customerPhone: customer.phone || '',
    }));
    setCustomerDropdownVisible(false);
  };

  const switchCustomerMode = (mode) => {
    setCustomerMode(mode);
    if (mode === 'new') {
      setFormData((prev) => ({ ...prev, customerId: '' }));
    }
  };

  const validateStep = (stepIndex) => {
    // When editing, a blank field simply keeps its saved value, so nothing is required
    if (editingJob) return true;

    if (stepIndex === 0) {
      if (!formData.referenceNumber?.trim()) {
        showValidationError('Reference number needed', 'Please add a reference number so the job can be identified.');
        return false;
      }
      if (!formData.pickupAddress?.trim() || !formData.deliveryAddress?.trim()) {
        showValidationError('Address missing', 'Please add both the pickup and delivery addresses before continuing.');
        return false;
      }
    }

    if (stepIndex === 1) {
      if (customerMode === 'existing') {
        if (!formData.customerId) {
          showValidationError('Choose a customer', 'Please select a customer before continuing.');
          return false;
        }
      } else {
        if (!formData.customerName?.trim()) {
          showValidationError('Customer name required', 'Please add the customer name.');
          return false;
        }
        if (!formData.customerPhone?.trim()) {
          showValidationError('Phone number required', 'Please add the customer phone number.');
          return false;
        }
        if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
          showValidationError('Valid email required', 'Please enter a valid email address or leave it blank.');
          return false;
        }
        if (!formData.customerCity?.trim()) {
          showValidationError('Customer city required', 'Please add the customer city.');
          return false;
        }
        if (!formData.customerAddress?.trim()) {
          showValidationError('Address required', 'Please add the customer address before continuing.');
          return false;
        }
      }
    }

    if (stepIndex === 2) {
      if (!formData.receiverName?.trim()) {
        showValidationError('Receiver name required', 'Please add the receiver name before continuing.');
        return false;
      }
      if (!formData.receiverAddress?.trim()) {
        showValidationError('Receiver address required', 'Please add the receiver address before continuing.');
        return false;
      }
    }

    if (stepIndex === 3) {
      if (!formData.description?.trim()) {
        showValidationError('Package details needed', 'Please describe the package(s) before creating the job.');
        return false;
      }
    }

    return true;
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const goBack = () => {
    if (canGoBack) setCurrentStep((prev) => prev - 1);
  };

  const isCurrentStepValid = useMemo(() => {
    if (editingJob) return true;

    if (currentStep === 0) {
      return !!formData.referenceNumber?.trim() && !!formData.pickupAddress?.trim() && !!formData.deliveryAddress?.trim();
    }

    if (currentStep === 1) {
      if (customerMode === 'existing') {
        return !!formData.customerId;
      }
      const hasRequired =
        !!formData.customerName?.trim() &&
        !!formData.customerPhone?.trim() &&
        !!formData.customerCity?.trim() &&
        !!formData.customerAddress?.trim();
      const emailOk = !formData.customerEmail || validateEmail(formData.customerEmail);
      return hasRequired && emailOk;
    }

    if (currentStep === 2) {
      return !!formData.receiverName?.trim() && !!formData.receiverAddress?.trim();
    }

    return true;
  }, [currentStep, formData, customerMode]);

  const reviewItems = useMemo(() => {
    const items = [
      { label: 'Reference Number', value: formData.referenceNumber || '-' },
      { label: 'Pickup Address', value: formData.pickupAddress || '-' },
      { label: 'Delivery Address', value: formData.deliveryAddress || '-' },
      { label: 'Freight Type', value: formData.freightType || '-' },
      { label: 'Customer Name', value: formData.customerName || '-' },
    ];

    if (formData.customerPhone) items.push({ label: 'Customer Phone', value: formData.customerPhone });
    if (formData.customerEmail) items.push({ label: 'Customer Email', value: formData.customerEmail });
    if (customerMode === 'new') {
      if (formData.customerCity) items.push({ label: 'Customer City', value: formData.customerCity });
      if (formData.customerAddress) items.push({ label: 'Customer Address', value: formData.customerAddress });
    }

    items.push({ label: 'Receiver Name', value: formData.receiverName || '-' });
    items.push({ label: 'Receiver Address', value: formData.receiverAddress || '-' });
    if (formData.receiverPhone) items.push({ label: 'Receiver Phone', value: formData.receiverPhone });

    items.push({ label: 'Package Details', value: formData.description || '-' });
    if (formData.estimatedPrice) {
      items.push({ label: 'Estimated Value', value: `£${Number(formData.estimatedPrice).toFixed(2)}` });
    }

    items.push({ label: 'Priority', value: formData.priority || '-' });
    return items;
  }, [formData, customerMode]);

  const handleSubmit = async (isDraft = false) => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !(isDraft || validateStep(3))) return;

    if (isDraft) {
      setSavingDraft(true);
    } else {
      setLoading(true);
    }

    try {
      const jobData = {
        referenceNumber: formData.referenceNumber.trim(),
        ...(customerMode === 'existing' && formData.customerId
          ? { customerId: formData.customerId }
          : {
              newCustomer: {
                name: formData.customerName,
                email: formData.customerEmail || undefined,
                phone: formData.customerPhone?.trim() || undefined,
                city: formData.customerCity?.trim() || undefined,
                country: formData.customerCountry || undefined,
                customerType: formData.customerType || 'Individual',
                address: formData.customerAddress?.trim() || formData.pickupAddress,
              },
            }),
        receiverName: formData.receiverName,
        receiverAddress: formData.receiverAddress,
        receiverPhone: formData.receiverPhone?.trim() || null,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        pickupDate: formData.pickupDate || (editingJob ? undefined : new Date().toISOString()),
        freightType: formData.freightType,
        parcelDetails: {
          description: formData.description,
          value: Number(formData.estimatedPrice) || undefined,
        },
        priority: formData.priority,
        status: isDraft ? JOB_STATUSES.DRAFT : editingDraft ? JOB_STATUSES.PENDING_COLLECTION : undefined,
      };

      let response;
      if (editingJob) {
        response = await jobService.updateJob(editingJob.id, jobData);
      } else {
        response = await jobService.createJob(jobData);
      }

      if (response?.success || response?.status === 'success' || response?.data?.success) {
        const resolvedJobId =
          response?.data?.job?.id ||
          response?.data?.data?.job?.id ||
          editingJob?.id;

        Alert.alert(
          'Success',
          isDraft ? 'Your job draft has been saved.' : editingJob ? 'Job updated successfully!' : 'Job created successfully!',
          [
            {
              text: 'OK',
              onPress: () =>
                resolvedJobId
                  ? navigation.navigate('Jobs', {
                      screen: 'JobDetail',
                      params: { jobId: resolvedJobId },
                    })
                  : navigation.navigate('Jobs'),
            },
          ]
        );
      } else {
        Alert.alert('Could not save job', getErrorMessage(response));
      }
    } catch (error) {
      if (error?.response?.data) {
        Alert.alert('Could not save job', getErrorMessage(error.response.data));
      } else {
        Alert.alert('Could not save job', error?.message || 'Please check the job details and try again.');
      }
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.section}>
            <Text style={styles.label}>Reference number</Text>
            <TextInput
              mode="outlined"
              value={formData.referenceNumber}
              onChangeText={(value) => updateField('referenceNumber', value)}
              placeholder="e.g. JOB-1001"
              style={styles.input}
            />

            <Text style={styles.label}>Pickup address</Text>
            <TextInput
              mode="outlined"
              value={formData.pickupAddress}
              onChangeText={(value) => updateField('pickupAddress', value)}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 12 High Street, London, UK"
            />

            <Text style={styles.label}>Delivery address</Text>
            <TextInput
              mode="outlined"
              value={formData.deliveryAddress}
              onChangeText={(value) => updateField('deliveryAddress', value)}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="e.g. 45 Market Road, Accra, Ghana"
            />

            <Text style={styles.label}>Freight type</Text>
            <DropdownWithOther
              value={formData.freightType}
              options={[FREIGHT_TYPES.AIR, FREIGHT_TYPES.SEA, FREIGHT_TYPES.OTHER]}
              onValueChange={(value) => updateField('freightType', value)}
              placeholder="Select freight type"
            />

          </View>
        );

      case 1:
        return (
          <View style={styles.section}>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                style={[styles.segmentButton, customerMode === 'existing' && styles.segmentButtonActive]}
                onPress={() => switchCustomerMode('existing')}
              >
                <Text style={[styles.segmentText, customerMode === 'existing' && styles.segmentTextActive]}>Existing customer</Text>
              </TouchableOpacity>
              {!editingJob && (
                <TouchableOpacity
                  style={[styles.segmentButton, customerMode === 'new' && styles.segmentButtonActive]}
                  onPress={() => switchCustomerMode('new')}
                >
                  <Text style={[styles.segmentText, customerMode === 'new' && styles.segmentTextActive]}>New customer</Text>
                </TouchableOpacity>
              )}
            </View>

            {customerMode === 'existing' ? (
              <>
                {loadingCustomers ? (
                  <ActivityIndicator style={styles.loader} />
                ) : (
                  <Menu
                    visible={customerDropdownVisible}
                    onDismiss={() => setCustomerDropdownVisible(false)}
                    anchor={
                      <Button mode="outlined" onPress={() => setCustomerDropdownVisible(true)}>
                        {formData.customerName || 'Select customer'}
                      </Button>
                    }
                  >
                    {customers.length > 0 ? (
                      customers.map((customer) => (
                        <Menu.Item
                          key={customer.id}
                          onPress={() => selectExistingCustomer(customer)}
                          title={customer.name || 'Customer'}
                        />
                      ))
                    ) : (
                      <Menu.Item onPress={() => setCustomerDropdownVisible(false)} title="No customers available" disabled />
                    )}
                  </Menu>
                )}
              </>
            ) : (
              <>
                <Text style={styles.label}>Customer name</Text>
                <TextInput mode="outlined" value={formData.customerName} onChangeText={(value) => updateField('customerName', value)} style={styles.input} placeholder="e.g. Jane Mensah" />

                <Text style={styles.label}>Phone number</Text>
                <TextInput mode="outlined" value={formData.customerPhone} onChangeText={(value) => updateField('customerPhone', value)} keyboardType="phone-pad" style={styles.input} placeholder="e.g. +44 7700 900000" />

                <Text style={styles.label}>Email address</Text>
                <TextInput mode="outlined" value={formData.customerEmail} onChangeText={(value) => updateField('customerEmail', value)} keyboardType="email-address" style={styles.input} placeholder="Optional" />

                <Text style={styles.label}>City</Text>
                <TextInput mode="outlined" value={formData.customerCity} onChangeText={(value) => updateField('customerCity', value)} style={styles.input} placeholder="e.g. London" />

                <Text style={styles.label}>Address</Text>
                <TextInput mode="outlined" value={formData.customerAddress} onChangeText={(value) => updateField('customerAddress', value)} multiline style={[styles.input, styles.textArea]} placeholder="Street address" />
              </>
            )}
          </View>
        );

      case 2:
        return (
          <View style={styles.section}>
            <Text style={styles.label}>Receiver name</Text>
            <TextInput mode="outlined" value={formData.receiverName} onChangeText={(value) => updateField('receiverName', value)} style={styles.input} placeholder="e.g. Kwame Boateng" />

            <Text style={styles.label}>Receiver address</Text>
            <TextInput mode="outlined" value={formData.receiverAddress} onChangeText={(value) => updateField('receiverAddress', value)} multiline style={[styles.input, styles.textArea]} placeholder="Street address" />

            <Text style={styles.label}>Receiver phone</Text>
            <TextInput mode="outlined" value={formData.receiverPhone} onChangeText={(value) => updateField('receiverPhone', value)} keyboardType="phone-pad" style={styles.input} placeholder="Optional" />
          </View>
        );

      case 3:
        return (
          <View style={styles.section}>
            <Text style={styles.label}>Package details</Text>
            <TextInput
              mode="outlined"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              style={[styles.input, styles.textArea]}
              placeholder="Describe the packages: type, quantity, approximate weight, contents..."
            />

            {canEditJobValue(user) && (
              <>
                <Text style={styles.label}>Estimated value</Text>
                <TextInput
                  mode="outlined"
                  value={formData.estimatedPrice}
                  onChangeText={(value) => updateField('estimatedPrice', value)}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholder="Optional"
                />
              </>
            )}

            <Text style={styles.label}>Priority</Text>
            <DropdownWithOther
              value={formData.priority}
              options={[PRIORITY_LEVELS.STANDARD, PRIORITY_LEVELS.EXPRESS, PRIORITY_LEVELS.URGENT, PRIORITY_LEVELS.OTHER]}
              onValueChange={(value) => updateField('priority', value)}
              placeholder="Select priority"
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.section}>
            {reviewItems.map((item) => (
              <View key={item.label} style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{item.label}</Text>
                <Text style={styles.reviewValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top + 76}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>{editingJob ? 'Edit Job' : 'Create Job'}</Text>
        </View>

        <View style={styles.stepIndicatorRow}>
          <Text style={styles.stepLabel}>
            Step {currentStep + 1} of {STEPS.length}
          </Text>
          <Text style={styles.stepName}>{STEPS[currentStep]}</Text>
        </View>

        {editingJob && (
          <Text style={styles.editHint}>
            Nothing is deleted when you edit. A field left blank keeps its saved value.
          </Text>
        )}

        {renderStepContent()}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        {canGoBack && (
          <Button mode="outlined" onPress={goBack} style={styles.footerButton}>
            Back
          </Button>
        )}

        {!isReviewStep ? (
          <Button
            mode="contained"
            onPress={goNext}
            style={styles.footerButton}
            disabled={!isCurrentStepValid}
            loading={loading}
          >
            Next
          </Button>
        ) : (
          <>
            {(!editingJob || editingDraft) && (
              <Button
                mode="outlined"
                onPress={() => handleSubmit(true)}
                style={styles.footerButton}
                loading={savingDraft}
              >
                Save as Draft
              </Button>
            )}
            <Button
              mode="contained"
              onPress={() => handleSubmit(false)}
              style={styles.footerButton}
              loading={loading}
            >
              {editingJob && !editingDraft ? 'Save Changes' : 'Create Job'}
            </Button>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: touchTargets.touchable,
    height: touchTargets.touchable,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: '#111827',
  },
  stepIndicatorRow: {
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stepName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  editHint: {
    color: '#6b7280',
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  label: {
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 90,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  segmentButtonActive: {
    backgroundColor: '#ffedd5',
  },
  segmentText: {
    color: '#374151',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#c2410c',
  },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  packageText: {
    flex: 1,
    color: '#111827',
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: 8,
  },
  packageInputRow: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 12,
  },
  packageInput: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  packageWeightInput: {
    width: 110,
    backgroundColor: '#fff',
  },
  addPackageButton: {
    marginTop: 8,
  },
  reviewRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  reviewLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  reviewValue: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 22,
  },
  loader: {
    marginVertical: 24,
  },
});
