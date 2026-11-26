import React, { useState } from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ResponsiveTable from '../common/ResponsiveTable';
import StatusChangeModal from '../jobs/StatusChangeModal';
import AssignPersonModal from '../jobs/AssignPersonModal';
import {
  canAssignDriver, canAssignRider, formatJobStatusLabel, getStatusColor, nextJobStatuses,
} from '../../constants/jobStatuses';

const { Text } = Typography;
const date = (value) => (value ? new Date(value).toLocaleDateString() : '—');

// The columns a dashboard can choose from
const COLUMNS = {
  trackingId: { title: 'Tracking ID', dataIndex: 'trackingId', key: 'trackingId', mobile: true, render: (value) => <Text strong>{value}</Text> },
  customer: { title: 'Customer', key: 'customer', mobile: true, render: (_, job) => job.customer?.name || 'N/A' },
  phone: { title: 'Phone', key: 'phone', mobile: false, render: (_, job) => job.customer?.phone || '—' },
  receiver: { title: 'Receiver', key: 'receiver', mobile: false, render: (_, job) => (job.receiverName ? `${job.receiverName}${job.receiverContact ? ` (${job.receiverContact})` : ''}` : '—') },
  pickup: { title: 'Pickup', dataIndex: 'pickupAddress', key: 'pickup', ellipsis: true, mobile: false },
  delivery: { title: 'Delivery', dataIndex: 'deliveryAddress', key: 'delivery', ellipsis: true, mobile: false },
  pickupDate: { title: 'Pickup Date', key: 'pickupDate', mobile: false, render: (_, job) => date(job.pickupDate) },
  expected: { title: 'Expected', key: 'expected', mobile: false, render: (_, job) => date(job.estimatedDelivery) },
  driver: { title: 'Driver', key: 'driver', mobile: false, render: (_, job) => job.assignedDriver?.name || <Text type="secondary">None</Text> },
  rider: { title: 'Dispatch Rider', key: 'rider', mobile: false, render: (_, job) => job.assignedDeliveryAgent?.name || <Text type="secondary">None</Text> },
  batch: { title: 'Batch', key: 'batch', mobile: false, render: (_, job) => (job.batch ? job.batch.name || job.batch.batchId : '—') },
  weight: { title: 'Weight', key: 'weight', mobile: false, render: (_, job) => (job.weight ? `${Number(job.weight)} kg` : '—') },
  // dataIndex lets the phone card layout (ResponsiveTable) find the status
  status: { title: 'Status', dataIndex: 'status', key: 'status', mobile: true, render: (_, job) => <Tag color={getStatusColor(job.status)}>{formatJobStatusLabel(job.status)}</Tag> },
};

/**
 * A list of jobs a team has to work on, as returned by a dashboard endpoint ({ count, totalWeight, jobs }).
 * `actions` are quick buttons for the next step: { status: 'collected' } or { assign: 'rider' }.
 * A button only shows on a job when the backend allows that step (constants/jobStatuses.js).
 * `status` lets "see all" open the Jobs page filtered to that status.
 */
const JobQueue = ({
  title, icon, queue, columns = ['trackingId', 'customer', 'status'], actions = [], onOpen, onChanged,
  empty = 'Nothing here right now', showWeight = false, status,
}) => {
  const navigate = useNavigate();
  const [move, setMove] = useState(null);
  const [assign, setAssign] = useState(null);

  const buttonsFor = (job) => actions.filter((action) => (action.status
    ? nextJobStatuses(job).includes(action.status)
    : (action.assign === 'driver' ? canAssignDriver(job) : canAssignRider(job))));

  const actionColumn = {
    title: 'Actions',
    key: 'actions',
    mobile: true,
    render: (_, job) => (
      <Space wrap size={4} onClick={(event) => event.stopPropagation()}>
        {buttonsFor(job).map((action) => (
          <Button
            key={action.status || action.assign}
            size="small"
            type={action.primary ? 'primary' : 'default'}
            danger={action.danger}
            onClick={() => (action.status ? setMove({ job, status: action.status }) : setAssign({ job, kind: action.assign }))}
          >
            {action.label || formatJobStatusLabel(action.status)}
          </Button>
        ))}
        <Button size="small" icon={<EyeOutlined />} onClick={() => onOpen(job.id)}>Open</Button>
      </Space>
    ),
  };

  const jobs = queue?.jobs || [];
  return (
    <Card
      title={<Space>{icon}<span>{title}</span><Tag color={queue?.count ? 'blue' : 'default'}>{queue?.count || 0}</Tag></Space>}
      extra={showWeight && queue?.totalWeight ? <Text type="secondary">{queue.totalWeight.toFixed(1)} kg in all</Text> : null}
      style={{ marginBottom: 24 }}
    >
      <ResponsiveTable
        columns={[...columns.map((key) => COLUMNS[key]), actionColumn]}
        dataSource={jobs}
        rowKey="id"
        pagination={false}
        size="small"
        locale={{ emptyText: empty }}
        onCardClick={(job) => onOpen(job.id)}
      />
      {queue && queue.count > jobs.length && (
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">Showing {jobs.length} of {queue.count}. </Text>
          {status && <Button type="link" size="small" onClick={() => navigate('/jobs', { state: { status } })}>See them all on the Jobs page</Button>}
        </div>
      )}
      <StatusChangeModal job={move?.job} status={move?.status} onClose={() => setMove(null)} onDone={onChanged} />
      <AssignPersonModal job={assign?.job} kind={assign?.kind} onClose={() => setAssign(null)} onDone={onChanged} />
    </Card>
  );
};

/** A row of numbers at the top of a dashboard: [{ title, value, icon, color, suffix, prefix }] */
export const StatCards = ({ stats }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
    {stats.map((stat) => (
      <Card key={stat.title} size="small">
        <Text type="secondary">{stat.title}</Text>
        <div style={{ fontSize: 28, fontWeight: 600, color: stat.color, display: 'flex', alignItems: 'center', gap: 8 }}>
          {stat.icon}
          <span>{stat.prefix}{stat.value}{stat.suffix}</span>
        </div>
        {stat.note && <Text type="secondary" style={{ fontSize: 12 }}>{stat.note}</Text>}
      </Card>
    ))}
  </div>
);

export default JobQueue;
