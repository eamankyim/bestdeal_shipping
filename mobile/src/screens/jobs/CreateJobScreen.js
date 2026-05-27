import React, { useEffect, useMemo, useState } from 'react';
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

const STEPS = ['Job Details', 'Customer', 'Receiver', 'Package', 'Review'];

export default function CreateJobScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const editingJob = route?.params?.job;
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
    receiverPhone: editingJob?.receiverPhone || '',

    description: editingJob?.parcelDetails?.description || '',
    freightType: editingJob?.freightType || FREIGHT_TYPES.AIR,
    weight: editingJob?.weight || '',
    length: editingJob?.parcelDetails?.dimensions?.length || '',
    width: editingJob?.parcelDetails?.dimensions?.width || '',
    height: editingJob?.parcelDetails?.dimensions?.height || '',
    estimatedPrice: editingJob?.value || '',
    priority: editingJob?.priority || PRIORITY_LEVELS.STANDARD,
  });

  const canGoBack = currentStep > 0;
  const isReviewStep = currentStep === STEPS.length - 1;

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (editingJob?.customer?.id) {
      setCustomerMode('existing');
    }
  }, [editingJob]);

  const validateEmail = (email) => {
    if (!email) return true;
    const emailRegex = /^[^\s@]+(\.[^\s@]+)*@[^\s@]+(\.[^\s@]+)*\.[^\s@]+$/;
    return emailRegex.test(email);
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
    if (stepIndex === 0) {
      if (!formData.referenceNumber) {
        Alert.alert('Required', 'Reference number is required');
        return false;
      }
      if (!formData.pickupAddress || !formData.deliveryAddress) {
        Alert.alert('Required', 'Pickup and delivery addresses are required');
        return false;
      }
    }

    if (stepIndex === 1) {
      if (customerMode === 'existing') {
        if (!formData.customerId) {
          Alert.alert('Required', 'Please select a customer');
          return false;
        }
      } else {
        if (!formData.customerName) {
          Alert.alert('Required', 'Customer name is required');
          return false;
        }
        if (!formData.customerPhone?.trim()) {
          Alert.alert('Required', 'Customer phone is required');
          return false;
        }
        if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
          return false;
        }
        if (!formData.customerCity?.trim()) {
          Alert.alert('Required', 'Customer city is required');
          return false;
        }
        if (!formData.customerAddress?.trim()) {
          Alert.alert('Required', 'Customer address is required');
          return false;
        }
      }
    }

    if (stepIndex === 3) {
      if (formData.freightType === FREIGHT_TYPES.SEA && (!formData.length || !formData.width || !formData.height)) {
        Alert.alert('Required', 'Dimensions are required for sea freight');
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

    if (currentStep === 3 && formData.freightType === FREIGHT_TYPES.SEA) {
      return !!formData.length?.trim() && !!formData.width?.trim() && !!formData.height?.trim();
    }

    return true;
  }, [currentStep, formData, customerMode]);

  const reviewItems = useMemo(
    () => [
      { label: 'Reference Number', value: formData.referenceNumber || '-' },
      { label: 'Customer', value: formData.customerName || '-' },
      { label: 'Receiver', value: formData.receiverName || '-' },
      { label: 'Pickup', value: formData.pickupAddress || '-' },
      { label: 'Delivery', value: formData.deliveryAddress || '-' },
      { label: 'Freight Type', value: formData.freightType || '-' },
      {
        label: 'Package',
        value:
          formData.freightType === FREIGHT_TYPES.SEA
            ? `${formData.length || '-'} x ${formData.width || '-'} x ${formData.height || '-'} cm`
            : `${formData.weight || '-'} kg`,
      },
      { label: 'Priority', value: formData.priority || '-' },
    ],
    [formData]
  );

  const handleSubmit = async (isDraft = false) => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(3)) return;

    if (isDraft) {
      setSavingDraft(true);
    } else {
      setLoading(true);
    }

    try {
      const jobData = {
        referenceNumber: formData.referenceNumber,
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
        pickupDate: formData.pickupDate || new Date().toISOString(),
        freightType: formData.freightType,
        parcelDetails: {
          description: formData.description,
          weight: formData.freightType === FREIGHT_TYPES.AIR ? parseFloat(formData.weight) : undefined,
          dimensions:
            formData.freightType === FREIGHT_TYPES.SEA
              ? {
                  length: parseFloat(formData.length),
                  width: parseFloat(formData.width),
                  height: parseFloat(formData.height),
                }
              : undefined,
          value: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
          quantity: 1,
        },
        priority: formData.priority,
        status: isDraft ? JOB_STATUSES.DRAFT : undefined,
      };

      let response;
      if (editingJob) {
        response = await jobService.updateJob(editingJob.id, jobData);
      } else {
        response = await jobService.createJob(jobData);
      }

      if (response.success) {
        const resolvedJobId =
          response?.data?.job?.id ||
          response?.data?.data?.job?.id ||
          editingJob?.id;

        Alert.alert(
          'Success',
          isDraft ? 'Job saved as draft!' : editingJob ? 'Job updated successfully!' : 'Job created successfully!',
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
        Alert.alert('Error', response.message || 'Failed to save job');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save job');
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  };

  const renderStepIndicators = () => (
    <View style={styles.stepperWrap}>
      {STEPS.map((step, index) => {
        const active = currentStep === index;
        const completed = index < currentStep;
        return (
          <View key={step} style={styles.stepItem}>
            {index < STEPS.length - 1 && (
              <View style={[styles.stepConnector, completed && styles.stepConnectorDone]} />
            )}
            <View style={[styles.stepCircle, active && styles.stepCircleActive, completed && styles.stepCircleDone]}>
              <Text style={[styles.stepNumber, (active || completed) && styles.stepNumberActive]}>{index + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );

  const renderJobDetailsStep = () => (
    <View>
      <Text style={styles.sectionTitle}>Job Details</Text>
      <Text style={styles.sectionHint}>Enter basic job information</Text>

      <TextInput
        placeholder="Reference Number *"
        value={formData.referenceNumber}
        onChangeText={(text) => updateField('referenceNumber', text)}
        mode="outlined"
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <TextInput
        placeholder="Pickup Address *"
        value={formData.pickupAddress}
        onChangeText={(text) => updateField('pickupAddress', text)}
        mode="outlined"
        multiline
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <TextInput
        placeholder="Delivery Address *"
        value={formData.deliveryAddress}
        onChangeText={(text) => updateField('deliveryAddress', text)}
        mode="outlined"
        multiline
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <TextInput
        placeholder="Shipment Date"
        value={formData.pickupDate}
        onChangeText={(text) => updateField('pickupDate', text)}
        mode="outlined"
        placeholder="e.g. May 20, 2026"
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />
    </View>
  );

  const renderCustomerStep = () => (
    <View>
      <Text style={styles.sectionTitle}>Customer Information</Text>
      <Text style={styles.sectionHint}>Select an existing customer or add a new one</Text>

      <View style={styles.customerModeRow}>
        <Button
          mode={customerMode === 'existing' ? 'contained' : 'outlined'}
          onPress={() => switchCustomerMode('existing')}
          style={styles.customerModeBtn}
          buttonColor={customerMode === 'existing' ? '#ff9800' : undefined}
          textColor={customerMode === 'existing' ? '#fff' : '#666'}
          contentStyle={styles.uniformButtonContent}
          labelStyle={styles.uniformButtonLabel}
        >
          Select Customer
        </Button>
        <Button
          mode={customerMode === 'new' ? 'contained' : 'outlined'}
          onPress={() => switchCustomerMode('new')}
          style={styles.customerModeBtn}
          buttonColor={customerMode === 'new' ? '#ff9800' : undefined}
          textColor={customerMode === 'new' ? '#fff' : '#666'}
          contentStyle={styles.uniformButtonContent}
          labelStyle={styles.uniformButtonLabel}
        >
          Add New Customer
        </Button>
      </View>

      {customerMode === 'existing' ? (
        <View>
          {loadingCustomers ? (
            <View style={styles.customerLoadingWrap}>
              <ActivityIndicator size="small" color="#ff9800" />
            </View>
          ) : (
            <>
              <Menu
                visible={customerDropdownVisible}
                onDismiss={() => setCustomerDropdownVisible(false)}
                anchor={
                  <TextInput
                    placeholder="Select Customer *"
                    value={
                      formData.customerName
                        ? `${formData.customerName}${formData.customerEmail ? ` (${formData.customerEmail})` : ''}`
                        : ''
                    }
                    mode="outlined"
                    editable={false}
                    style={styles.input}
                    outlineColor="#d9d9d9"
                    activeOutlineColor="#ff9800"
                    right={
                      <TextInput.Icon
                        icon="menu-down"
                        onPress={() => setCustomerDropdownVisible(true)}
                      />
                    }
                    onPress={() => setCustomerDropdownVisible(true)}
                  />
                }
              >
                {customers.length === 0 ? (
                  <Menu.Item title="No customers found" disabled />
                ) : (
                  customers.map((customer) => (
                    <Menu.Item
                      key={customer.id}
                      onPress={() => selectExistingCustomer(customer)}
                      title={`${customer.name || 'Unnamed'}${customer.email ? ` - ${customer.email}` : ''}`}
                    />
                  ))
                )}
              </Menu>
              {!formData.customerId ? (
                <Text style={styles.customerHintText}>
                  Choose a customer from the dropdown.
                </Text>
              ) : null}
            </>
          )}
        </View>
      ) : (
        <>
          <TextInput
            placeholder="Customer Name *"
            value={formData.customerName}
            onChangeText={(text) => updateField('customerName', text)}
            mode="outlined"
            style={styles.input}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />

          <TextInput
            placeholder="Email"
            value={formData.customerEmail}
            onChangeText={(text) => updateField('customerEmail', text)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />

          <TextInput
            placeholder="Phone (include country code)"
            value={formData.customerPhone}
            onChangeText={(text) => updateField('customerPhone', text)}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />

          <TextInput
            placeholder="City *"
            value={formData.customerCity}
            onChangeText={(text) => updateField('customerCity', text)}
            mode="outlined"
            style={styles.input}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />

          <DropdownWithOther
            label="Country (optional)"
            value={formData.customerCountry}
            onValueChange={(value) => updateField('customerCountry', value)}
            options={['United Kingdom', 'Ghana', 'Nigeria', 'Kenya', 'South Africa']}
            allowOther={true}
            style={styles.input}
          />

          <DropdownWithOther
            label="Customer Type"
            value={formData.customerType}
            onValueChange={(value) => updateField('customerType', value)}
            options={['Individual', 'Company']}
            allowOther={false}
            style={styles.input}
          />

          <TextInput
            placeholder="Full Address *"
            value={formData.customerAddress}
            onChangeText={(text) => updateField('customerAddress', text)}
            mode="outlined"
            multiline
            style={styles.input}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />
        </>
      )}
    </View>
  );

  const renderReceiverStep = () => (
    <View>
      <Text style={styles.sectionTitle}>Receiver Information</Text>
      <Text style={styles.sectionHint}>Add information about the receiver</Text>

      <TextInput
        placeholder="Receiver Name"
        value={formData.receiverName}
        onChangeText={(text) => updateField('receiverName', text)}
        mode="outlined"
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <TextInput
        placeholder="Receiver Phone"
        value={formData.receiverPhone}
        onChangeText={(text) => updateField('receiverPhone', text)}
        mode="outlined"
        keyboardType="phone-pad"
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <TextInput
        placeholder="Receiver Address"
        value={formData.receiverAddress}
        onChangeText={(text) => updateField('receiverAddress', text)}
        mode="outlined"
        multiline
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />
    </View>
  );

  const renderPackageStep = () => (
    <View>
      <Text style={styles.sectionTitle}>Package Information</Text>
      <Text style={styles.sectionHint}>Add package details for the shipment</Text>

      <DropdownWithOther
        label="Package Type *"
        value={formData.freightType}
        onValueChange={(value) => updateField('freightType', value)}
        options={[FREIGHT_TYPES.AIR, FREIGHT_TYPES.SEA]}
        style={styles.input}
      />

      {formData.freightType === FREIGHT_TYPES.AIR ? (
        <TextInput
          placeholder="Weight (kg)"
          value={formData.weight}
          onChangeText={(text) => updateField('weight', text)}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
          outlineColor="#d9d9d9"
          activeOutlineColor="#ff9800"
        />
      ) : (
        <View style={styles.dimensionRow}>
          <TextInput
            placeholder="L"
            value={formData.length}
            onChangeText={(text) => updateField('length', text)}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.dimensionInput}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />
          <TextInput
            placeholder="W"
            value={formData.width}
            onChangeText={(text) => updateField('width', text)}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.dimensionInput}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />
          <TextInput
            placeholder="H"
            value={formData.height}
            onChangeText={(text) => updateField('height', text)}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.dimensionInput}
            outlineColor="#d9d9d9"
            activeOutlineColor="#ff9800"
          />
        </View>
      )}

      <TextInput
        placeholder="Description"
        value={formData.description}
        onChangeText={(text) => updateField('description', text)}
        mode="outlined"
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <TextInput
        placeholder="Estimated Price"
        value={formData.estimatedPrice}
        onChangeText={(text) => updateField('estimatedPrice', text)}
        mode="outlined"
        keyboardType="decimal-pad"
        style={styles.input}
        outlineColor="#d9d9d9"
        activeOutlineColor="#ff9800"
      />

      <DropdownWithOther
        label="Priority"
        value={formData.priority}
        onValueChange={(value) => updateField('priority', value)}
        options={[PRIORITY_LEVELS.STANDARD, PRIORITY_LEVELS.EXPRESS, PRIORITY_LEVELS.URGENT]}
        style={styles.input}
      />
    </View>
  );

  const renderReviewStep = () => (
    <View>
      <Text style={styles.sectionTitle}>Review & Confirm</Text>
      <Text style={styles.sectionHint}>Please review before creating the job</Text>

      <View style={styles.summaryCard}>
        {reviewItems.map((item) => (
          <View key={item.label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStepBody = () => {
    switch (currentStep) {
      case 0:
        return renderJobDetailsStep();
      case 1:
        return renderCustomerStep();
      case 2:
        return renderReceiverStep();
      case 3:
        return renderPackageStep();
      case 4:
      default:
        return renderReviewStep();
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color="#111" />
            </TouchableOpacity>
            <Text style={styles.title}>{editingJob ? 'Edit Job' : 'Create New Job'}</Text>
            <View style={styles.rightGhost} />
          </View>

          {renderStepIndicators()}

          <View style={styles.card}>{renderStepBody()}</View>

          <View style={styles.footerRow}>
            {canGoBack ? (
              <Button
                mode="outlined"
                onPress={goBack}
                style={styles.backActionBtn}
                textColor="#111"
                icon="arrow-left"
                contentStyle={styles.uniformButtonContent}
                labelStyle={styles.uniformButtonLabel}
              >
                Back
              </Button>
            ) : null}

            {!isReviewStep ? (
              <Button
                mode="contained"
                onPress={goNext}
                style={[styles.nextBtn, !canGoBack && styles.nextBtnFull]}
                buttonColor="#ff9800"
                textColor="#fff"
                icon="arrow-right"
                contentStyle={[styles.uniformButtonContent, styles.nextBtnContent]}
                labelStyle={styles.uniformButtonLabel}
                disabled={!isCurrentStepValid}
              >
                Next
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={() => handleSubmit(false)}
                style={[styles.nextBtn, !canGoBack && styles.nextBtnFull]}
                buttonColor="#ff9800"
                textColor="#fff"
                icon="check"
                contentStyle={[styles.uniformButtonContent, styles.nextBtnContent]}
                labelStyle={styles.uniformButtonLabel}
                loading={loading}
                disabled={loading || savingDraft}
              >
                {editingJob ? 'Update Job' : 'Create Job'}
              </Button>
            )}
          </View>

          <Button
            mode="text"
            onPress={() => handleSubmit(true)}
            textColor="#8a8a8a"
            loading={savingDraft}
            disabled={loading || savingDraft}
            style={styles.draftBtn}
            contentStyle={styles.uniformButtonContent}
            labelStyle={styles.uniformButtonLabel}
          >
            Save as draft
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  contentWrap: {
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightGhost: {
    width: 32,
  },
  title: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: '#111',
  },
  stepperWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  stepItem: {
    alignItems: 'center',
    width: '19%',
    position: 'relative',
  },
  stepConnector: {
    position: 'absolute',
    top: 12,
    left: '55%',
    width: '90%',
    height: 2,
    backgroundColor: '#ececec',
  },
  stepConnectorDone: {
    backgroundColor: '#ff9800',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#fff4e8',
    borderColor: '#ff9800',
  },
  stepCircleDone: {
    backgroundColor: '#ff9800',
    borderColor: '#ff9800',
  },
  stepNumber: {
    fontSize: 11,
    color: '#999',
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepLabel: {
    fontSize: 9,
    color: '#9a9a9a',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#ff9800',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 14,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: typography.xs,
    color: '#8c8c8c',
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  customerModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customerModeBtn: {
    flex: 1,
    borderRadius: 8,
  },
  customerLoadingWrap: {
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerHintText: {
    color: '#8c8c8c',
    fontSize: typography.xs,
    marginTop: -6,
    marginBottom: 10,
  },
  dimensionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dimensionInput: {
    flex: 1,
    backgroundColor: '#fff',
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
  },
  summaryLabel: {
    fontSize: typography.xs,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: typography.xs,
    color: '#111',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  backActionBtn: {
    flex: 1,
    borderColor: '#e4e4e4',
    borderRadius: 10,
  },
  backActionBtnPlaceholder: {
    flex: 1,
  },
  nextBtn: {
    flex: 1,
    borderRadius: 10,
  },
  nextBtnContent: {
    flexDirection: 'row-reverse',
  },
  nextBtnFull: {
    width: '100%',
  },
  uniformButtonContent: {
    minHeight: touchTargets.buttonHeight,
  },
  uniformButtonLabel: {
    fontSize: typography.button,
    fontWeight: '600',
  },
  draftBtn: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
});
