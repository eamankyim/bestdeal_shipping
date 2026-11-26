import React from 'react';
import { Alert, Descriptions, Modal, Space, Table, Tag, Typography } from 'antd';
import { formatBatchStatusLabel } from '../../constants/jobStatuses';

const { Text } = Typography;

// What happens to the batch and its jobs, said before anyone confirms
const CONSEQUENCES = {
  ready_to_ship: 'The batch is packed and waiting to go. You can still edit it or set it back to In Preparation.',
  shipped: 'Every job in it becomes Shipped and customers are told (if those messages are switched on). The batch can no longer be edited.',
};

/**
 * A full summary of a batch to check before marking it Ready to Ship or Shipped.
 * `batch` is the batch as listed on the Batches page; `status` is the status it is moving to.
 */
const BatchSummaryModal = ({ batch, status, showValue, loading, onConfirm, onCancel }) => {
  const jobs = batch?.jobs || [];
  const items = jobs.reduce((sum, job) => sum + (Number(job.quantity) || 1), 0);
  const weight = jobs.reduce((sum, job) => sum + (Number(job.weight) || 0), 0);
  const value = jobs.reduce((sum, job) => sum + (Number(job.value) || 0), 0);
  const label = formatBatchStatusLabel(status);

  // Things worth a second look before the batch moves on
  const missing = [
    !batch?.trackingNumber && 'container number',
    !batch?.sealNumber && 'seal number',
    !batch?.carrier && 'vessel or flight',
    !batch?.estimatedShipDate && 'departure date',
  ].filter(Boolean);

  return (
    <Modal
      title={`Mark ${batch?.name || batch?.batchId || 'batch'} as ${label}?`}
      open={Boolean(batch && status)}
      width={960}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={`Yes, Mark as ${label}`}
      cancelText="Go Back"
      confirmLoading={loading}
      zIndex={1100} // above the batch details drawer it is opened from
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>{CONSEQUENCES[status]}</Text>

      {missing.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Not filled in yet: ${missing.join(', ')}`}
          description="You can still go ahead, or go back and edit the batch first."
        />
      )}

      <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Batch">{batch?.name} <Text type="secondary">({batch?.batchId})</Text></Descriptions.Item>
        <Descriptions.Item label="Route">{batch?.route || '—'}</Descriptions.Item>
        <Descriptions.Item label="Vessel / Flight">{batch?.carrier || '—'}</Descriptions.Item>
        <Descriptions.Item label="Container Number">{batch?.trackingNumber || '—'}</Descriptions.Item>
        <Descriptions.Item label="Seal Number">{batch?.sealNumber || '—'}</Descriptions.Item>
        <Descriptions.Item label="Departure">{batch?.departureDate || '—'}</Descriptions.Item>
        <Descriptions.Item label="Expected Arrival">{batch?.eta || '—'}</Descriptions.Item>
        <Descriptions.Item label="In This Batch">
          <Text strong>{jobs.length} job{jobs.length === 1 ? '' : 's'} · {items} item{items === 1 ? '' : 's'} · {Math.round(weight * 100) / 100} kg{showValue ? ` · £${value.toFixed(2)}` : ''}</Text>
        </Descriptions.Item>
        {batch?.notes && <Descriptions.Item label="Notes" span={2}><Text style={{ whiteSpace: 'pre-wrap' }}>{batch.notes}</Text></Descriptions.Item>}
      </Descriptions>

      <Table
        size="small"
        rowKey="id"
        pagination={false}
        dataSource={jobs}
        columns={[
          {
            title: 'Tracking ID',
            key: 'trackingId',
            render: (_, job) => (
              <Space size={4}>
                <Text strong>{job.trackingId}</Text>
                {job.partNumber && <Tag>Part {job.partNumber}</Tag>}
              </Space>
            ),
          },
          { title: 'Customer', key: 'customer', render: (_, job) => job.customer?.name || '—' },
          { title: 'Items', key: 'items', render: (_, job) => job.description || `${job.quantity || 1} item${job.quantity > 1 ? 's' : ''}` },
          { title: 'Weight', key: 'weight', render: (_, job) => (job.weight ? `${Number(job.weight)} kg` : '—') },
          ...(showValue ? [{ title: 'Value', key: 'value', render: (_, job) => (job.value ? `£${Number(job.value).toFixed(2)}` : '—') }] : []),
          { title: 'Delivery', key: 'delivery', ellipsis: true, render: (_, job) => job.deliveryAddress || '—' },
        ]}
      />
    </Modal>
  );
};

export default BatchSummaryModal;
