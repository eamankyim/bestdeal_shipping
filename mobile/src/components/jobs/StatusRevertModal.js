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
} from 'react-native-paper';

export default function StatusRevertModal({
  visible,
  onDismiss,
  currentStatus,
  jobHistory = [],
  onRevert,
}) {
  const [previousStatus, setPreviousStatus] = useState('');
  const [comment, setComment] = useState('');
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setPreviousStatus('');
      setComment('');
      setStatusMenuVisible(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!previousStatus) {
      Alert.alert('Error', 'Please select a previous status to revert to');
      return;
    }

    if (!comment || comment.trim() === '') {
      Alert.alert('Error', 'Please provide a reason for reverting the status');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Error', 'Reason must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      await onRevert({
        previousStatus,
        comment: comment.trim(),
      });
      
      // Reset form
      setPreviousStatus('');
      setComment('');
      onDismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to revert status');
    } finally {
      setLoading(false);
    }
  };

  // Get previous statuses from job history
  const previousStatuses = jobHistory
    .map(item => item.status)
    .filter((status, index, self) => self.indexOf(status) === index && status !== currentStatus)
    .reverse(); // Most recent first

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
              Revert Job Status
            </Text>

            <Divider style={styles.divider} />

            <View style={styles.warningContainer}>
              <Text variant="bodyMedium" style={styles.warningLabel}>
                Current Status:
              </Text>
              <Text variant="titleMedium" style={styles.currentStatus}>
                {currentStatus}
              </Text>
            </View>

            <Menu
              visible={statusMenuVisible}
              onDismiss={() => setStatusMenuVisible(false)}
              anchor={
                <TextInput
                  label="Revert To Status *"
                  value={previousStatus}
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
              {previousStatuses.map((status) => (
                <Menu.Item
                  key={status}
                  onPress={() => {
                    setPreviousStatus(status);
                    setStatusMenuVisible(false);
                  }}
                  title={status}
                />
              ))}
            </Menu>

            <TextInput
              label="Reason for Revert *"
              value={comment}
              onChangeText={setComment}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Explain why you are reverting this job status (minimum 10 characters)..."
            />

            <View style={styles.warningBox}>
              <Text variant="bodySmall" style={styles.warningText}>
                ⚠️ Warning: Reverting a job status will change the current status back to a previous state. This action will be logged and may affect job tracking and reporting.
              </Text>
            </View>

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
                disabled={loading || !previousStatus || !comment || comment.trim().length < 10}
                buttonColor="#ff4d4f"
                style={styles.button}
              >
                Revert Status
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
    maxHeight: '90%',
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginBottom: 16,
  },
  warningContainer: {
    padding: 12,
    backgroundColor: '#fff7e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffd591',
    marginBottom: 16,
  },
  warningLabel: {
    color: '#8c8c8c',
    marginBottom: 4,
  },
  currentStatus: {
    color: '#d46b08',
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  warningBox: {
    padding: 12,
    backgroundColor: '#fff1f0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffccc7',
    marginBottom: 16,
  },
  warningText: {
    color: '#cf1322',
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
});


