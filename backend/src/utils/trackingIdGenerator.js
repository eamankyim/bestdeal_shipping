/**
 * Generate unique tracking ID for jobs
 * Format: SHIP-YYYYMMDD-XXXXX
 * Example: SHIP-20241010-A3B9F
 */
const generateTrackingId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 5-character alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `SHIP-${year}${month}${day}-${randomStr}`;
};

/**
 * Generate unique batch ID
 * Format: BATCH-YYYYMMDD-XXX
 * Example: BATCH-20241010-A3B
 */
const generateBatchId = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 3-character alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 3; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `BATCH-${year}${month}${day}-${randomStr}`;
};

/**
 * Generate unique invoice number
 * Format: INV-YYYYMMDD-XXXX
 * Example: INV-20241010-1234
 */
const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Generate random 4-digit number
  const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  
  return `INV-${year}${month}${day}-${randomNum}`;
};

module.exports = {
  generateTrackingId,
  generateBatchId,
  generateInvoiceNumber,
};







