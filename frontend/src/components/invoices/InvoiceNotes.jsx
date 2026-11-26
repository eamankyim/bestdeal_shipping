import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Form, Input, Space, Spin, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AuthImage from '../common/AuthImage';
import PhotoUpload from '../common/PhotoUpload';
import { invoiceAPI } from '../../utils/api';
import { filesToUploads } from '../../utils/imageUpload';

const { Text, Paragraph } = Typography;

/** Notes on the state of an invoice, each with an optional reference number and image. */
const InvoiceNotes = ({ invoiceId }) => {
  const [form] = Form.useForm();
  const [notes, setNotes] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await invoiceAPI.getById(invoiceId);
      setNotes(response.data.invoice.invoiceNotes || []);
    } catch (error) {
      setNotes([]);
      message.error(error.message || 'Failed to load invoice notes');
    }
  }, [invoiceId]);

  useEffect(() => {
    setNotes(null);
    form.resetFields();
    load();
  }, [load, form]);

  const handleFinish = async (values) => {
    setSaving(true);
    try {
      const [image] = await filesToUploads(values.image);
      await invoiceAPI.addNote(invoiceId, {
        note: values.note.trim(),
        referenceNumber: values.referenceNumber?.trim() || undefined,
        image,
      });
      message.success('Note added');
      form.resetFields();
      await load();
    } catch (error) {
      message.error(error.message || 'Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card size="small" title={<span className="user-info-title">Invoice State Notes</span>} style={{ borderRadius: 8 }}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="note" label="State of this invoice" rules={[{ required: true, whitespace: true, message: 'Please enter a note' }]}>
          <Input.TextArea rows={3} maxLength={5000} placeholder="e.g. Customer paid half in cash, balance on collection" />
        </Form.Item>
        <Form.Item name="referenceNumber" label="Reference Number (optional)">
          <Input maxLength={100} placeholder="e.g. receipt or mobile money reference" />
        </Form.Item>
        <Form.Item name="image" label="Image (optional)">
          <PhotoUpload maxCount={1} label="Attach image" />
        </Form.Item>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={saving}>Add Note</Button>
        </Form.Item>
      </Form>

      {notes === null && <Spin />}
      {notes?.length === 0 && <Text type="secondary">No notes yet</Text>}
      {notes?.map((note) => (
        <div key={note.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 8 }}>
          <Paragraph style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }}>{note.note}</Paragraph>
          {note.referenceNumber && <Tag color="blue">Ref: {note.referenceNumber}</Tag>}
          {note.imageSize && (
            <div style={{ margin: '8px 0' }}>
              <AuthImage path={`/invoices/notes/${note.id}/image`} alt={note.imageName} size={120} />
            </div>
          )}
          <Space>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {note.author?.name || 'Unknown'} • {new Date(note.createdAt).toLocaleString()}
            </Text>
          </Space>
        </div>
      ))}
    </Card>
  );
};

export default InvoiceNotes;
