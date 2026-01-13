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
  Button,
  ActivityIndicator,
  Divider,
  FAB,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { jobService } from '../../services/jobService';
import { statusColors, standardStyles, theme, spacing, touchTargets } from '../../theme/theme';
import { format } from 'date-fns';
import StatusUpdateModal from '../../components/jobs/StatusUpdateModal';
import PaymentRecordingModal from '../../components/jobs/PaymentRecordingModal';
import StatusRevertModal from '../../components/jobs/StatusRevertModal';
import { authService } from '../../services/authService';

export default function JobDetailScreen({ route, navigation }) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [job, setJob] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [revertStatusModalVisible, setRevertStatusModalVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    loadJobDetails();
    loadTeamMembers();
  }, [jobId]);

  const loadTeamMembers = async () => {
    try {
      const response = await authService.getUsers();
      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : response.data.users || [];
        // Filter for roles that can be assigned to jobs
        const assignableUsers = users.filter(u => 
          ['driver', 'delivery_agent', 'warehouse_staff', 'admin'].includes(u.role)
        );
        setTeamMembers(assignableUsers);
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const [jobResponse, timelineResponse] = await Promise.all([
        jobService.getJob(jobId),
        jobService.getJobTimeline(jobId),
      ]);

      if (jobResponse.success) {
        setJob(jobResponse.data);
      }
      if (timelineResponse.success) {
        setTimeline(timelineResponse.data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load job details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus, comment, document) => {
    try {
      const response = await jobService.updateJobStatus(jobId, newStatus, comment, document);
      if (response.success) {
        Alert.alert('Success', 'Status updated successfully');
        loadJobDetails();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleEdit = () => {
    navigation.navigate('CreateJob', { job });
  };

  const handleCollect = () => {
    navigation.navigate('Camera', {
      jobId,
      type: 'collection',
      onComplete: loadJobDetails,
    });
  };

  const handleDeliver = () => {
    navigation.navigate('Camera', {
      jobId,
      type: 'delivery',
      onComplete: loadJobDetails,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff9800" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.container}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const canUpdateStatus = user?.role === 'driver' || 
                         user?.role === 'delivery_agent' || 
                         user?.role === 'warehouse_staff' || 
                         user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'warehouse_staff';

  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        <Card style={styles.card} elevation={0}>
          <Card.Content>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text variant="headlineSmall" style={styles.trackingId}>
                  {job.trackingId}
                </Text>
                {job.referenceNumber && (
                  <Text variant="bodyMedium" style={styles.referenceNumber}>
                    Ref: {job.referenceNumber}
                  </Text>
                )}
              </View>
              <Chip
                style={[
                  styles.statusChip,
                  { backgroundColor: statusColors[job.status] || '#d9d9d9' },
                ]}
                textStyle={styles.chipText}
              >
                {job.status}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {/* Customer Information */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Customer Information
              </Text>
              <Text variant="bodyMedium">{job.customer?.name}</Text>
              <Text variant="bodySmall" style={styles.mutedText}>
                {job.customer?.email}
              </Text>
              <Text variant="bodySmall" style={styles.mutedText}>
                {job.customer?.phone}
              </Text>
            </View>

            {/* Receiver Information */}
            {job.receiverName && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Receiver Information
                  </Text>
                  <Text variant="bodyMedium">{job.receiverName}</Text>
                  {job.receiverAddress && (
                    <Text variant="bodySmall" style={styles.mutedText}>
                      {job.receiverAddress}
                    </Text>
                  )}
                  {job.receiverPhone && (
                    <Text variant="bodySmall" style={styles.mutedText}>
                      {job.receiverPhone}
                    </Text>
                  )}
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            {/* Pickup Address */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Pickup Address
              </Text>
              <Text variant="bodyMedium">{job.pickupAddress}</Text>
              {job.pickupDate && (
                <Text variant="bodySmall" style={styles.mutedText}>
                  Scheduled: {format(new Date(job.pickupDate), 'MMM dd, yyyy')}
                </Text>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Delivery Address */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Delivery Address
              </Text>
              <Text variant="bodyMedium">{job.deliveryAddress}</Text>
            </View>

            <Divider style={styles.divider} />

            {/* Parcel Details */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Parcel Details
              </Text>
              <Text variant="bodyMedium">
                Description: {job.parcelDetails?.description || 'N/A'}
              </Text>
              
              {job.freightType === 'Air Freight' && (
                <Text variant="bodyMedium">Weight: {job.weight || 0} kg</Text>
              )}
              
              {job.freightType === 'Sea Freight' && job.parcelDetails?.dimensions && (
                <Text variant="bodyMedium">
                  Dimensions: {job.parcelDetails.dimensions.length} x{' '}
                  {job.parcelDetails.dimensions.width} x{' '}
                  {job.parcelDetails.dimensions.height} cm
                </Text>
              )}
              
              {job.value && (
                <Text variant="bodyMedium">Estimated Price: £{job.value}</Text>
              )}
              
              {job.priority && (
                <Chip
                  style={[
                    styles.priorityChip,
                    {
                      backgroundColor:
                        job.priority === 'Urgent'
                          ? '#ff4d4f'
                          : job.priority === 'Express'
                          ? '#faad14'
                          : '#d9d9d9',
                    },
                  ]}
                  textStyle={styles.chipText}
                >
                  {job.priority} Priority
                </Chip>
              )}
            </View>

            {job.specialInstructions && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Special Instructions
                  </Text>
                  <Text variant="bodyMedium">{job.specialInstructions}</Text>
                </View>
              </>
            )}

            {/* Action Buttons */}
            {canUpdateStatus && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.actionSection}>
                  {user?.role === 'driver' && job.status === 'Assigned' && (
                    <>
                      <Button
                        mode="contained"
                        onPress={handleCollect}
                        style={styles.actionButton}
                        icon="camera"
                      >
                        Mark as Collected
                      </Button>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setStatusModalVisible(true);
                        }}
                        style={styles.actionButton}
                        icon="close-circle"
                        buttonColor="#ff4d4f"
                      >
                        Mark as Failed
                      </Button>
                    </>
                  )}
                  {user?.role === 'delivery_agent' && job.status === 'Out for Delivery' && (
                    <Button
                      mode="contained"
                      onPress={handleDeliver}
                      style={styles.actionButton}
                      icon="check-circle"
                    >
                      Mark as Delivered
                    </Button>
                  )}
                  {/* Warehouse staff can update to "At Warehouse" when status is "Collected" */}
                  {(user?.role === 'warehouse_staff' || user?.role === 'admin') && job.status === 'Collected' && (
                    <Button
                      mode="contained"
                      onPress={() => setStatusModalVisible(true)}
                      style={styles.actionButton}
                      icon="warehouse"
                    >
                      Mark as Received at Warehouse
                    </Button>
                  )}
                  {/* Warehouse staff can also update other statuses */}
                  {(user?.role === 'warehouse_staff' || user?.role === 'admin') && job.status !== 'Collected' && (
                    <Button
                      mode="contained"
                      onPress={() => setStatusModalVisible(true)}
                      style={styles.actionButton}
                      icon="update"
                    >
                      Update Status
                    </Button>
                  )}
                  {/* Warehouse manager can record payment */}
                  {(user?.role === 'warehouse_staff' || user?.role === 'admin') && (
                    <Button
                      mode="outlined"
                      onPress={() => setPaymentModalVisible(true)}
                      style={styles.actionButton}
                      icon="cash"
                    >
                      Record Payment
                    </Button>
                  )}
                  {/* Admin can revert status */}
                  {user?.role === 'admin' && job.status !== 'Pending Collection' && job.status !== 'Draft' && (
                    <Button
                      mode="outlined"
                      onPress={() => setRevertStatusModalVisible(true)}
                      style={styles.actionButton}
                      icon="undo"
                      buttonColor="#ff4d4f"
                    >
                      Revert Status
                    </Button>
                  )}
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            {/* Timeline */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Timeline
              </Text>
              {timeline.map((item, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text variant="bodyMedium" style={styles.timelineStatus}>
                      {item.status}
                    </Text>
                    <Text variant="bodySmall" style={styles.mutedText}>
                      {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                    </Text>
                    {item.notes && (
                      <Text variant="bodySmall" style={styles.timelineNotes}>
                        {item.notes}
                      </Text>
                    )}
                    {item.document && (
                      <Text variant="bodySmall" style={styles.timelineDocument}>
                        📎 Document attached
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Edit FAB */}
      {canEdit && (
        <FAB
          icon="pencil"
          style={styles.fab}
          onPress={handleEdit}
        />
      )}

      {/* Status Update Modal */}
      <StatusUpdateModal
        visible={statusModalVisible}
        onDismiss={() => setStatusModalVisible(false)}
        currentStatus={job?.status}
        onUpdate={handleStatusUpdate}
        userRole={user?.role}
        teamMembers={teamMembers}
        allowReassignment={true}
      />

      {/* Payment Recording Modal */}
      <PaymentRecordingModal
        visible={paymentModalVisible}
        onDismiss={() => setPaymentModalVisible(false)}
        job={job}
        invoiceAmount={job?.estimatedPrice || job?.value || 0}
        onPaymentRecorded={loadJobDetails}
      />

      {/* Status Revert Modal */}
      <StatusRevertModal
        visible={revertStatusModalVisible}
        onDismiss={() => setRevertStatusModalVisible(false)}
        currentStatus={job?.status}
        jobHistory={timeline}
        onRevert={handleRevertStatus}
      />
    </>
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
  card: {
    margin: spacing.md,
    ...standardStyles,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  trackingId: {
    fontWeight: '600',
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 4,
  },
  referenceNumber: {
    color: theme.colors.placeholder,
    fontSize: 13,
    marginTop: 2,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  divider: {
    marginVertical: spacing.md,
    backgroundColor: theme.colors.divider,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: spacing.sm,
    color: theme.colors.text,
  },
  mutedText: {
    color: theme.colors.placeholder,
    fontSize: 14,
    marginTop: 4,
  },
  priorityChip: {
    height: 26,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  actionSection: {
    marginTop: spacing.md,
  },
  actionButton: {
    marginTop: spacing.sm,
    minHeight: touchTargets.buttonHeight,
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
  timelineNotes: {
    marginTop: 4,
    color: '#8c8c8c',
  },
  timelineDocument: {
    marginTop: 4,
    color: '#ff9800', // Orange
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: '#ff9800', // Orange
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
  },
});
