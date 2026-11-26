import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, RadioButton, Text } from 'react-native-paper';
import { normalizeRole } from '../../utils/permissions';
import { jobService } from '../../services/jobService';

/** Hand a job to a dispatch rider (delivery agent). */
export default function AssignRiderModal({ visible, job, teamMembers = [], onDismiss, onAssigned }) {
  const [riderId, setRiderId] = useState(null);
  const [busy, setBusy] = useState(false);
  const riders = teamMembers.filter((member) => normalizeRole(member.role) === 'delivery-agent' && member.active !== false);

  useEffect(() => {
    if (visible) setRiderId(job?.assignedDeliveryAgentId || null);
  }, [visible, job?.assignedDeliveryAgentId]);

  const assign = async () => {
    setBusy(true);
    try {
      await jobService.assignDeliveryAgent(job.id, riderId);
      onDismiss();
      onAssigned?.();
    } catch (error) {
      Alert.alert('Could not assign rider', error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge">Assign Dispatch Rider</Text>
            <Text variant="bodySmall" style={styles.muted}>The job moves to Out for Delivery and the rider is notified.</Text>
            <ScrollView style={styles.list}>
              {!riders.length && <Text>No dispatch riders yet. An admin can invite a delivery agent.</Text>}
              <RadioButton.Group value={riderId || ''} onValueChange={setRiderId}>
                {riders.map((rider) => (
                  <RadioButton.Item key={rider.id} value={rider.id} label={rider.phone ? `${rider.name} (${rider.phone})` : rider.name} />
                ))}
              </RadioButton.Group>
            </ScrollView>
            <View style={styles.row}>
              <Button mode="outlined" onPress={onDismiss} disabled={busy} style={styles.button}>Cancel</Button>
              <Button mode="contained" onPress={assign} loading={busy} disabled={busy || !riderId} style={styles.button}>Assign</Button>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', padding: 20 },
  card: { maxHeight: '80%' },
  list: { maxHeight: 320, marginVertical: 12 },
  row: { flexDirection: 'row', gap: 8 },
  button: { flex: 1 },
  muted: { color: '#8c8c8c', marginTop: 4 },
});
