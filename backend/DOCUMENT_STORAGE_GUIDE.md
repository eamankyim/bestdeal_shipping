# 📎 Document Storage Guide

## Overview

BestDeal Shipping stores documents **directly in the PostgreSQL database** as binary data (BYTEA). This approach provides simplicity and data consistency for small to medium-sized files.

---

## 🗄️ How It Works

### Storage Method:
- Files are stored as **binary data (BYTEA)** in PostgreSQL
- Frontend converts files to **Base64** for transmission
- Backend converts Base64 back to **Buffer** and stores in DB
- Files are retrieved directly from database when needed

---

## 📊 Database Schema

### JobDocument Table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique document identifier |
| `jobId` | UUID | Associated job ID |
| `documentType` | String | Type: attachment, photo, signature, proof_of_delivery, invoice |
| `fileName` | String | Original file name |
| `fileUrl` | String (Optional) | External URL (if not stored in DB) |
| `fileData` | **Bytes** | **Binary file data stored in DB** |
| `fileSize` | Integer | File size in bytes |
| `mimeType` | String | MIME type (image/png, application/pdf, etc.) |
| `uploadedBy` | UUID | User who uploaded the file |
| `uploadedAt` | DateTime | Upload timestamp |

---

## ✅ Advantages of DB Storage

### 1. **Simplicity**
- No separate file server needed
- No file system permissions to manage
- No broken file path references

### 2. **Data Integrity**
- Files are part of database transactions
- ACID compliance
- Cascade deletion (delete job → delete documents)

### 3. **Backup & Recovery**
- Files backed up with database
- Single backup process
- Consistent restore points

### 4. **Security**
- Database-level access control
- No direct file system access
- Encrypted at rest (if DB encryption enabled)

---

## ⚠️ Limitations & Best Practices

### Size Limits:
- ✅ **Recommended:** < 5MB per file
- ⚠️ **Acceptable:** 5-10MB per file
- ❌ **Avoid:** > 10MB per file

### Performance Considerations:
- Large files slow down queries
- Memory usage increases
- Backup size grows

### When NOT to Use DB Storage:
- High volume file uploads
- Large media files (videos)
- Frequently accessed files
- CDN/caching required

### When DB Storage is Good:
- ✅ Small documents (PDFs, images)
- ✅ Low to medium volume
- ✅ Transactional consistency needed
- ✅ Simple deployment requirements

---

## 🔄 File Upload Flow

### Frontend → Backend:

```
1. User selects file in Upload component
   ↓
2. Frontend reads file with FileReader
   ↓
3. Convert to Base64 (data:image/png;base64,...)
   ↓
4. Send to backend in JSON:
   {
     fileName: "contract.pdf",
     fileSize: 51200,
     mimeType: "application/pdf",
     fileData: "data:application/pdf;base64,JVBERi0xLjQK..."
   }
   ↓
5. Backend extracts base64 (removes prefix)
   ↓
6. Convert to Buffer: Buffer.from(base64, 'base64')
   ↓
7. Store in database as BYTEA
   ↓
8. Return success with document ID
```

---

## 📥 File Download Flow

### Frontend → Backend:

```
1. User clicks "View" button
   ↓
2. Frontend opens: /api/jobs/documents/{documentId}
   ↓
3. Backend retrieves document from DB
   ↓
4. Check user permissions
   ↓
5. Set Content-Type header (mimeType)
   ↓
6. Set Content-Disposition (inline/attachment)
   ↓
7. Send Buffer data
   ↓
8. Browser displays/downloads file
```

---

## 🔐 Security Features

### Access Control:
- ✅ Authentication required (JWT token)
- ✅ Role-based permissions
- ✅ Ownership validation:
  - Drivers can only view their assigned jobs' documents
  - Delivery agents can only view their assigned jobs' documents
  - Admins/warehouse/customer-service can view all

### Validation:
- File size limits (configurable in .env)
- MIME type validation
- Malware scanning (future enhancement)

---

## 📝 API Endpoints

### Upload Document (during job creation):
```
POST /api/jobs
Content-Type: application/json

{
  "customerId": "uuid",
  "pickupAddress": "...",
  "deliveryAddress": "...",
  "documents": [
    {
      "fileName": "contract.pdf",
      "fileSize": 51200,
      "mimeType": "application/pdf",
      "fileData": "data:application/pdf;base64,..."
    }
  ]
}
```

### Download/View Document:
```
GET /api/jobs/documents/{documentId}
Authorization: Bearer {token}

Response:
- Content-Type: application/pdf (or image/png, etc.)
- Content-Disposition: inline; filename="contract.pdf"
- Binary file data
```

---

## 💾 Database Storage Details

### PostgreSQL BYTEA:
- Stores binary data efficiently
- Automatic compression (if enabled)
- Maximum size: 1GB per field (practically limited by config)
- Indexed for fast retrieval

### Storage Calculation:
```
Base64 encoding increases size by ~33%
Original file: 100 KB
Base64 encoded: ~133 KB
Stored in DB: 100 KB (binary)

Database growth per 100 files (avg 100KB each):
= 100 files × 100 KB = 10 MB
```

---

## 🛠️ Configuration

### Backend (.env):
```env
MAX_FILE_SIZE=5242880  # 5MB in bytes
UPLOAD_DIR=./uploads    # Not used for DB storage
```

### Frontend (Upload Component):
```jsx
<Upload 
  beforeUpload={() => false}  // Prevent auto-upload
  maxCount={5}                // Max files per job
  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
>
  <Button icon={<UploadOutlined />}>Upload Files</Button>
</Upload>
```

---

## 🔍 Viewing Documents in Database

### Using Prisma Studio:
```bash
cd backend
npx prisma studio
```
Navigate to `job_documents` table - you'll see:
- ✅ fileName, mimeType, fileSize (readable)
- ⚠️ fileData (shows as binary - not human readable)

### Using SQL:
```sql
-- View document metadata
SELECT id, file_name, file_size, mime_type, uploaded_at 
FROM job_documents;

-- Check file data size
SELECT id, file_name, octet_length(file_data) as size_bytes
FROM job_documents;
```

---

## 🚀 Usage Examples

### Create Job with Documents:

**Frontend Code:**
```javascript
const handleCreateJob = async () => {
  const formData = {
    customerId: "...",
    pickupAddress: "...",
    documents: [
      {
        fileName: "invoice.pdf",
        fileSize: 51200,
        mimeType: "application/pdf",
        fileData: "data:application/pdf;base64,JVBERi0..."
      }
    ]
  };
  
  const response = await jobAPI.create(formData);
};
```

**Backend Processing:**
```javascript
// Extracts base64
const base64Data = doc.fileData.split(',')[1];

// Converts to Buffer
const fileBuffer = Buffer.from(base64Data, 'base64');

// Stores in DB
await prisma.jobDocument.create({
  data: {
    jobId: job.id,
    fileName: doc.fileName,
    fileData: fileBuffer,  // Stored as BYTEA
    ...
  }
});
```

---

## 📊 File Size Management

### Recommended Limits:

| File Type | Max Size | Reason |
|-----------|----------|--------|
| Images (JPG, PNG) | 2 MB | Compressed images |
| PDFs | 5 MB | Documents, contracts |
| Office Docs | 3 MB | Word, Excel files |
| **Total per job** | **20 MB** | Combined all files |

---

## 🔄 Migration to External Storage (Future)

If you need to migrate to external storage later:

### Option 1: AWS S3
1. Install `aws-sdk`
2. Upload files to S3
3. Store S3 URL in `fileUrl` field
4. Keep `fileData` null

### Option 2: Local File System
1. Save files to `/uploads` folder
2. Store file path in `fileUrl`
3. Serve files with Express static

### Hybrid Approach:
- Small files (< 1MB): Store in DB
- Large files (> 1MB): Store in S3/filesystem
- Use `fileUrl` presence to determine source

---

## 🧪 Testing Document Storage

### Test 1: Upload Document
1. Create new job
2. Upload a small PDF or image
3. Submit form
4. Check job details - document should appear

### Test 2: View Document
1. Click "View" button on document
2. Document should open in new tab
3. Verify correct file displays

### Test 3: Multiple Documents
1. Upload 3-4 different files
2. All should be saved
3. Each should be viewable individually

---

## 📈 Monitoring Storage

### Check Database Size:
```sql
-- PostgreSQL query
SELECT 
  pg_size_pretty(pg_database_size('best_deal_shipping_db')) as db_size;

-- Check job_documents table size
SELECT 
  pg_size_pretty(pg_total_relation_size('job_documents')) as table_size;
```

### Check Individual Files:
```sql
SELECT 
  file_name,
  pg_size_pretty(octet_length(file_data)) as file_size,
  mime_type,
  uploaded_at
FROM job_documents
ORDER BY uploaded_at DESC
LIMIT 10;
```

---

## 🛡️ Security Considerations

### Current Implementation:
- ✅ Authentication required
- ✅ Role-based access control
- ✅ Ownership validation
- ✅ Binary data in database (not web-accessible)

### Future Enhancements:
- Virus scanning
- File type validation (magic bytes)
- Rate limiting for uploads
- Compression before storage

---

## 💡 Pro Tips

### For Better Performance:
1. **Compress images** before upload
2. **Limit file count** per job (max 5-10)
3. **Use pagination** when displaying many documents
4. **Cache frequently accessed** files in application

### For Production:
1. **Set up database backups** regularly
2. **Monitor database size** growth
3. **Consider S3 migration** if files > 1GB total
4. **Enable connection pooling** (Prisma Accelerate)

---

## 🎯 Current Implementation Summary

**What You Have:**
- ✅ Files stored in PostgreSQL as BYTEA
- ✅ Base64 upload from frontend
- ✅ Binary storage in backend
- ✅ Secure download endpoint
- ✅ Role-based access control
- ✅ Document metadata tracking
- ✅ View/download functionality

**What's NOT Implemented (Yet):**
- ❌ File compression
- ❌ Virus scanning
- ❌ Thumbnail generation
- ❌ CDN integration
- ❌ Batch download
- ❌ File versioning

---

## ✅ Ready to Use!

Your document storage system is now fully functional:

1. **Upload files** when creating jobs ✅
2. **Files stored in database** ✅
3. **View documents** from job details ✅
4. **Download documents** with proper permissions ✅
5. **Track metadata** (size, type, uploader) ✅

---

**Test it now by creating a job with documents!** 📎


