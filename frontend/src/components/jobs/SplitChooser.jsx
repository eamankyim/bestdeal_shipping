import React, { useEffect, useState } from 'react';
import { Button, InputNumber, Modal, Space, Table, Typography, message } from 'antd';
import { jobAPI } from '../../utils/api';
import { lineLabel, linesOf } from '../../utils/packages';

const { Text } = Typography;

/**
 * How many of each item go now; the rest waits. `value` is one number per item line.
 * `nowLabel` / `laterLabel` name the two sides ("In this batch" / "Later batch").
 */
export const SplitChooser = ({ lines, value, onChange, nowLabel = 'Goes now', laterLabel = 'Waits for a later batch' }) => (
  <Table
    size="small"
    pagination={false}
    rowKey={(_, index) => index}
    dataSource={lines}
    columns={[
      { title: 'Item', key: 'item', render: (_, line) => lineLabel(line) },
      {
        title: nowLabel,
        key: 'now',
        width: 140,
        render: (_, line, index) => (
          <InputNumber
            min={0}
            max={Number(line.quantity) || 1}
            precision={0}
            value={value[index]}
            aria-label={`${nowLabel}: ${line.description || line.packageType || index + 1}`}
            onChange={(count) => onChange(value.map((current, i) => (i === index ? (count ?? 0) : current)))}
          />
        ),
      },
      { title: laterLabel, key: 'later', width: 170, render: (_, line, index) => (Number(line.quantity) || 1) - (value[index] ?? 0) },
    ]}
  />
);

/** Everything going now: the starting point for a choice. */
export const allNow = (job) => linesOf(job).map((line) => Number(line.quantity) || 1);
export const isPartial = (job, going) => Boolean(going) && going.some((count, index) => count < allNow(job)[index]);

/**
 * Split Job from the job drawer: what stays in this job and what becomes a new part waiting for a
 * later batch. Pass the job to open it.
 */
export const SplitJobModal = ({ job, onClose, onDone }) => {
  const [going, setGoing] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (job) setGoing(allNow(job));
  }, [job]);

  const save = async () => {
    setSaving(true);
    try {
      const response = await jobAPI.split(job.id, going);
      message.success(`Split: ${response.data.part.trackingId} waits for a later batch`);
      onDone?.(response.data);
      onClose();
    } catch (error) {
      message.error(error.message || 'Failed to split the job');
    } finally {
      setSaving(false);
    }
  };

  const keeps = going.reduce((sum, count) => sum + (count || 0), 0);
  const moves = allNow(job || {}).reduce((sum, count, index) => sum + count - (going[index] || 0), 0);
  return (
    <Modal
      title={`Split Job - ${job?.trackingId || ''}`}
      open={Boolean(job)}
      onCancel={onClose}
      zIndex={1100} // above the job details drawer it is opened from
      footer={[
        <Button key="cancel" onClick={onClose}>Cancel</Button>,
        <Button key="split" type="primary" loading={saving} disabled={keeps === 0 || moves === 0} onClick={save}>Split</Button>,
      ]}
    >
      <Typography.Paragraph type="secondary">
        What stays goes in the next batch as this job. The rest becomes a new part of the same order, with its own tracking number, delivery and invoice.
      </Typography.Paragraph>
      {job && <SplitChooser lines={linesOf(job)} value={going} onChange={setGoing} nowLabel="Stays in this job" laterLabel="Moves to a new part" />}
      <Space style={{ marginTop: 12 }}>
        <Text type="secondary">{keeps} stay · {moves} move to the new part</Text>
      </Space>
      {Number(job?.amountPaid) > 0 && (
        <Typography.Paragraph type="warning" style={{ marginTop: 8, marginBottom: 0 }}>
          Payments recorded so far stay on this job.
        </Typography.Paragraph>
      )}
    </Modal>
  );
};

export default SplitChooser;
