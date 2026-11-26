import { compressFile } from './fileCompression';

// The API runs on Vercel, which refuses requests over 4.5MB. Base64 adds a third, so the files
// in one request share this budget (each photo is compressed to fit).
const TOTAL_UPLOAD_MB = 3;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read "${file.name}"`));
    reader.readAsDataURL(file);
  });

/**
 * Turn chosen files into what the API expects.
 * @param {Array} files - File objects, or Ant Design upload items
 * @returns {Promise<Array<{fileData, fileName, fileSize, mimeType}>>}
 */
export const filesToUploads = async (files) => {
  const originals = (files || []).map((file) => file.originFileObj || file).filter(Boolean);
  if (!originals.length) return [];
  const budget = TOTAL_UPLOAD_MB / originals.length;
  return Promise.all(
    originals.map(async (original) => {
      const file = await compressFile(original, budget);
      return {
        fileData: await readAsDataUrl(file),
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
      };
    })
  );
};
