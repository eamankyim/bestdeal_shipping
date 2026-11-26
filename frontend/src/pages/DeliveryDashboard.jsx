import React, { useState } from 'react';
import { Typography } from 'antd';
import { CarOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../utils/api';
import JobQueue, { StatCards } from '../components/dashboard/JobQueue';
import { DashboardLoading, useDashboard } from '../components/dashboard/useDashboard';
import JobDrawer from '../components/jobs/JobDrawer';

const { Title, Text } = Typography;

/** A dispatch rider's own deliveries. */
const DeliveryDashboard = () => {
  const { currentUser } = useAuth();
  const { data, error, reload } = useDashboard(dashboardAPI.getDelivery);
  const [openJobId, setOpenJobId] = useState(null);
  if (!data) return <DashboardLoading error={error} retry={reload} />;

  const stats = [
    { title: 'To Deliver', value: data.toDeliver.count, icon: <CarOutlined />, color: '#d46b08' },
    { title: 'Delivered Today', value: data.deliveredToday, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: 'Could Not Deliver', value: data.failed.count, icon: <CloseCircleOutlined />, color: data.failed.count ? '#cf1322' : '#8c8c8c', note: 'Back with the Ghana warehouse' },
  ];

  return (
    <div style={{ padding: 24 }} className="dashboard-page-container">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}><CarOutlined /> My Deliveries</Title>
        <Text type="secondary">Hello {currentUser?.name}. Take a photo of each item as you hand it over.</Text>
      </div>

      <StatCards stats={stats} />

      <JobQueue
        title="To Deliver"
        icon={<CarOutlined />}
        queue={data.toDeliver}
        columns={['trackingId', 'receiver', 'delivery', 'expected']}
        actions={[
          { status: 'delivered', label: 'Delivered', primary: true },
          { status: 'failed_delivery', label: 'Could Not Deliver', danger: true },
        ]}
        empty="Nothing to deliver right now"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Could Not Deliver"
        icon={<CloseCircleOutlined />}
        queue={data.failed}
        columns={['trackingId', 'receiver', 'delivery']}
        empty="None"
        onOpen={setOpenJobId}
        onChanged={reload}
      />
      <JobQueue
        title="Delivered Recently"
        icon={<CheckCircleOutlined />}
        queue={data.delivered}
        columns={['trackingId', 'receiver', 'delivery']}
        empty="Nothing delivered yet"
        onOpen={setOpenJobId}
        onChanged={reload}
      />

      <JobDrawer jobId={openJobId} onClose={() => setOpenJobId(null)} onChanged={reload} />
    </div>
  );
};

export default DeliveryDashboard;
