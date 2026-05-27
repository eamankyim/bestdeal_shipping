import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Card,
  Text,
  Chip,
  ActivityIndicator,
  DataTable,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { batchService } from '../../services/batchService';
import { statusColors, standardStyles } from '../../theme/theme';
import { format } from 'date-fns';

export default function BatchJobsScreen({ route, navigation }) {
  const { batchId } = route.params;
  const insets = useSafeAreaInsets();
  const [batch, setBatch] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBatchJobs();
  }, [batchId]);

  const loadBatchJobs = async () => {
    try {
      setLoading(true);
      const batchResponse = await batchService.getBatch(batchId);

      if (batchResponse.success) {
        setBatch(batchResponse.data.batch);
        // Jobs are included in batch response
        setJobs(batchResponse.data.batch.jobs || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load batch jobs');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      {batch && (
        <Card style={styles.batchCard} elevation={0}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.batchTitle}>
              Batch Details
            </Text>
            <Text variant="bodyMedium">Seal Number: {batch.sealNumber}</Text>
            {batch.vesselName && (
              <Text variant="bodyMedium">Vessel: {batch.vesselName}</Text>
            )}
            {batch.flightNumber && (
              <Text variant="bodyMedium">Flight: {batch.flightNumber}</Text>
            )}
            {batch.departureDate && (
              <Text variant="bodySmall" style={styles.mutedText}>
                Departure: {format(new Date(batch.departureDate), 'MMM dd, yyyy')}
              </Text>
            )}
            {batch.estimatedArrivalDate && (
              <Text variant="bodySmall" style={styles.mutedText}>
                ETA: {format(new Date(batch.estimatedArrivalDate), 'MMM dd, yyyy')}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.tableCard} elevation={0}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.tableTitle}>
            Jobs in Batch ({jobs.length})
          </Text>
          
          <Divider style={styles.divider} />

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Tracking ID</DataTable.Title>
              <DataTable.Title>Reference</DataTable.Title>
              <DataTable.Title>Customer</DataTable.Title>
              <DataTable.Title>Status</DataTable.Title>
            </DataTable.Header>

            {jobs.length === 0 ? (
              <DataTable.Row>
                <DataTable.Cell colSpan={4}>
                  <Text style={styles.emptyText}>No jobs in this batch</Text>
                </DataTable.Cell>
              </DataTable.Row>
            ) : (
              jobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  onPress={() =>
                    navigation.navigate('Jobs', {
                      screen: 'JobDetail',
                      params: { jobId: job.id },
                    })
                  }
                >
                  <DataTable.Row>
                    <DataTable.Cell>{job.trackingId}</DataTable.Cell>
                    <DataTable.Cell>
                      {job.referenceNumber || 'N/A'}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      {job.customer?.name || 'N/A'}
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Chip
                        style={[
                          styles.statusChip,
                          {
                            backgroundColor:
                              statusColors[job.status] || '#d9d9d9',
                          },
                        ]}
                        textStyle={styles.chipText}
                      >
                        {job.status}
                      </Chip>
                    </DataTable.Cell>
                  </DataTable.Row>
                </TouchableOpacity>
              ))
            )}
          </DataTable>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchCard: {
    margin: 16,
    marginBottom: 8,
    ...standardStyles,
  },
  batchTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
  },
  mutedText: {
    color: '#8c8c8c',
    marginTop: 4,
  },
  tableCard: {
    margin: 16,
    marginTop: 8,
    ...standardStyles,
  },
  tableTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 8,
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
    color: '#ffffff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8c8c8c',
    padding: 16,
  },
});

