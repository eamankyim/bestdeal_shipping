import React from 'react';
import { Card, Image, Space, Typography } from 'antd';
import AuthImage from '../common/AuthImage';

const { Text } = Typography;

const GROUPS = [
  { type: 'proof_of_delivery', title: 'Delivery Photos' },
  { type: 'photo', title: 'Collection & Status Photos' },
];

/** Photos taken on collection and delivery, so everyone can see what was sent. */
const JobPhotos = ({ documents = [] }) => {
  const groups = GROUPS
    .map((group) => ({
      ...group,
      photos: documents.filter((doc) => doc.documentType === group.type && (doc.mimeType || '').startsWith('image/')),
    }))
    .filter((group) => group.photos.length > 0);

  return groups.map((group) => (
    <Card key={group.type} size="small" title={group.title} style={{ marginBottom: 16 }}>
      <Image.PreviewGroup>
        <Space wrap size={12} align="start">
          {group.photos.map((photo) => (
            <div key={photo.id} style={{ width: 96 }}>
              <AuthImage path={`/jobs/documents/${photo.id}`} alt={photo.fileName} />
              <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                {photo.uploader?.name}
                <br />
                {new Date(photo.uploadedAt).toLocaleDateString()}
              </Text>
            </div>
          ))}
        </Space>
      </Image.PreviewGroup>
    </Card>
  ));
};

export default JobPhotos;
