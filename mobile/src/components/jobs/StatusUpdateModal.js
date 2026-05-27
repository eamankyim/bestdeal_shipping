import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  TextInput,
  Menu,
  Divider,
  Checkbox,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { JOB_STATUSES } from '../../config/constants';

export default function StatusUpdateModal({
  visible,
  onDismiss,
  currentStatus,
  onUpdate,
  userRole,
  teamMembers = [],
  allowReassignment = true,
}) {
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [document, setDocument] = useState(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [reassignMenuVisible, setReassignMenuVisible] = useState(false);
  const [reassignJob, setReassignJob] = useState(false);
  const [assignedTo, setAssignedTo] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAvailableStatuses = () => {
    const statuses = [];
    
    if (userRole === 'driver') {
      // Drivers can only update to "Collected" or "Collection Failed"
      // They CANNOT update to "At Warehouse" - that's for warehouse staff only
      if (currentStatus === 'Assigned') {
        statuses.push(JOB_STATUSES.COLLECTED);
        statuses.push(JOB_STATUSES.COLLECTION_FAILED);
      }
      // Drivers cannot update status after collection - warehouse takes over
    } else if (userRole === 'delivery_agent') {
      if (currentStatus === 'Out for Delivery') {
        statuses.push(JOB_STATUSES.DELIVERED);
        statuses.push(JOB_STATUSES.FAILED_DELIVERY);
      }
    } else if (userRole === 'warehouse_staff' || userRole === 'admin') {
      // Warehouse staff can update to "At Warehouse" when status is "Collected"
      if (currentStatus === 'Collected') {
        statuses.push(JOB_STATUSES.AT_WAREHOUSE);
      }
      // Warehouse staff can handle warehouse-related statuses
      if (currentStatus === 'At Warehouse') {
        statuses.push(JOB_STATUSES.BATCHED);
      }
      if (currentStatus === 'Batched') {
        statuses.push(JOB_STATUSES.SHIPPED);
      }
      if (currentStatus === 'Shipped') {
        statuses.push(JOB_STATUSES.ARRIVED_AT_DESTINATION);
        statuses.push(JOB_STATUSES.READY_FOR_DELIVERY);
      }
      if (currentStatus === 'Arrived at Destination') {
        statuses.push(JOB_STATUSES.READY_FOR_DELIVERY);
      }
      if (currentStatus === 'Ready for Delivery') {
        statuses.push(JOB_STATUSES.OUT_FOR_DELIVERY);
      }
    }
    
    return statuses;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType || 'application/pdf',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  useEffect(() => {
    if (visible) {
      setReassignJob(false);
      setAssignedTo(null);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!status) {
      Alert.alert('Error', 'Please select a status');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(
        status, 
        comment || undefined, 
        document || undefined,
        reassignJob && assignedTo ? assignedTo : null
      );
      // Reset form
      setStatus('');
      setComment('');
      setDocument(null);
      setReassignJob(false);
      setAssignedTo(null);
      onDismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const availableStatuses = getAvailableStatuses();

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              Update Job Status
            </Text>

            <Divider style={styles.divider} />

            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <TextInput
                  label="New Status *"
                  value={status}
                  mode="outlined"
                  editable={false}
                  right={
                    <TextInput.Icon
                      icon="menu-down"
                      onPress={() => setStatusMenuVisible(true)}
                    />
                  }
                  onPress={() => setStatusMenuVisible(true)}
                  style={styles.input}
                />
              }
            >
              {availableStatuses.map((statusOption) => (
                <Menu.Item
                  key={statusOption}
                  onPress={() => {
                    setStatus(statusOption);
                    setStatusMenuVisible(false);
                  }}
                  title={statusOption}
                />
              ))}
            </Menu>

            <TextInput
              label="Comment (Optional)"
              value={comment}
              onChangeText={setComment}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Add any notes about this status update..."
            />

            <View style={styles.documentSection}>
              <Text variant="bodyMedium" style={styles.documentLabel}>
                Attach Document (Optional)
              </Text>
              <View style={styles.documentButtons}>
                <Button
                  mode="outlined"
                  onPress={handlePickDocument}
                  icon="file-document"
                  style={styles.documentButton}
                >
                  Pick File
                </Button>
                <Button
                  mode="outlined"
                  onPress={handlePickImage}
                  icon="image"
                  style={styles.documentButton}
                >
                  Pick Image
                </Button>
              </View>
              {document && (
                <View style={styles.documentInfo}>
                  <Text variant="bodySmall" style={styles.documentName}>
                    {document.name}
                  </Text>
                  <Button
                    mode="text"
                    onPress={() => setDocument(null)}
                    icon="close"
                    compact
                  >
                    Remove
                  </Button>
                </View>
              )}
            </View>

            {/* Reassignment Section */}
            {allowReassignment && teamMembers.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.reassignSection}>
                  <Checkbox
                    status={reassignJob ? 'checked' : 'unchecked'}
                    onPress={() => {
                      setReassignJob(!reassignJob);
                      if (reassignJob) {
                        setAssignedTo(null);
                      }
                    }}
                  />
                  <Text variant="bodyMedium" style={styles.reassignLabel}>
                    Reassign Job to Different Team Member
                  </Text>
                </View>
              </>
            )}

            {reassignJob && teamMembers.length > 0 && (
              <Menu
                visible={reassignMenuVisible}
                onDismiss={() => setReassignMenuVisible(false)}
                anchor={
                  <TextInput
                    label="Assign To *"
                    value={teamMembers.find(m => m.id === assignedTo)?.name || ''}
                    mode="outlined"
                    editable={false}
                    right={
                      <TextInput.Icon
                        icon="menu-down"
                        onPress={() => setReassignMenuVisible(true)}
                      />
                    }
                    onPress={() => setReassignMenuVisible(true)}
                    style={styles.input}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setAssignedTo(null);
                    setReassignMenuVisible(false);
                  }}
                  title="Unassigned"
                />
                {teamMembers.map((member) => (
                  <Menu.Item
                    key={member.id}
                    onPress={() => {
                      setAssignedTo(member.id);
                      setReassignMenuVisible(false);
                    }}
                    title={`${member.name} - ${member.role?.replace('_', ' ').toUpperCase() || 'N/A'}`}
                  />
                ))}
              </Menu>
            )}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !status || (reassignJob && !assignedTo)}
                style={styles.button}
              >
                Update Status
              </Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  documentSection: {
    marginBottom: 16,
  },
  documentLabel: {
    marginBottom: 8,
  },
  documentButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  documentButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  documentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  documentName: {
    flex: 1,
    marginRight: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  reassignSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  reassignLabel: {
    marginLeft: 8,
  },
});

