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
import { standardStyles, touchTargets, typography } from '../../theme/theme';

export default function CreateBatchScreen({ navigation, route }) {
  const editingBatch = route?.params?.batch;
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState(editingBatch?.jobs?.map((job) => job.id) || []);
  const [formData, setFormData] = useState({
    name: editingBatch?.name || '',
    sealNumber: editingBatch?.sealNumber || '',
    route: editingBatch ? editingBatch.route || '' : 'UK → Ghana',
    vessel: editingBatch?.vesselName || '',
    flightNumber: '',
    departureDate: editingBatch?.departureDate?.slice(0, 10) || '',
    estimatedArrivalDate: editingBatch?.estimatedArrivalDate?.slice(0, 10) || '',
    notes: editingBatch?.notes || '',
  });

  useEffect(() => {
    navigation.setOptions({ title: editingBatch ? 'Edit Batch' : 'Create Batch' });
    loadAvailableJobs();
  }, []);

  const loadAvailableJobs = async () => {
    try {
      const response = await jobService.getAllJobs();
      if (response.success) {
        const jobs =
          response?.data?.jobs ||
          response?.data?.data?.jobs ||
          response?.data?.data ||
          response?.data ||
          [];
        const ready = Array.isArray(jobs) ? jobs.filter(job => !job.batchId && ['at_warehouse', 'arrived_at_warehouse', 'at_uk_warehouse', 'at_ghana_warehouse'].includes(String(job.status).toLowerCase().replace(/ /g, '_'))) : [];
        // When editing, the batch's own jobs come first so they can be kept or taken out
        setAvailableJobs([...(editingBatch?.jobs || []), ...ready]);
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
    // When editing, a blank field keeps its saved value
    if (!editingBatch && (!formData.name || !formData.sealNumber)) {
      Alert.alert('Error', 'Batch name and seal number are required');
      return;
    }

    if (!editingBatch && !formData.route) {
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
      };

      const response = editingBatch
        ? await batchService.updateBatch(editingBatch.id, batchData)
        : await batchService.createBatch(batchData);
      
      if (response.success) {
        Alert.alert('Success', editingBatch ? 'Batch updated successfully!' : 'Batch created successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response.message || 'Failed to save batch');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save batch'
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
              {editingBatch ? `Edit ${editingBatch.batchId}` : 'Create New Batch'}
            </Text>

            {editingBatch && (
              <Text variant="bodySmall" style={styles.hintText}>
                Blank fields keep their saved value. Jobs you untick go back to the warehouse; nothing is deleted.
              </Text>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Batch Information
            </Text>

            <TextInput
              placeholder="Batch Name *"
              value={formData.name}
              onChangeText={(text) =>
                setFormData({ ...formData, name: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholder="Enter batch name"
            />

            <TextInput
              placeholder="Seal Number *"
              value={formData.sealNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, sealNumber: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholder="Enter seal/container number"
            />

            <TextInput
              placeholder="Route *"
              value={formData.route}
              onChangeText={(text) =>
                setFormData({ ...formData, route: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
              placeholder="e.g., UK → Ghana"
            />

            <TextInput
              placeholder="Vessel Name"
              value={formData.vessel}
              onChangeText={(text) =>
                setFormData({ ...formData, vessel: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
              activeOutlineColor="#ff9800"
            />

            <TextInput
              placeholder="Flight Number"
              value={formData.flightNumber}
              onChangeText={(text) =>
                setFormData({ ...formData, flightNumber: text })
              }
              mode="outlined"
              style={styles.input}
              backgroundColor="#ffffff"
              outlineColor="#d9d9d9"
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
              contentStyle={styles.submitButtonContent}
              labelStyle={styles.submitButtonLabel}
            >
              {editingBatch ? 'Save Changes' : 'Create Batch'}
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
  submitButtonContent: {
    minHeight: touchTargets.buttonHeight,
  },
  submitButtonLabel: {
    fontSize: typography.button,
    fontWeight: '600',
  },
});

