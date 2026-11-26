import React, { useEffect, useState } from 'react';
import { Image, Spin, Typography } from 'antd';
import config from '../../config/env';

/** An image that only signed-in staff may fetch, so it cannot be a plain <img src>. */
const AuthImage = ({ path, alt, size = 96 }) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;
    setUrl(null);
    setFailed(false);

    fetch(`${config.api.fullUrl}${path}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(config.storage.tokenKey)}` },
    })
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  const box = { width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 6 };
  if (failed) return <div style={box}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Unavailable</Typography.Text></div>;
  if (!url) return <div style={box}><Spin size="small" /></div>;
  return <Image src={url} alt={alt} width={size} height={size} style={{ objectFit: 'cover', borderRadius: 6 }} />;
};

export default AuthImage;
