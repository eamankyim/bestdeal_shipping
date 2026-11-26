import React, { useState } from 'react';
import { Button, Card, Col, Modal, Row, Space, Tag, Typography, message } from 'antd';
import {
  CarOutlined, CheckCircleOutlined, EnvironmentOutlined, InboxOutlined, RocketOutlined, ShopOutlined,
} from '@ant-design/icons';
import { batchAPI, dashboardAPI } from '../utils/api';
import { formatBatchStatusLabel, getBatchStatusColor, nextBatchStatuses } from '../constants/jobStatuses';
import JobQueue, { StatCards } from '../components/dashboard/JobQueue';
import { DashboardLoading, useDashboard } from '../components/dashboard/useDashboard';
import ResponsiveTable from '../components/common/ResponsiveTable';
import JobDrawer from '../components/jobs/JobDrawer';

const { Title, Text } = Typography;
const date = (value) => (value ? new Date(value).toLocaleDateString() : '—');

/** Ghana warehouse: batches arriving, checking parcels in, and handing them to dispatch riders. */
const GhanaWarehouseDashboardPage = () => {
  const { data, error, reload } = useDashboard(dashboardAPI.getGhanaWarehouse);
  const [openJobId, setOpenJobId] = useState(null);
  if (!data) return <DashboardLoading error={error} retry={reload} />;

  const markArrived = (batch) => Modal.confirm({
    title: `Has ${batch.name || batch.batchId} arrived?`,
    content: `Its ${batch._count?.jobs ?? batch.totalJobs} jobs become Arrived in Ghana, ready to be checked in.`,
    okText: 'Yes, it has arrived',
    onOk: async () => {
      try {
        await batchAPI.updateStatus(batch.id, { status: 'arrived' });
        message.success(`${batch.name || batch.batchId} has arrived`);
        reload();
      } catch (err) {
        message.error(err.message || 'Failed to mark the batch as arrived');
      }
    },
  });

  const stats = [
    { title: 'On the Way', value: data.onTheWay.count, icon: <RocketOutlined />, color: '#2f54eb', note: `${data.batchesOnTheWay.length} batches` },
    { title: 'To Check In', value: data.toCheck.count, icon: <InboxOutlined />, color: '#faad14' },
    { title: 'Waiting for a Rider', value: data.needsRider.count, icon: <EnvironmentOutlined />, color: '#13c2c2' },
    { title: 'Out for Delivery', value: data.outForDelivery.count, icon: <CarOutlined />, color: '#d46b08' },
    { title: 'Delivered Today', value: data.deliveredToday, icon: <CheckCircleOutlined />, color: '#52c41a' },
  ];

  return (
    <div style={{ padding: 24 }} className="dashboard-page-container">
      <Row justify="space-between" align="middle" gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}><ShopOutlined /> Ghana Warehouse</Title>
          <Text type="secondary">Batches arriving, checking parcels in, and dispatch</Text>
        </Col>
      </Row>

      <StatCards stats={stats} />

      <Card
        title={<Space><RocketOutlined /><span>Batches on the Way</span><Tag>{data.batchesOnTheWay.length}</Tag></Space>}
        style={{ marginBottom: 24 }}
      >
        <ResponsiveTable
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={data.batchesOnTheWay}
          locale={{ emptyText: 'No batches on the way' }}
          columns={[
            { title: 'Batch', dataIndex: 'batchId', key: 'batch', mobile: true, render: (_, batch) => <Text strong>{batch.name || batch.batchId}</Text> },
            { title: 'Status', dataIndex: 'status', key: 'status', mobile: true, render: (_, batch) => <Tag color={getBatchStatusColor(batch.status)}>{formatBatchStatusLabel(batch.status)}</Tag> },
            { title: 'Jobs', key: 'jobs', mobile: true, render: (_, batch) => batch._count?.jobs ?? batch.totalJobs },
            { title: 'Shipped', key: 'shipped', mobile: false, render: (_, batch) => date(batch.shippedAt) },
            { title: 'Expected', key: 'eta', mobile: false, render: (_, batch) => date(batch.estimatedArrival) },
            {
              // key 'actions': on phones the button shows when a batch is tapped (ResponsiveTable)
              title: '',
              key: 'actions',
              mobile: true,
              render: (_, batch) => nextBatchStatuses(batch).includes('arrived') && (
                <Button size="small" type="primary" onClick={(event) => { event.stopPropagation(); markArrived(batch); }}>
                  Mark {formatBatchStatusLabel('arrived')}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <JobQueue
        title="To Check In"
        icon={<InboxOutlined />}
        queue={data.toCheck}
        columns={['trackingId', 'customer', 'receiver', 'delivery', 'batch']}
        actions={[{ status: 'ready_for_delivery', label: 'Checked', primary: true }]}
        empty="Nothing waiting to be checked in"
        status="arrived_in_ghana"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Waiting for a Dispatch Rider"
        icon={<EnvironmentOutlined />}
        queue={data.needsRider}
        columns={['trackingId', 'status', 'receiver', 'delivery', 'rider']}
        actions={[{ assign: 'rider', label: 'Assign Rider', primary: true }]}
        empty="Every checked parcel has a rider"
        status="ready_for_delivery"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Out for Delivery"
        icon={<CarOutlined />}
        queue={data.outForDelivery}
        columns={['trackingId', 'receiver', 'delivery', 'rider']}
        actions={[
          { status: 'delivered', label: 'Delivered', primary: true },
          { status: 'failed_delivery', label: 'Could Not Deliver', danger: true },
          { assign: 'rider', label: 'Change Rider' },
        ]}
        empty="Nothing out for delivery"
        status="out_for_delivery"
        onOpen={setOpenJobId}
        onChanged={reload}
      />

      <JobDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} onChanged={reload} />
    </div>
  );
};

export default GhanaWarehouseDashboardPage;
