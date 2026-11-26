import React from 'react';
import { Upload } from 'antd';
import { CameraOutlined } from '@ant-design/icons';

/** Photo picker for use inside a Form.Item. On phones the picker also offers the camera. */
const PhotoUpload = ({ value = [], onChange, maxCount = 5, label = 'Take or choose photo' }) => (
  <Upload
    listType="picture-card"
    accept="image/*"
    multiple={maxCount > 1}
    maxCount={maxCount}
    fileList={value}
    beforeUpload={() => false}
    onChange={({ fileList }) => onChange?.(fileList.slice(-maxCount))}
    showUploadList={{ showPreviewIcon: false }}
  >
    {value.length >= maxCount ? null : (
      <div>
        <CameraOutlined />
        <div style={{ marginTop: 8 }}>{label}</div>
      </div>
    )}
  </Upload>
);

export default PhotoUpload;
