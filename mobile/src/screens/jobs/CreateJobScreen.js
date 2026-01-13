import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  RadioButton,
  Checkbox,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jobService } from '../../services/jobService';
import { PRIORITY_LEVELS, FREIGHT_TYPES, JOB_STATUSES } from '../../config/constants';
import { standardStyles } from '../../theme/theme';
import { theme } from '../../theme/theme';
import CountryCodePicker from '../../components/common/CountryCodePicker';
import DropdownWithOther from '../../components/common/DropdownWithOther';

export default function CreateJobScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const editingJob = route?.params?.job;
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [formData, setFormData] = useState({
    // Reference number (key identifier)
    referenceNumber: editingJob?.referenceNumber || '',
    
    // Customer Information
    customerName: editingJob?.customer?.name || '',
    customerEmail: editingJob?.customer?.email || '',
    customerCountryCode: editingJob?.customer?.phone?.split(' ')[0] || '+44',
    customerPhone: editingJob?.customer?.phone?.split(' ').slice(1).join(' ') || '',
    
    // Receiver Information
    receiverName: editingJob?.receiverName || '',
    receiverAddress: editingJob?.receiverAddress || '',
    receiverCountryCode: editingJob?.receiverPhone?.split(' ')[0] || '+233',
    receiverPhone: editingJob?.receiverPhone?.split(' ').slice(1).join(' ') || '',
    
    // Addresses
    pickupAddress: editingJob?.pickupAddress || '',
    deliveryAddress: editingJob?.deliveryAddress || '',
    pickupDate: editingJob?.pickupDate || '',
    
    // Parcel Details
    description: editingJob?.parcelDetails?.description || '',
    freightType: editingJob?.freightType || FREIGHT_TYPES.AIR,
    weight: editingJob?.weight || '', // For air freight
    length: editingJob?.parcelDetails?.dimensions?.length || '', // For sea freight
    width: editingJob?.parcelDetails?.dimensions?.width || '', // For sea freight
    height: editingJob?.parcelDetails?.dimensions?.height || '', // For sea freight
    estimatedPrice: editingJob?.value || '', // Optional, renamed from value
    priority: editingJob?.priority || PRIORITY_LEVELS.STANDARD,
  });

  const validateEmail = (email) => {
    if (!email) return true; // Email is optional
    // Allow double dots in email
    const emailRegex = /^[^\s@]+(\.[^\s@]+)*@[^\s@]+(\.[^\s@]+)*\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (isDraft = false) => {
    // Validation
    if (!isDraft) {
      if (!formData.referenceNumber) {
        Alert.alert('Error', 'Reference number is required');
        return;
      }
      if (!formData.customerName) {
        Alert.alert('Error', 'Customer name is required');
        return;
      }
      if (!formData.pickupAddress || !formData.deliveryAddress) {
        Alert.alert('Error', 'Pickup and delivery addresses are required');
        return;
      }
      if (formData.freightType === FREIGHT_TYPES.AIR && !formData.weight) {
        Alert.alert('Error', 'Weight is required for air freight');
        return;
      }
      if (formData.freightType === FREIGHT_TYPES.SEA && (!formData.length || !formData.width || !formData.height)) {
        Alert.alert('Error', 'Dimensions are required for sea freight');
        return;
      }
    }

    if (formData.customerEmail && !validateEmail(formData.customerEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (isDraft) {
      setSavingDraft(true);
    } else {
      setLoading(true);
    }

    try {
      const fullCustomerPhone = `${formData.customerCountryCode} ${formData.customerPhone}`;
      const fullReceiverPhone = formData.receiverPhone 
        ? `${formData.receiverCountryCode} ${formData.receiverPhone}` 
        : null;

      const jobData = {
        referenceNumber: formData.referenceNumber,
        newCustomer: {
          name: formData.customerName,
          email: formData.customerEmail || undefined,
          phone: fullCustomerPhone,
          customerType: 'Individual',
          address: formData.pickupAddress,
        },
        receiverName: formData.receiverName,
        receiverAddress: formData.receiverAddress,
        receiverPhone: fullReceiverPhone,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        pickupDate: formData.pickupDate || new Date().toISOString(),
        freightType: formData.freightType,
        parcelDetails: {
          description: formData.description,
          weight: formData.freightType === FREIGHT_TYPES.AIR ? parseFloat(formData.weight) : undefined,
          dimensions: formData.freightType === FREIGHT_TYPES.SEA ? {
            length: parseFloat(formData.length),
            width: parseFloat(formData.width),
            height: parseFloat(formData.height),
          } : undefined,
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
        Alert.alert(
          'Success',
          isDraft ? 'Job saved as draft!' : editingJob ? 'Job updated successfully!' : 'Job created successfully!',
          [
            {
              text: 'OK',
              onPress: () =>
                navigation.navigate('Jobs', {
                  screen: 'JobDetail',
                  params: { jobId: response.data.job.id },
                }),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to save job');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save job'
      );
    } finally {
      setLoading(false);
      setSavingDraft(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {editingJob ? 'Edit Job' : 'Create New Job'}
            </Text>

            {/* Reference Number - Key Identifier */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Reference Number *
            </Text>
            <TextInput
              label="Reference Number"
              value={formData.referenceNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, referenceNumber: text })
              }
              mode="outlined"
              style={styles.input}
              placeholder="Enter unique reference number"
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <Divider style={styles.divider} />

            {/* Customer Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Customer Information
            </Text>

            <TextInput
              label="Customer Name *"
              value={formData.customerName}
              onChangeText={(text) =>
                setFormData({ ...formData, customerName: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <TextInput
              label="Email"
              value={formData.customerEmail}
              onChangeText={(text) =>
                setFormData({ ...formData, customerEmail: text })
              }
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              helperText="Email can contain double dots"
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <View style={styles.phoneContainer}>
              <CountryCodePicker
                value={formData.customerCountryCode}
                onValueChange={(code) =>
                  setFormData({ ...formData, customerCountryCode: code })
                }
                style={styles.countryCode}
              />
              <TextInput
                label="Phone"
                value={formData.customerPhone}
                onChangeText={(text) =>
                  setFormData({ ...formData, customerPhone: text })
                }
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.phoneInput}
                backgroundColor="#ffffff"
                outlineColor="#e0e0e0"
                activeOutlineColor="#ff9800"
              />
            </View>

            <Divider style={styles.divider} />

            {/* Receiver Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Receiver Information
            </Text>

            <TextInput
              label="Receiver Name"
              value={formData.receiverName}
              onChangeText={(text) =>
                setFormData({ ...formData, receiverName: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <TextInput
              label="Receiver Address"
              value={formData.receiverAddress}
              onChangeText={(text) =>
                setFormData({ ...formData, receiverAddress: text })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <View style={styles.phoneContainer}>
              <CountryCodePicker
                value={formData.receiverCountryCode}
                onValueChange={(code) =>
                  setFormData({ ...formData, receiverCountryCode: code })
                }
                style={styles.countryCode}
              />
              <TextInput
                label="Receiver Phone"
                value={formData.receiverPhone}
                onChangeText={(text) =>
                  setFormData({ ...formData, receiverPhone: text })
                }
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.phoneInput}
                backgroundColor="#ffffff"
                outlineColor="#e0e0e0"
                activeOutlineColor="#ff9800"
              />
            </View>

            <Divider style={styles.divider} />

            {/* Addresses */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Addresses
            </Text>

            <TextInput
              label="Pickup Address *"
              value={formData.pickupAddress}
              onChangeText={(text) =>
                setFormData({ ...formData, pickupAddress: text })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <TextInput
              label="Delivery Address *"
              value={formData.deliveryAddress}
              onChangeText={(text) =>
                setFormData({ ...formData, deliveryAddress: text })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <Divider style={styles.divider} />

            {/* Parcel Details */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Parcel Details
            </Text>

            <TextInput
              label="Description"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            {/* Freight Type */}
            <DropdownWithOther
              label="Freight Type *"
              value={formData.freightType}
              onValueChange={(value) =>
                setFormData({ ...formData, freightType: value })
              }
              options={[FREIGHT_TYPES.AIR, FREIGHT_TYPES.SEA]}
              style={styles.input}
            />

            {/* Weight for Air Freight */}
            {formData.freightType === FREIGHT_TYPES.AIR && (
              <TextInput
                label="Weight (kg) *"
                value={formData.weight}
                onChangeText={(text) =>
                  setFormData({ ...formData, weight: text })
                }
                mode="outlined"
                keyboardType="decimal-pad"
                style={styles.input}
                backgroundColor="#ffffff"
                outlineColor="#e0e0e0"
                activeOutlineColor="#ff9800"
              />
            )}

            {/* Dimensions for Sea Freight */}
            {formData.freightType === FREIGHT_TYPES.SEA && (
              <>
                <View style={styles.dimensionsContainer}>
                  <TextInput
                    label="Length (cm) *"
                    value={formData.length}
                    onChangeText={(text) =>
                      setFormData({ ...formData, length: text })
                    }
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.dimensionInput}
                    backgroundColor="#ffffff"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#ff9800"
                  />
                  <TextInput
                    label="Width (cm) *"
                    value={formData.width}
                    onChangeText={(text) =>
                      setFormData({ ...formData, width: text })
                    }
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.dimensionInput}
                    backgroundColor="#ffffff"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#ff9800"
                  />
                  <TextInput
                    label="Height (cm) *"
                    value={formData.height}
                    onChangeText={(text) =>
                      setFormData({ ...formData, height: text })
                    }
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.dimensionInput}
                    backgroundColor="#ffffff"
                    outlineColor="#e0e0e0"
                    activeOutlineColor="#ff9800"
                  />
                </View>
              </>
            )}

            {/* Estimated Price (Optional) */}
            <TextInput
              label="Estimated Price (£)"
              value={formData.estimatedPrice}
              onChangeText={(text) =>
                setFormData({ ...formData, estimatedPrice: text })
              }
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              helperText="Optional"
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            {/* Priority */}
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Priority
            </Text>
            <DropdownWithOther
              label="Priority"
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
              options={[PRIORITY_LEVELS.STANDARD, PRIORITY_LEVELS.EXPRESS, PRIORITY_LEVELS.URGENT]}
              style={styles.input}
            />

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => handleSubmit(true)}
                loading={savingDraft}
                disabled={loading || savingDraft}
                style={styles.draftButton}
                icon="content-save"
              >
                Save as Draft
              </Button>
              <Button
                mode="contained"
                onPress={() => handleSubmit(false)}
                loading={loading}
                disabled={loading || savingDraft}
                style={styles.submitButton}
                buttonColor={theme.colors.shipeaseOrange}
              >
                {editingJob ? 'Update Job' : 'Create Job'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    ...standardStyles,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  input: {
    marginBottom: 16,
    borderRadius: 8, // Consistent 8px border radius
    backgroundColor: '#ffffff', // White background
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  countryCode: {
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    borderRadius: 8,
  },
  dimensionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dimensionInput: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  draftButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
});
