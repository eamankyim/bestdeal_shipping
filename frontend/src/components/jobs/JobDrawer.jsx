import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Drawer, Dropdown, Modal, Space, Spin, Tabs, Tag, Timeline, Typography, message } from 'antd';
import {
  CarOutlined, DeleteOutlined, DollarOutlined, EditOutlined, EnvironmentOutlined, EyeOutlined,
  FileTextOutlined, MailOutlined, MoreOutlined, PhoneOutlined, ScissorOutlined, UndoOutlined, UserOutlined,
} from '@ant-design/icons';
import { jobAPI } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { canEditJobs, hasFullAccess, hasPermission, isStaffMember } from '../../utils/permissions';
import {
  actionLabel, canAssignDriver, canAssignRider, canSplitJob, formatJobStatusLabel, getStatusColor, isFinalStatus, jobStatusInfo, nextJobStatuses,
} from '../../constants/jobStatuses';
import { itemCount, lineLabel } from '../../utils/packages';
import { SplitJobModal } from './SplitChooser';
import StatusChangeModal from './StatusChangeModal';
import AssignPersonModal from './AssignPersonModal';
import JobEditModal from './JobEditModal';
import JobEditHistory from './JobEditHistory';
import JobNoteModal from './JobNoteModal';
import JobNotes from './JobNotes';
import JobPhotos from './JobPhotos';
import PaymentRecordingModal from './PaymentRecordingModal';
import StatusRevertModal from './StatusRevertModal';
import DocumentViewer from './DocumentViewer';

const { Text } = Typography;
const PHOTO_TYPES = ['photo', 'proof_of_delivery'];
const cardStyle = { marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 8 };

const InfoCard = ({ title, rows }) => {
  const shown = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (shown.length === 0) return null;
  return (
    <Card size="small" title={<span className="user-info-title">{title}</span>} className="user-info-card" style={cardStyle}>
      <div className="user-info-list">
        {shown.map(([label, value]) => (
          <div className="user-info-item" key={label}>
            <div className="user-info-label">{label}</div>
            <div className="user-info-value">{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/** Tell other open tabs to refresh their lists. */
const announceChange = (jobId) => {
  const channel = new BroadcastChannel('job_updates');
  channel.postMessage({ type: 'JOB_STATUS_UPDATED', jobId, timestamp: new Date().toISOString() });
  channel.close();
};

/**
 * One job, with everything that can be done to it. Used by the Jobs page and every dashboard, so
 * a job looks and behaves the same wherever it is opened. Which actions show depends on the
 * job's status and the user's role, as decided by the backend (constants/jobStatuses.js).
 */
const JobDrawer = ({ jobId, onClose, onChanged }) => {
  const { currentUser } = useAuth();
  // The job shown; it can switch to another part of the same order from inside the drawer
  const [shownId, setShownId] = useState(jobId);
  const [job, setJob] = useState(null);
  const [splitting, setSplitting] = useState(false);
  const [moveTo, setMoveTo] = useState(null);
  const [assignKind, setAssignKind] = useState(null);
  const [editing, setEditing] = useState(false);
  const [noting, setNoting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setShownId(jobId), [jobId]);

  const load = useCallback(async () => {
    if (!shownId) return;
    try {
      const response = await jobAPI.getById(shownId);
      setJob(response.data.job);
    } catch (error) {
      message.error(error.message || 'Failed to load the job');
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another job is opened
  }, [shownId]);

  useEffect(() => {
    setJob(null);
    load();
  }, [load]);

  const changed = async () => {
    announceChange(shownId);
    await load();
    onChanged?.();
  };

  const canViewRevenue = hasPermission(currentUser, 'financial:view');
  const canPay = hasFullAccess(currentUser) || currentUser?.role === 'finance';
  const office = hasFullAccess(currentUser);

  const remove = () => Modal.confirm({
    title: `Delete ${job.trackingId}?`,
    content: 'The job and its history are removed for good.',
    okText: 'Delete',
    okType: 'danger',
    zIndex: 1100,
    onOk: async () => {
      try {
        await jobAPI.delete(job.id);
        message.success('Job deleted');
        announceChange(job.id);
        onChanged?.();
        onClose();
      } catch (error) {
        message.error(error.message || 'Failed to delete the job');
      }
    },
  });

  const recordPayment = async (payment) => {
    setBusy(true);
    try {
      await jobAPI.recordPayment(job.id, payment);
      message.success('Payment recorded');
      setPaying(false);
      await changed();
    } catch (error) {
      message.error(error.message || 'Failed to record payment');
    } finally {
      setBusy(false);
    }
  };

  const undo = async ({ previousStatus, comment }) => {
    setBusy(true);
    try {
      await jobAPI.revertStatus(job.id, { previousStatus, comment });
      message.success(`Status set back to ${formatJobStatusLabel(previousStatus)}`);
      setUndoing(false);
      await changed();
    } catch (error) {
      message.error(error.message || 'Failed to undo the status');
    } finally {
      setBusy(false);
    }
  };

  // ---- What this user may do, as the backend decides it ----
  // The next steps (Check In, Delivered, Assign Rider…) are buttons on show; the rest is in the ⋮ menu
  const nextSteps = job ? [
    ...nextJobStatuses(job).filter((status) => status !== 'cancelled').map((status) => ({
      key: `move:${status}`, label: actionLabel(status), danger: Boolean(jobStatusInfo(status)?.problem),
    })),
    ...(canAssignDriver(job) ? [{ key: 'assign:driver', icon: <UserOutlined />, label: job.assignedDriver ? 'Change Driver' : 'Assign Driver' }] : []),
    ...(canAssignRider(job) ? [{ key: 'assign:rider', icon: <CarOutlined />, label: job.assignedDeliveryAgent ? 'Change Dispatch Rider' : 'Assign Dispatch Rider' }] : []),
  ] : [];

  const menuItems = [];
  if (job) {
    if (canEditJobs(currentUser) && !isFinalStatus(job.status)) {
      menuItems.push({ key: 'edit', icon: <EditOutlined />, label: job.status === 'draft' ? 'Edit or Book Draft' : 'Edit Job' });
    }
    if (isStaffMember(currentUser)) menuItems.push({ key: 'note', icon: <FileTextOutlined />, label: 'Add Note' });
    // Some items now, the rest in a later batch (only at the UK warehouse)
    if (canSplitJob(job) && itemCount(job) > 1) menuItems.push({ key: 'split', icon: <ScissorOutlined />, label: 'Split Job' });
    if (canPay && job.status !== 'draft') menuItems.push({ key: 'pay', icon: <DollarOutlined />, label: 'Record Payment' });
    if (office && (job.timeline || []).length > 1) menuItems.push({ key: 'undo', icon: <UndoOutlined />, label: 'Undo a Status Change' });
    if (nextJobStatuses(job).includes('cancelled')) menuItems.push({ type: 'divider' }, { key: 'move:cancelled', danger: true, label: actionLabel('cancelled') });
    if (office && ['draft', 'cancelled'].includes(job.status)) menuItems.push({ key: 'delete', danger: true, icon: <DeleteOutlined />, label: 'Delete Job' });
  }

  const onMenu = ({ key }) => {
    const [action, value] = key.split(':');
    if (action === 'move') setMoveTo(value);
    if (action === 'assign') setAssignKind(value);
    if (action === 'edit') setEditing(true);
    if (action === 'note') setNoting(true);
    if (action === 'split') setSplitting(true);
    if (action === 'pay') setPaying(true);
    if (action === 'undo') setUndoing(true);
    if (action === 'delete') remove();
  };

  const documents = (job?.documents || []).filter((doc) => !(PHOTO_TYPES.includes(doc.documentType) && (doc.mimeType || '').startsWith('image/')));

  return (
    <>
      <Drawer
        title={`Job Details - ${job?.trackingId || ''}${job?.partNumber ? ` (part ${job.partNumber})` : ''}`}
        placement="right"
        onClose={onClose}
        open={Boolean(jobId)}
        width={720}
        className="user-details-drawer"
        extra={menuItems.length > 0 && (
          <Dropdown menu={{ items: menuItems, onClick: onMenu }} trigger={['click']} placement="bottomRight">
            <Button type="text" aria-label="Job actions" icon={<MoreOutlined style={{ fontSize: 20 }} />} style={{ border: '1px solid #d9d9d9', borderRadius: 4 }} />
          </Dropdown>
        )}
      >
        {!job && <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>}
        {job && nextSteps.length > 0 && (
          <Card size="small" style={{ marginBottom: 16, background: '#fff7e6', borderColor: '#ffd591' }}>
            <Space wrap>
              <Text strong>Next step:</Text>
              {nextSteps.map((step, index) => (
                <Button
                  key={step.key}
                  type={index === 0 && !step.danger ? 'primary' : 'default'}
                  danger={step.danger}
                  icon={step.icon}
                  onClick={() => onMenu({ key: step.key })}
                >
                  {step.label}
                </Button>
              ))}
            </Space>
          </Card>
        )}
        {job && (
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Details',
                children: (
                  <>
                    <InfoCard
                      title="Status"
                      rows={[
                        ['Status', <Tag color={getStatusColor(job.status)}>{formatJobStatusLabel(job.status)}</Tag>],
                        ['Driver', job.assignedDriver?.name || <Text type="secondary">None</Text>],
                        ['Dispatch Rider', job.assignedDeliveryAgent?.name],
                        ['Batch', job.batch ? `${job.batch.name || ''} ${job.batch.batchId}`.trim() : null],
                      ]}
                    />
                    <InfoCard
                      title="Customer"
                      rows={[
                        ['Name', <Text strong>{job.customer?.name}</Text>],
                        ['Email', job.customer?.email && <span><MailOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.customer.email}</span>],
                        ['Phone', job.customer?.phone && <span><PhoneOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.customer.phone}</span>],
                        ['Type', job.customer?.customerType && <Tag color={job.customer.customerType === 'Company' ? 'blue' : 'green'}>{job.customer.customerType}</Tag>],
                      ]}
                    />
                    <InfoCard
                      title="Addresses"
                      rows={[
                        ['Pickup', job.pickupAddress && <span><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.pickupAddress}</span>],
                        ['Delivery', job.deliveryAddress && <span><EnvironmentOutlined style={{ color: '#1890ff', marginRight: 8 }} />{job.deliveryAddress}</span>],
                      ]}
                    />
                    <InfoCard title="Receiver" rows={[['Name', job.receiverName], ['Phone', job.receiverContact], ['Address', job.receiverAddress]]} />
                    {(job.parts || []).length > 1 && (
                      <Card size="small" title={<span className="user-info-title">This order travels in {job.parts.length} parts</span>} style={cardStyle}>
                        {job.parts.map((part) => (
                          <div key={part.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', gap: 8 }}>
                            <Space wrap size={4}>
                              {part.id === job.id ? <Text strong>{part.trackingId}</Text> : <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setShownId(part.id)}>{part.trackingId}</Button>}
                              <Text type="secondary">Part {part.partNumber}{part.description ? ` · ${part.description}` : ''}</Text>
                            </Space>
                            <Tag color={getStatusColor(part.status)}>{formatJobStatusLabel(part.status)}</Tag>
                          </div>
                        ))}
                      </Card>
                    )}
                    <Card size="small" title={<span className="user-info-title">What Is Being Sent</span>} style={cardStyle}>
                      {Array.isArray(job.packages) && job.packages.length > 0 ? job.packages.map((line, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', gap: 8 }}>
                          <Text>{lineLabel(line)}</Text>
                          <Text type="secondary">
                            {line.weight ? `${line.weight} kg each` : ''}
                            {canViewRevenue && line.estimatedPrice ? `${line.weight ? ' · ' : ''}£${Number(line.estimatedPrice).toFixed(2)} each` : ''}
                          </Text>
                        </div>
                      )) : <Text>{job.description || 'Not described'}</Text>}
                      <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 8, paddingTop: 8 }}>
                        <Text type="secondary">
                          {itemCount(job)} item{itemCount(job) === 1 ? '' : 's'}
                          {job.weight ? ` · ${Number(job.weight)} kg` : ''}
                          {canViewRevenue && job.value ? ` · £${Number(job.value).toFixed(2)}` : ''}
                          {canViewRevenue && Number(job.amountPaid) > 0 ? ` · £${Number(job.amountPaid).toFixed(2)} paid` : ''}
                        </Text>
                      </div>
                    </Card>
                    <InfoCard
                      title="Job"
                      rows={[
                        ['Reference', job.referenceNumber],
                        ['Priority', <Tag color={job.priority === 'Urgent' ? 'red' : job.priority === 'Express' ? 'orange' : 'blue'}>{job.priority}</Tag>],
                        ['Pickup Date', job.pickupDate ? new Date(job.pickupDate).toLocaleDateString() : 'Not set'],
                        ['Expected Delivery', job.estimatedDelivery ? new Date(job.estimatedDelivery).toLocaleDateString() : null],
                        ['Delivered', job.actualDelivery ? new Date(job.actualDelivery).toLocaleString() : null],
                        ['Created', <Text type="secondary">{new Date(job.createdAt).toLocaleString()}{job.creator?.name ? ` by ${job.creator.name}` : ''}</Text>],
                      ]}
                    />
                    {job.specialInstructions && (
                      <Card size="small" title="Special Instructions" style={{ marginBottom: 16 }}>
                        <Text>{job.specialInstructions}</Text>
                      </Card>
                    )}
                    <JobNotes notes={job.jobNotes} onAdd={isStaffMember(currentUser) ? () => setNoting(true) : undefined} />
                    <JobPhotos documents={job.documents} />
                    <Card size="small" title="Other Documents">
                      {documents.length === 0 ? <Text type="secondary">No other documents</Text> : (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {documents.map((doc) => (
                            <div key={doc.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <div>
                                <Text strong>{doc.fileName}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {new Date(doc.uploadedAt).toLocaleString()}
                                  {doc.uploader && ` • ${doc.uploader.name}`}
                                  {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(1)} KB`}
                                </Text>
                              </div>
                              <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => setViewing(doc)}>View</Button>
                            </div>
                          ))}
                        </Space>
                      )}
                    </Card>
                  </>
                ),
              },
              {
                key: 'activity',
                label: 'Activity',
                children: (job.timeline || []).length === 0 ? <Text type="secondary">No activity recorded yet</Text> : (
                  <Timeline
                    items={job.timeline.map((entry) => ({
                      key: entry.id,
                      color: getStatusColor(entry.status) === 'red' ? 'red' : 'blue',
                      children: (
                        <div>
                          <Tag color={getStatusColor(entry.status)}>{formatJobStatusLabel(entry.status)}</Tag>
                          <br />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(entry.timestamp).toLocaleString()}{entry.updater ? ` • ${entry.updater.name}` : ''}
                          </Text>
                          {entry.notes && <><br /><Text>{entry.notes}</Text></>}
                        </div>
                      ),
                    }))}
                  />
                ),
              },
              { key: 'edit-history', label: 'Edit History', children: <JobEditHistory jobId={job.id} refreshKey={job.updatedAt} /> },
            ]}
          />
        )}
      </Drawer>

      <StatusChangeModal job={moveTo ? job : null} status={moveTo} onClose={() => setMoveTo(null)} onDone={changed} />
      <AssignPersonModal job={assignKind ? job : null} kind={assignKind} onClose={() => setAssignKind(null)} onDone={changed} />
      <JobEditModal jobId={editing ? job?.id : null} onClose={() => setEditing(false)} onSaved={changed} />
      <JobNoteModal job={noting ? job : null} onClose={() => setNoting(false)} onAdded={changed} />
      <SplitJobModal job={splitting ? job : null} onClose={() => setSplitting(false)} onDone={changed} />
      <DocumentViewer document={viewing} onClose={() => setViewing(null)} />
      <StatusRevertModal
        visible={undoing}
        onCancel={() => setUndoing(false)}
        onOk={undo}
        currentStatus={job?.status}
        jobHistory={job?.timeline || []}
        loading={busy}
      />
      <PaymentRecordingModal
        visible={paying}
        onCancel={() => setPaying(false)}
        onOk={recordPayment}
        job={job}
        invoiceAmount={Math.max(0, Number(job?.value || 0) - Number(job?.amountPaid || 0))}
        loading={busy}
      />
    </>
  );
};

export default JobDrawer;
