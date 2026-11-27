import React, { useState } from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  BoxPlotOutlined, CarOutlined, ClockCircleOutlined, InboxOutlined, PlusOutlined, ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../utils/api';
import { canCreateJobs } from '../utils/permissions';
import { canCreateBatch, formatBatchStatusLabel, getBatchStatusColor } from '../constants/jobStatuses';
import JobQueue, { StatCards } from '../components/dashboard/JobQueue';
import { DashboardLoading, useDashboard } from '../components/dashboard/useDashboard';
import ResponsiveTable from '../components/common/ResponsiveTable';
import JobDrawer from '../components/jobs/LazyJobDrawer';

const { Title, Text } = Typography;

/** UK warehouse: getting parcels in from customers and drivers, and into batches. */
const WarehouseDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data, error, reload } = useDashboard(dashboardAPI.getUKWarehouse);
  const [openJobId, setOpenJobId] = useState(null);
  if (!data) return <DashboardLoading error={error} retry={reload} />;

  const stats = [
    { title: 'Waiting for a Driver', value: data.needsDriver.count, icon: <ClockCircleOutlined />, color: '#faad14' },
    { title: 'Coming In', value: data.comingIn.count, icon: <CarOutlined />, color: '#1890ff', note: 'With drivers now' },
    { title: 'Waiting for a Batch', value: data.atWarehouse.count, icon: <InboxOutlined />, color: '#2f54eb', note: `${data.atWarehouse.totalWeight.toFixed(1)} kg` },
    { title: 'Received Today', value: data.receivedToday, icon: <BoxPlotOutlined />, color: '#52c41a' },
    { title: 'Batches Being Prepared', value: data.batchesInPreparation.length, icon: <ShoppingOutlined />, color: '#722ed1' },
  ];

  return (
    <div style={{ padding: 24 }} className="dashboard-page-container">
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}><BoxPlotOutlined /> UK Warehouse</Title>
          <Text type="secondary">Collections, parcels arriving at the warehouse, and batches to Ghana</Text>
        </Col>
        <Col>
          <Space wrap>
            {canCreateBatch() && <Button onClick={() => navigate('/batch-management')}>Batches</Button>}
            {canCreateJobs(currentUser) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/jobs', { state: { openNewJobModal: true } })}>New Job</Button>
            )}
          </Space>
        </Col>
      </Row>

      <StatCards stats={stats} />

      <JobQueue
        title="Waiting for a Driver"
        icon={<ClockCircleOutlined />}
        queue={data.needsDriver}
        columns={['trackingId', 'customer', 'status', 'pickup', 'pickupDate']}
        actions={[
          { assign: 'driver', label: 'Assign Driver', primary: true },
          { status: 'at_uk_warehouse' },
        ]}
        empty="Every job has a driver"
        status="pending_collection"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Coming In"
        icon={<CarOutlined />}
        queue={data.comingIn}
        columns={['trackingId', 'customer', 'status', 'driver', 'pickupDate']}
        actions={[{ status: 'at_uk_warehouse', primary: true }]}
        empty="No parcels on their way in"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="At the Warehouse, Waiting for a Batch"
        icon={<InboxOutlined />}
        queue={data.atWarehouse}
        columns={['trackingId', 'customer', 'items', 'weight']}
        showWeight
        empty="Nothing waiting for a batch"
        status="at_uk_warehouse"
        onOpen={setOpenJobId}
        onChanged={reload}
      />

      <Card
        title={<Space><ShoppingOutlined /><span>Batches Being Prepared</span><Tag>{data.batchesInPreparation.length}</Tag></Space>}
        extra={<Text type="secondary">{Object.entries(data.batchCounts).filter(([, n]) => n > 0).map(([key, n]) => `${formatBatchStatusLabel(key)}: ${n}`).join(' · ')}</Text>}
      >
        <ResponsiveTable
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data.batchesInPreparation}
          locale={{ emptyText: 'No batches being prepared' }}
          onCardClick={() => navigate('/batch-management')}
          columns={[
            { title: 'Batch', key: 'batch', mobile: true, render: (_, batch) => <Text strong>{batch.name || batch.batchId}</Text> },
            { title: 'Status', key: 'status', mobile: true, render: (_, batch) => <Tag color={getBatchStatusColor(batch.status)}>{formatBatchStatusLabel(batch.status)}</Tag> },
            { title: 'Jobs', key: 'jobs', mobile: true, render: (_, batch) => batch._count?.jobs ?? batch.totalJobs },
            { title: 'Ships', key: 'ships', mobile: false, render: (_, batch) => (batch.estimatedShipDate ? new Date(batch.estimatedShipDate).toLocaleDateString() : '—') },
            { title: '', key: 'open', mobile: true, render: () => <Button size="small" onClick={() => navigate('/batch-management')}>Open Batches</Button> },
          ]}
        />
      </Card>

      <JobDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} onChanged={reload} />
    </div>
  );
};

export default WarehouseDashboard;
