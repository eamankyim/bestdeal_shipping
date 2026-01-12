import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackingService } from '../../services/trackingService';
import { statusColors, standardStyles } from '../../theme/theme';
import { format } from 'date-fns';

export default function TrackingScreen() {
  const insets = useSafeAreaInsets();
  const [trackingId, setTrackingId] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      Alert.alert('Error', 'Please enter a tracking ID');
      return;
    }

    setLoading(true);
    try {
      const response = await trackingService.trackShipment(trackingId.trim());
      
      if (response.success) {
        setTrackingData(response.data);
      } else {
        Alert.alert('Error', response.message || 'Tracking ID not found');
        setTrackingData(null);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to track shipment'
      );
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      <View style={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>
          Track Your Shipment
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter your tracking ID to check the status of your shipment
        </Text>

        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <TextInput
              label="Tracking ID"
              value={trackingId}
              onChangeText={setTrackingId}
              mode="outlined"
              placeholder="e.g., SHIP-20241010-A3B9F"
              style={styles.input}
              autoCapitalize="characters"
              backgroundColor="#ffffff"
              outlineColor="#e0e0e0"
              activeOutlineColor="#ff9800"
            />

            <Button
              mode="contained"
              onPress={handleTrack}
              loading={loading}
              disabled={loading}
              style={styles.trackButton}
              icon="magnify"
            >
              Track Shipment
            </Button>
          </Card.Content>
        </Card>

        {trackingData && (
          <Card style={styles.resultCard} elevation={0}>
            <Card.Content>
              <View style={styles.header}>
                <Text variant="titleLarge" style={styles.trackingId}>
                  {trackingData.job?.trackingId}
                </Text>
                <Chip
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor:
                        statusColors[trackingData.job?.status] || '#d9d9d9',
                    },
                  ]}
                  textStyle={styles.chipText}
                >
                  {trackingData.job?.status}
                </Chip>
              </View>

              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Customer
                </Text>
                <Text variant="bodyMedium">
                  {trackingData.job?.customer?.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Pickup Address
                </Text>
                <Text variant="bodyMedium">
                  {trackingData.job?.pickupAddress || 'N/A'}
                </Text>
              </View>

              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Delivery Address
                </Text>
                <Text variant="bodyMedium">
                  {trackingData.job?.deliveryAddress || 'N/A'}
                </Text>
              </View>

              {trackingData.job?.estimatedDelivery && (
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Estimated Delivery
                  </Text>
                  <Text variant="bodyMedium">
                    {format(
                      new Date(trackingData.job.estimatedDelivery),
                      'MMM dd, yyyy'
                    )}
                  </Text>
                </View>
              )}

              {trackingData.job?.timeline && trackingData.job.timeline.length > 0 && (
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Timeline
                  </Text>
                  {trackingData.job.timeline.map((item, index) => (
                    <View key={index} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={styles.timelineContent}>
                        <Text variant="bodyMedium" style={styles.timelineStatus}>
                          {item.status}
                        </Text>
                        <Text variant="bodySmall" style={styles.timelineDate}>
                          {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                        </Text>
                        {item.notes && (
                          <Text variant="bodySmall" style={styles.timelineNotes}>
                            {item.notes}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#8c8c8c',
  },
  card: {
    ...standardStyles,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    borderRadius: 8, // Consistent 8px border radius
    backgroundColor: '#ffffff', // White background
  },
  trackButton: {
    paddingVertical: 4,
    borderRadius: 8, // Consistent 8px border radius (not fully curved)
  },
  resultCard: {
    ...standardStyles,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingId: {
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    height: 32,
  },
  chipText: {
    fontSize: 12,
    color: '#ffffff',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 8, // Consistent with app-wide 8px border radius
    backgroundColor: '#ff9800', // Orange
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontWeight: '500',
  },
  timelineDate: {
    color: '#8c8c8c',
    marginTop: 4,
  },
  timelineNotes: {
    marginTop: 4,
    color: '#8c8c8c',
  },
});



