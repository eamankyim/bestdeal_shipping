import React, { useEffect, useState } from 'react';
import { Spin, Timeline, Typography } from 'antd';
import { jobAPI } from '../../utils/api';

const { Text } = Typography;

const FIELD_LABELS = {
  referenceNumber: 'Reference number',
  receiverName: 'Receiver name',
  receiverAddress: 'Receiver address',
  receiverContact: 'Receiver phone',
  freightType: 'Freight type',
  customerId: 'Customer',
  pickupAddress: 'Pickup address',
  deliveryAddress: 'Delivery address',
  pickupDate: 'Pickup date',
  estimatedDelivery: 'Expected delivery',
  specialInstructions: 'Special instructions',
  priority: 'Priority',
  description: 'Package details',
  weight: 'Weight',
  quantity: 'Quantity',
  value: 'Value',
  status: 'Status',
  packages: 'Packages',
  dimensionsLength: 'Length',
  dimensionsWidth: 'Width',
  dimensionsHeight: 'Height',
};

const display = (field, value) => {
  if (value === null || value === undefined || value === '') return 'empty';
  if (['pickupDate', 'estimatedDelivery'].includes(field)) return new Date(value).toLocaleDateString();
  return String(value);
};

/** What earlier edits changed, including the values they replaced. */
const JobEditHistory = ({ jobId, refreshKey }) => {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setHistory(null);
    setError(null);
    jobAPI.getEditHistory(jobId)
      .then((response) => !cancelled && setHistory(response.data.history))
      .catch((err) => !cancelled && setError(err.message || 'Failed to load edit history'));
    return () => { cancelled = true; };
  }, [jobId, refreshKey]);

  if (error) return <Text type="danger">{error}</Text>;
  if (!history) return <Spin />;
  if (history.length === 0) return <Text type="secondary">This job has not been edited yet</Text>;

  return (
    <Timeline
      items={history.map((entry) => ({
        key: entry.id,
        children: (
          <>
            <Text strong>{entry.editedBy}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}> • {new Date(entry.timestamp).toLocaleString()}</Text>
            {entry.changes.map((change) => (
              <div key={change.field}>
                <Text>{FIELD_LABELS[change.field] || change.field}: </Text>
                <Text type="secondary">{display(change.field, change.from)}</Text>
                {' → '}
                <Text>{display(change.field, change.to)}</Text>
              </div>
            ))}
          </>
        ),
      }))}
    />
  );
};

export default JobEditHistory;
