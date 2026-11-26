// Encrypts settings that must not be readable in the database, such as SMS provider keys.

const crypto = require('crypto');

const getKey = () => {
  const secret = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!secret) throw new Error('SETTINGS_ENCRYPTION_KEY or JWT_SECRET must be set on the server');
  return Buffer.from(crypto.hkdfSync('sha256', secret, 'bestdeal-settings', 'settings-encryption', 32));
};

const encrypt = (text) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return ['v1', iv, cipher.getAuthTag(), data].map((part) => (Buffer.isBuffer(part) ? part.toString('base64') : part)).join(':');
};

/** Returns null when the value is missing, was changed, or was saved with a different key. */
const decrypt = (stored) => {
  try {
    const [version, iv, tag, data] = String(stored).split(':');
    if (version !== 'v1') return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch (error) {
    return null;
  }
};

module.exports = { encrypt, decrypt };
