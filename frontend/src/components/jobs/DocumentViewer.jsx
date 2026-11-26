import React, { useEffect, useState } from 'react';
import { Button, Image, Modal, Spin, Typography, message } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import config from '../../config/env';

const { Text, Title } = Typography;
const IMAGE = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
const TEXT = ['txt', 'csv', 'json', 'xml', 'log'];

const download = (url, fileName) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'document';
  link.click();
};

const TextFile = ({ url }) => {
  const [text, setText] = useState(null);
  useEffect(() => {
    fetch(url).then((response) => response.text()).then(setText).catch(() => setText('Could not read this file.'));
  }, [url]);
  if (text === null) return <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>;
  return (
    <pre style={{ margin: 16, padding: 16, background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14 }}>
      {text}
    </pre>
  );
};

/** Shows a job document (only signed-in staff may fetch them). Pass the document to open it. */
const DocumentViewer = ({ document: doc, onClose }) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!doc) return undefined;
    let objectUrl = null;
    let cancelled = false;
    setUrl(null);
    fetch(`${config.api.fullUrl}/jobs/documents/${doc.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(config.storage.tokenKey)}` },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Could not open the document (${response.status})`);
        const blob = await response.blob();
        // Some files come back without a type; use the one saved with the document
        const typed = blob.type && blob.type !== 'application/octet-stream' ? blob : new Blob([blob], { type: doc.mimeType || 'application/octet-stream' });
        objectUrl = URL.createObjectURL(typed);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        message.error(error.message);
        onClose();
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when another document is opened
  }, [doc]);

  const extension = doc?.fileName?.split('.').pop()?.toLowerCase();
  let body = <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spin size="large" /></div>;
  if (url && extension === 'pdf') {
    body = <iframe src={url} title={doc.fileName} style={{ width: '100%', height: '100%', border: 'none' }} />;
  } else if (url && IMAGE.includes(extension)) {
    body = (
      <div style={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f5f5' }}>
        <Image src={url} alt={doc.fileName} style={{ maxHeight: '100%', maxWidth: '100%' }} preview={{ mask: 'View larger' }} />
      </div>
    );
  } else if (url && TEXT.includes(extension)) {
    body = <div style={{ height: '100%', overflow: 'auto', background: '#f5f5f5' }}><TextFile url={url} /></div>;
  } else if (url) {
    body = (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 20, textAlign: 'center' }}>
        <FileTextOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 16 }} />
        <Title level={4}>{doc.fileName}</Title>
        <Text type="secondary" style={{ marginBottom: 20 }}>This file type cannot be previewed in the browser.</Text>
        <Button type="primary" size="large" onClick={() => download(url, doc.fileName)}>Download File</Button>
      </div>
    );
  }

  return (
    <Modal
      title={<span><FileTextOutlined /> {doc?.fileName || 'Document'}</span>}
      open={Boolean(doc)}
      onCancel={onClose}
      width="90%"
      style={{ top: 20 }}
      zIndex={1100} // above the job details drawer it is opened from
      footer={[
        <Button key="close" onClick={onClose}>Close</Button>,
        url && <Button key="download" type="primary" onClick={() => download(url, doc.fileName)}>Download</Button>,
      ]}
      styles={{ body: { padding: 0, height: '80vh' } }}
    >
      {body}
    </Modal>
  );
};

export default DocumentViewer;
