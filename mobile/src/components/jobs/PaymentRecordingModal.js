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
  RadioButton,
  Divider,
} from 'react-native-paper';
import { jobService } from '../../services/jobService';

export default function PaymentRecordingModal({
  visible,
  onDismiss,
  job,
  invoiceAmount = 0,
  onPaymentRecorded,
}) {
  const [paymentType, setPaymentType] = useState('full');
  const [amountPaid, setAmountPaid] = useState(invoiceAmount.toString());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && job) {
      setPaymentType('full');
      setAmountPaid(invoiceAmount.toString());
      setPaymentMethod('Cash');
      setPaymentReference('');
      setNotes('');
    }
  }, [visible, job, invoiceAmount]);

  const handleSubmit = async () => {
    if (paymentType === 'part' && (!amountPaid || parseFloat(amountPaid) <= 0)) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (paymentType === 'part' && parseFloat(amountPaid) > invoiceAmount) {
      Alert.alert('Error', `Payment amount cannot exceed invoice amount of £${invoiceAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        paymentType: paymentType, // 'full' or 'part'
        amountPaid: paymentType === 'full' ? invoiceAmount : parseFloat(amountPaid),
        paymentMethod: paymentMethod, // 'POS', 'Bank', 'Cash'
        paymentReference: paymentReference || '',
        notes: notes || '',
      };

      const response = await jobService.recordPayment(job.id, paymentData);
      
      if (response.success) {
        Alert.alert('Success', 'Payment recorded successfully!');
        onDismiss();
        if (onPaymentRecorded) {
          onPaymentRecorded();
        }
        // Reset form
        setPaymentType('full');
        setAmountPaid(invoiceAmount.toString());
        setPaymentMethod('Cash');
        setPaymentReference('');
        setNotes('');
      } else {
        Alert.alert('Error', response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Failed to record payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const remainingBalance = paymentType === 'part' 
    ? (invoiceAmount - (parseFloat(amountPaid) || 0)).toFixed(2)
    : '0.00';

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
              Record Payment
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Job: {job?.trackingId || 'N/A'}
            </Text>
            <Text variant="bodyMedium" style={styles.invoiceAmount}>
              Invoice Amount: £{invoiceAmount.toFixed(2)}
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Payment Type
            </Text>
            <RadioButton.Group
              onValueChange={setPaymentType}
              value={paymentType}
            >
              <RadioButton.Item
                label={`Full Payment (£${invoiceAmount.toFixed(2)})`}
                value="full"
              />
              <RadioButton.Item
                label="Part Payment"
                value="part"
              />
            </RadioButton.Group>

            {paymentType === 'part' && (
              <>
                <TextInput
                  label="Amount Paid (£)"
                  value={amountPaid}
                  onChangeText={setAmountPaid}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={styles.input}
                />
                <View style={styles.balanceContainer}>
                  <Text variant="bodyMedium" style={styles.balanceLabel}>
                    Remaining Balance:
                  </Text>
                  <Text variant="titleLarge" style={styles.balanceAmount}>
                    £{remainingBalance}
                  </Text>
                </View>
              </>
            )}

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Payment Method
            </Text>
            <RadioButton.Group
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <RadioButton.Item label="POS" value="POS" />
              <RadioButton.Item label="Bank Transfer" value="Bank" />
              <RadioButton.Item label="Cash" value="Cash" />
            </RadioButton.Group>

            <TextInput
              label="Payment Reference (Optional)"
              value={paymentReference}
              onChangeText={setPaymentReference}
              mode="outlined"
              style={styles.input}
              placeholder="Transaction ID, receipt number, etc."
            />

            <TextInput
              label="Notes (Optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Any additional notes about this payment"
            />

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
                disabled={loading}
                style={styles.button}
              >
                Record Payment
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
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 4,
    color: '#8c8c8c',
  },
  invoiceAmount: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#ff9800', // Orange
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    marginBottom: 16,
  },
  balanceLabel: {
    color: '#8c8c8c',
  },
  balanceAmount: {
    fontWeight: 'bold',
    color: '#f5222d',
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

