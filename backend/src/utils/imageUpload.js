// Decodes base64 uploads and works out the image type from the bytes, not from what the client claims.

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const detectImageType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.toString('latin1', 0, 8) === '\x89PNG\r\n\x1a\n') return 'image/png';
  if (['GIF87a', 'GIF89a'].includes(buffer.toString('latin1', 0, 6))) return 'image/gif';
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.toString('latin1', 4, 8) === 'ftyp' && /^(heic|heix|hevc|mif1|msf1)/.test(buffer.toString('latin1', 8, 12))) {
    return 'image/heic';
  }
  return null;
};

/** "data:...;base64,AAAA" or plain base64 -> Buffer (null when there is nothing to decode) */
const decodeFile = (fileData) => {
  if (typeof fileData !== 'string' || !fileData) return null;
  const base64 = fileData.includes(',') ? fileData.slice(fileData.indexOf(',') + 1) : fileData;
  const buffer = Buffer.from(base64, 'base64');
  return buffer.length ? buffer : null;
};

/** Returns { buffer, fileName, mimeType, size }, or null when the upload is not a usable image. */
const parseImage = (upload, defaultName = 'image') => {
  const buffer = decodeFile(upload?.fileData);
  const mimeType = detectImageType(buffer);
  if (!mimeType || buffer.length > MAX_IMAGE_BYTES) return null;
  return {
    buffer,
    mimeType,
    size: buffer.length,
    fileName: String(upload.fileName || `${defaultName}.${mimeType.split('/')[1].replace('jpeg', 'jpg')}`).slice(0, 255),
  };
};

/** Header values must be ASCII; phone and macOS screenshot names often are not. */
const contentDisposition = (fileName) => {
  const name = String(fileName || 'file');
  const ascii = name.replace(/[^\x20-\x7e]|["\\]/g, '_');
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
};

module.exports = { decodeFile, parseImage, contentDisposition, detectImageType };
