import imageCompression from 'browser-image-compression';

/**
 * Compress a file to ensure it's under the maximum size
 * @param {File} file - The file to compress
 * @param {number} maxSizeMB - Maximum size in MB (default: 5MB)
 * @returns {Promise<File>} - Compressed file
 */
export const compressFile = async (file, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  
  // If file is already under the limit, return as is
  if (file.size <= maxSizeBytes) {
    return file;
  }

  // Check if file is an image (can be compressed)
  if (file.type.startsWith('image/')) {
    try {
      // Preserve original file name and type
      const originalFileName = file.name;
      const originalFileType = file.type;
      
      // Compress image with initial settings
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1920, // Maximum width or height
        useWebWorker: true,
        fileType: originalFileType, // Preserve original MIME type
        preserveExif: false,
      };

      let compressedFile = await imageCompression(file, options);
      
      // If still too large, try more aggressive compression
      let attempts = 0;
      const maxAttempts = 3;
      
      while (compressedFile.size > maxSizeBytes && attempts < maxAttempts) {
        attempts++;
        
        // Progressively more aggressive compression
        const aggressiveOptions = {
          maxSizeMB: maxSizeMB * (1 - attempts * 0.15), // Reduce by 15% each attempt
          maxWidthOrHeight: 1920 - (attempts * 240), // Reduce dimensions
          useWebWorker: true,
          fileType: originalFileType, // Preserve original MIME type
          preserveExif: false,
        };
        
        compressedFile = await imageCompression(file, aggressiveOptions);
      }
      
      // Final check - if still too large after all attempts, throw error
      if (compressedFile.size > maxSizeBytes) {
        throw new Error(`Unable to compress "${originalFileName}" to under ${maxSizeMB}MB. Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB. Please use a smaller image.`);
      }
      
      // Detect the actual MIME type of the compressed file
      // browser-image-compression may change the format (e.g., PNG -> JPEG)
      const actualMimeType = compressedFile.type || originalFileType;
      
      // Update file name extension to match the actual MIME type if changed
      let finalFileName = originalFileName;
      if (actualMimeType !== originalFileType) {
        const extensionMap = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'image/bmp': 'bmp',
        };
        
        const actualExt = extensionMap[actualMimeType];
        if (actualExt) {
          const nameWithoutExt = originalFileName.replace(/\.[^/.]+$/, '');
          finalFileName = `${nameWithoutExt}.${actualExt}`;
        }
      }
      
      // Create a new File object with correct MIME type
      const finalFile = new File([compressedFile], finalFileName, {
        type: actualMimeType,
        lastModified: file.lastModified,
      });
      
      return finalFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error(error.message || `Failed to compress image "${file.name}": ${error.message}`);
    }
  }

  // For non-image files (PDF, DOC, etc.), we can't compress them in the browser
  // These files must already be under the limit
  if (file.size > maxSizeBytes) {
    throw new Error(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed size is ${maxSizeMB}MB. Please compress the file using external tools before uploading.`);
  }

  return file;
};

/**
 * Compress multiple files to ensure they're all under the maximum size
 * @param {File[]} files - Array of files to compress
 * @param {number} maxSizeMB - Maximum size per file in MB (default: 5MB)
 * @returns {Promise<File[]>} - Array of compressed files
 */
export const compressFiles = async (files, maxSizeMB = 5) => {
  const compressionPromises = files.map(file => compressFile(file, maxSizeMB));
  return await Promise.all(compressionPromises);
};

