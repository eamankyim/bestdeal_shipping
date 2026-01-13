import React, { useState, useEffect } from 'react';
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
  Checkbox,
  Divider,
  Chip,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { batchService } from '../../services/batchService';
import { jobService } from '../../services/jobService';
import { standardStyles } from '../../theme/theme';

export default function CreateBatchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    sealNumber: '',
    route: 'UK → Ghana',
    vessel: '',
    flightNumber: '',
    departureDate: '',
    estimatedArrivalDate: '',
    notes: '',
    batchItems: [],
  });

  useEffect(() => {
    loadAvailableJobs();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      const response = await jobService.getJobs({ status: 'At Warehouse' });
      if (response.success) {
        setAvailableJobs(response.data || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const toggleJobSelection = (jobId) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    } else {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.sealNumber) {
      Alert.alert('Error', 'Batch name and seal number are required');
      return;
    }

    if (!formData.route) {
      Alert.alert('Error', 'Route is required');
      return;
    }

    if (selectedJobs.length === 0) {
      Alert.alert('Error', 'Please select at least one job');
      return;
    }

    setLoading(true);
    try {
      const batchData = {
        name: formData.name,
        route: formData.route,
        vessel: formData.vessel || undefined,
        containerNumber: formData.sealNumber, // Backend uses containerNumber for seal
        departureDate: formData.departureDate || undefined,
        eta: formData.estimatedArrivalDate || undefined,
        notes: formData.notes || undefined,
        jobs: selectedJobs, // Backend expects 'jobs' not 'jobIds'
        batchItems: formData.batchItems || [],
      };

      const response = await batchService.createBatch(batchData);
      
      if (response.success) {
        Alert.alert('Success', 'Batch created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to create batch');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create batch'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Create New Batch
            </Text>

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Batch Information
            </Text>

            <TextInput
              label="Batch Name *"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              placeholder="Enter batch name"
            />

            <TextInput
              label="Seal Number *"
              value={formData.sealNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, sealNumber: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              placeholder="Enter seal/container number"
            />

            <TextInput
              label="Route *"
              value={formData.route}
              onChangeText={(text) =>
                setFormData({ ...formData, route: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
              placeholder="e.g., UK → Ghana"
            />

            <TextInput
              label="Vessel Name"
              value={formData.vessel}
              onChangeText={(text) =>
                setFormData({ ...formData, vessel: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <TextInput
              label="Flight Number"
              value={formData.flightNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, flightNumber: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <TextInput
              label="Departure Date"
              value={formData.departureDate}
              onChangeText={(text) =>
                setFormData({ ...formData, departureDate: text })
              }
              mode="outlined"
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />

            <TextInput
              label="Estimated Arrival Date"
              value={formData.estimatedArrivalDate}
              onChangeText={(text) =>
                setFormData({ ...formData, estimatedArrivalDate: text })
              }
              mode="outlined"
              placeholder="YYYY-MM-DD"
              style={styles.input}
            />

            <TextInput
              label="Notes"
              value={formData.notes}
              onChangeText={(text) =>
                setFormData({ ...formData, notes: text })
              }
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Batch Items (Ghana Delivery)
            </Text>
            <Text variant="bodySmall" style={styles.hintText}>
              Add items that will be included in this batch for delivery in Ghana
            </Text>

            {formData.batchItems.map((item, index) => (
              <Card key={index} style={styles.batchItemCard} elevation={0}>
                <Card.Content>
                  <View style={styles.batchItemRow}>
                    <TextInput
                      label="Item Name *"
                      value={item.itemName}
                      onChangeText={(text) => {
                        const newItems = [...formData.batchItems];
                        newItems[index] = { ...newItems[index], itemName: text };
                        setFormData({ ...formData, batchItems: newItems });
                      }}
                      mode="outlined"
                      style={styles.batchItemInput}
                    />
                    <TextInput
                      label="Quantity *"
                      value={item.quantity?.toString() || ''}
                      onChangeText={(text) => {
                        const newItems = [...formData.batchItems];
                        newItems[index] = { ...newItems[index], quantity: parseInt(text) || 0 };
                        setFormData({ ...formData, batchItems: newItems });
                      }}
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.batchItemInput}
                    />
                    <Button
                      mode="text"
                      icon="delete"
                      onPress={() => {
                        const newItems = formData.batchItems.filter((_, i) => i !== index);
                        setFormData({ ...formData, batchItems: newItems });
                      }}
                      textColor="#ff4d4f"
                    >
                      Remove
                    </Button>
                  </View>
                  <TextInput
                    label="Description"
                    value={item.description || ''}
                    onChangeText={(text) => {
                      const newItems = [...formData.batchItems];
                      newItems[index] = { ...newItems[index], description: text };
                      setFormData({ ...formData, batchItems: newItems });
                    }}
                    mode="outlined"
                    multiline
                    numberOfLines={2}
                    style={styles.input}
                  />
                </Card.Content>
              </Card>
            ))}

            <Button
              mode="outlined"
              icon="plus"
              onPress={() => {
                setFormData({
                  ...formData,
                  batchItems: [
                    ...formData.batchItems,
                    { itemName: '', quantity: 1, description: '' },
                  ],
                });
              }}
              style={styles.addButton}
            >
              Add Batch Item
            </Button>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Jobs ({selectedJobs.length} selected)
            </Text>

            {availableJobs.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No jobs available for batching
              </Text>
            ) : (
              availableJobs.map((job) => (
                <View key={job.id} style={styles.jobItem}>
                  <Checkbox
                    status={selectedJobs.includes(job.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleJobSelection(job.id)}
                  />
                  <View style={styles.jobInfo}>
                    <Text variant="bodyMedium" style={styles.jobTrackingId}>
                      {job.trackingId}
                    </Text>
                    {job.referenceNumber && (
                      <Text variant="bodySmall" style={styles.jobRef}>
                        Ref: {job.referenceNumber}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={styles.jobCustomer}>
                      {job.customer?.name}
                    </Text>
                  </View>
                </View>
              ))
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || selectedJobs.length === 0}
              style={styles.submitButton}
            >
              Create Batch
            </Button>
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
    backgroundColor: '#ffffff', // White background
    borderRadius: 8, // Consistent 8px border radius
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jobInfo: {
    flex: 1,
    marginLeft: 8,
  },
  jobTrackingId: {
    fontWeight: '500',
  },
  jobRef: {
    color: '#8c8c8c',
    marginTop: 2,
  },
  jobCustomer: {
    color: '#8c8c8c',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8c8c8c',
    padding: 16,
  },
  hintText: {
    color: '#8c8c8c',
    marginBottom: 16,
  },
  batchItemCard: {
    marginBottom: 16,
    ...standardStyles,
  },
  batchItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  batchItemInput: {
    flex: 1,
    marginRight: 8,
  },
  addButton: {
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 4,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
});

