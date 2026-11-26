import React from 'react';
import { Button, Card, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

/** Internal staff notes on a job. */
const JobNotes = ({ notes = [], onAdd }) => (
  <Card
    size="small"
    title="Notes"
    style={{ marginBottom: 16 }}
    extra={<Button size="small" icon={<PlusOutlined />} onClick={onAdd}>Add Note</Button>}
  >
    {notes.length === 0 ? (
      <Text type="secondary">No notes yet</Text>
    ) : (
      notes.map((note) => (
        <div key={note.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 8 }}>
          <Paragraph style={{ marginBottom: 4, whiteSpace: 'pre-wrap' }}>{note.note}</Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {note.author?.name || 'Unknown'} • {new Date(note.createdAt).toLocaleString()}
          </Text>
        </div>
      ))
    )}
  </Card>
);

export default JobNotes;
