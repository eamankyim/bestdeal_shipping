# Database Schema - ShipEASE

## 📋 Overview

This document defines the complete database schema for the ShipEASE shipping management system.

**Database:** PostgreSQL (recommended) or MySQL

---

## 📊 Tables & Relationships

### 1. **users** (Authentication & User Management)
```sql
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              VARCHAR(255) UNIQUE NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  name               VARCHAR(255) NOT NULL,
  role               VARCHAR(50) NOT NULL,  -- 'admin', 'driver', 'warehouse', 'delivery_agent', 'user'
  avatar_url         VARCHAR(500),
  phone              VARCHAR(50),
  active             BOOLEAN DEFAULT true,
  email_verified     BOOLEAN DEFAULT false,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login         TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

---

### 2. **roles** (Role Management)
```sql
CREATE TABLE roles (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(50) UNIQUE NOT NULL,  -- 'admin', 'driver', 'warehouse', etc.
  display_name       VARCHAR(100) NOT NULL,
  description        TEXT,
  permissions        JSON,  -- Array of permission strings
  color              VARCHAR(20),
  is_system          BOOLEAN DEFAULT false,  -- System roles can't be deleted
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name)
);
```

---

### 3. **invitations** (User Invitations)
```sql
CREATE TABLE invitations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              VARCHAR(255) NOT NULL,
  role               VARCHAR(50) NOT NULL,
  invited_by         UUID REFERENCES users(id),
  token              VARCHAR(255) UNIQUE NOT NULL,
  status             VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'accepted', 'expired'
  expires_at         TIMESTAMP NOT NULL,
  accepted_at        TIMESTAMP,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_token (token),
  INDEX idx_email (email)
);
```

---

### 4. **customers** (Customer Management)
```sql
CREATE TABLE customers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(255) NOT NULL,
  email              VARCHAR(255),
  phone              VARCHAR(50),
  address            TEXT,
  customer_type      VARCHAR(50) NOT NULL,  -- 'Individual', 'Company'
  notes              TEXT,
  created_by         UUID REFERENCES users(id),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_customer_type (customer_type),
  INDEX idx_created_at (created_at)
);
```

---

### 5. **jobs** (Core - Job Management)
```sql
CREATE TABLE jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id           VARCHAR(50) UNIQUE NOT NULL,
  customer_id           UUID REFERENCES customers(id),
  
  -- Addresses
  pickup_address        TEXT NOT NULL,
  delivery_address      TEXT NOT NULL,
  
  -- Parcel Details
  description           VARCHAR(500),
  weight                DECIMAL(10, 2),  -- in kg
  dimensions_length     DECIMAL(10, 2),  -- in cm
  dimensions_width      DECIMAL(10, 2),
  dimensions_height     DECIMAL(10, 2),
  value                 DECIMAL(10, 2),  -- parcel value
  quantity              INTEGER DEFAULT 1,
  
  -- Dates & Status
  pickup_date           DATE,
  estimated_delivery    DATE,
  actual_delivery       TIMESTAMP,
  status                VARCHAR(50) NOT NULL DEFAULT 'Pending Collection',
  priority              VARCHAR(50) DEFAULT 'Standard',  -- 'Standard', 'Express', 'Urgent'
  
  -- Assignment
  assigned_driver_id    UUID REFERENCES users(id),
  assigned_delivery_agent_id UUID REFERENCES users(id),
  warehouse_location    VARCHAR(100),
  
  -- Batch
  batch_id              UUID REFERENCES batches(id),
  
  -- Additional Info
  special_instructions  TEXT,
  notes                 TEXT,
  
  -- Metadata
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_tracking_id (tracking_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_assigned_driver_id (assigned_driver_id),
  INDEX idx_batch_id (batch_id),
  INDEX idx_pickup_date (pickup_date),
  INDEX idx_created_at (created_at)
);
```

---

### 6. **job_timeline** (Job Status History)
```sql
CREATE TABLE job_timeline (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             UUID REFERENCES jobs(id) ON DELETE CASCADE,
  status             VARCHAR(50) NOT NULL,
  location           VARCHAR(255),
  notes              TEXT,
  updated_by         UUID REFERENCES users(id),
  timestamp          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_job_id (job_id),
  INDEX idx_timestamp (timestamp)
);
```

---

### 7. **job_documents** (Documents/Photos for Jobs)
```sql
CREATE TABLE job_documents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id             UUID REFERENCES jobs(id) ON DELETE CASCADE,
  document_type      VARCHAR(50),  -- 'photo', 'signature', 'proof_of_delivery', 'invoice'
  file_name          VARCHAR(255) NOT NULL,
  file_url           VARCHAR(500) NOT NULL,
  file_size          INTEGER,  -- in bytes
  mime_type          VARCHAR(100),
  uploaded_by        UUID REFERENCES users(id),
  uploaded_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_job_id (job_id),
  INDEX idx_document_type (document_type)
);
```

---

### 8. **batches** (Batch Management)
```sql
CREATE TABLE batches (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id              VARCHAR(50) UNIQUE NOT NULL,
  destination           VARCHAR(255) NOT NULL,
  carrier               VARCHAR(255),
  tracking_number       VARCHAR(255),
  
  -- Batch Info
  total_jobs            INTEGER DEFAULT 0,
  total_weight          DECIMAL(10, 2) DEFAULT 0,
  total_value           DECIMAL(10, 2) DEFAULT 0,
  
  -- Dates & Status
  status                VARCHAR(50) DEFAULT 'In Preparation',  -- 'In Preparation', 'Ready to Ship', 'Shipped', 'In Transit', 'Arrived', 'Completed'
  estimated_ship_date   DATE,
  actual_ship_date      DATE,
  estimated_arrival     DATE,
  actual_arrival        DATE,
  
  -- Additional
  notes                 TEXT,
  
  -- Metadata
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shipped_at            TIMESTAMP,
  
  INDEX idx_batch_id (batch_id),
  INDEX idx_status (status),
  INDEX idx_destination (destination),
  INDEX idx_created_at (created_at)
);
```

---

### 9. **invoices** (Invoice Management)
```sql
CREATE TABLE invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number        VARCHAR(50) UNIQUE NOT NULL,
  customer_id           UUID REFERENCES customers(id),
  
  -- Financial
  subtotal              DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax                   DECIMAL(10, 2) DEFAULT 0,
  total                 DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Status & Dates
  status                VARCHAR(50) DEFAULT 'Pending',  -- 'Pending', 'Paid', 'Overdue', 'Cancelled'
  issue_date            DATE NOT NULL,
  due_date              DATE NOT NULL,
  paid_date             DATE,
  
  -- Payment
  payment_method        VARCHAR(100),
  payment_reference     VARCHAR(255),
  
  -- Additional
  notes                 TEXT,
  
  -- Metadata
  created_by            UUID REFERENCES users(id),
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_customer_id (customer_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);
```

---

### 10. **invoice_items** (Invoice Line Items)
```sql
CREATE TABLE invoice_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id         UUID REFERENCES invoices(id) ON DELETE CASCADE,
  job_id             UUID REFERENCES jobs(id),
  description        VARCHAR(500) NOT NULL,
  quantity           INTEGER NOT NULL DEFAULT 1,
  unit_price         DECIMAL(10, 2) NOT NULL,
  total              DECIMAL(10, 2) NOT NULL,
  
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_job_id (job_id)
);
```

---

### 11. **pricing** (Pricing Structure)
```sql
CREATE TABLE pricing (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination        VARCHAR(255) NOT NULL,
  weight_min         DECIMAL(10, 2) NOT NULL,  -- in kg
  weight_max         DECIMAL(10, 2) NOT NULL,
  price              DECIMAL(10, 2) NOT NULL,
  currency           VARCHAR(10) DEFAULT 'GBP',
  service_type       VARCHAR(50) DEFAULT 'Standard',  -- 'Standard', 'Express', 'Urgent'
  active             BOOLEAN DEFAULT true,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_destination (destination),
  INDEX idx_service_type (service_type),
  INDEX idx_active (active)
);
```

---

### 12. **notifications** (User Notifications)
```sql
CREATE TABLE notifications (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  type               VARCHAR(50) NOT NULL,  -- 'job_status', 'assignment', 'invoice', 'system'
  title              VARCHAR(255) NOT NULL,
  message            TEXT NOT NULL,
  is_read            BOOLEAN DEFAULT false,
  related_entity_type VARCHAR(50),  -- 'job', 'invoice', 'batch'
  related_entity_id  UUID,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at            TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);
```

---

### 13. **refresh_tokens** (JWT Refresh Tokens)
```sql
CREATE TABLE refresh_tokens (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  token              VARCHAR(500) UNIQUE NOT NULL,
  expires_at         TIMESTAMP NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked            BOOLEAN DEFAULT false,
  
  INDEX idx_user_id (user_id),
  INDEX idx_token (token),
  INDEX idx_expires_at (expires_at)
);
```

---

### 14. **settings** (System Settings)
```sql
CREATE TABLE settings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key                VARCHAR(100) UNIQUE NOT NULL,
  value              TEXT,
  description        TEXT,
  type               VARCHAR(50),  -- 'string', 'number', 'boolean', 'json'
  updated_by         UUID REFERENCES users(id),
  updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_key (key)
);
```

---

### 15. **audit_logs** (Audit Trail - Optional but Recommended)
```sql
CREATE TABLE audit_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES users(id),
  action             VARCHAR(100) NOT NULL,  -- 'create', 'update', 'delete'
  entity_type        VARCHAR(50) NOT NULL,   -- 'job', 'customer', 'invoice', etc.
  entity_id          UUID,
  old_values         JSON,
  new_values         JSON,
  ip_address         VARCHAR(50),
  user_agent         TEXT,
  timestamp          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_entity_type (entity_type),
  INDEX idx_entity_id (entity_id),
  INDEX idx_timestamp (timestamp)
);
```

---

## 🔗 Entity Relationships

```
users (1) ────── (many) jobs (created_by)
users (1) ────── (many) jobs (assigned_driver_id)
users (1) ────── (many) jobs (assigned_delivery_agent_id)
users (1) ────── (many) invitations (invited_by)
users (1) ────── (many) customers (created_by)
users (1) ────── (many) notifications (user_id)

customers (1) ── (many) jobs (customer_id)
customers (1) ── (many) invoices (customer_id)

jobs (1) ──────── (many) job_timeline (job_id)
jobs (1) ──────── (many) job_documents (job_id)
jobs (many) ───── (1) batches (batch_id)
jobs (many) ───── (many) invoice_items (job_id)

batches (1) ───── (many) jobs (batch_id)

invoices (1) ──── (many) invoice_items (invoice_id)
invoices (many) ─ (1) customers (customer_id)
```

---

## 🌱 Seed Data (Initial Setup)

### Default Roles:
```sql
INSERT INTO roles (name, display_name, description, color, is_system, permissions) VALUES
('admin', 'Administrator', 'Full system access', '#1890ff', true, '["all"]'),
('warehouse', 'Warehouse Manager', 'Manage warehouse operations', '#52c41a', true, '["warehouse-dashboard", "batch-management", "jobs-view", "jobs-update"]'),
('driver', 'Driver', 'Collection and delivery', '#fa8c16', true, '["driver-dashboard", "jobs-assigned", "jobs-update-status"]'),
('delivery_agent', 'Delivery Agent', 'Final delivery operations', '#722ed1', true, '["delivery-dashboard", "deliveries-assigned", "delivery-confirm"]'),
('user', 'User', 'Basic user access', '#13c2c2', true, '["dashboard", "jobs-view", "customers-view"]');
```

### Job Statuses (for reference):
```
1. Pending Collection
2. Assigned (to driver)
3. En Route to Customer
4. Collected
5. Returning to Warehouse
6. At Warehouse
7. Batched
8. Shipped
9. In Transit
10. Arrived (at destination)
11. Out for Delivery
12. Delivered
```

### Batch Statuses:
```
1. In Preparation
2. Ready to Ship
3. Shipped
4. In Transit
5. Arrived
6. Completed
```

### Invoice Statuses:
```
1. Pending
2. Paid
3. Overdue
4. Cancelled
```

---

## 📈 Indexes & Performance

### Composite Indexes (for common queries):
```sql
-- Jobs by customer and status
CREATE INDEX idx_jobs_customer_status ON jobs(customer_id, status);

-- Jobs by driver and status
CREATE INDEX idx_jobs_driver_status ON jobs(assigned_driver_id, status);

-- Jobs by date range
CREATE INDEX idx_jobs_pickup_date_status ON jobs(pickup_date, status);

-- Invoice by customer and date
CREATE INDEX idx_invoices_customer_date ON invoices(customer_id, issue_date DESC);

-- Notifications unread
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

---

## 🔄 Triggers (Optional - for auto-updates)

### Update job timeline on status change:
```sql
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO job_timeline (job_id, status, notes, updated_by, timestamp)
    VALUES (NEW.id, NEW.status, 'Status updated', NEW.updated_by, CURRENT_TIMESTAMP);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_status_change
AFTER UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION log_job_status_change();
```

### Update batch totals when jobs are added/removed:
```sql
CREATE OR REPLACE FUNCTION update_batch_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update batch totals
  UPDATE batches
  SET 
    total_jobs = (SELECT COUNT(*) FROM jobs WHERE batch_id = NEW.batch_id),
    total_weight = (SELECT COALESCE(SUM(weight), 0) FROM jobs WHERE batch_id = NEW.batch_id),
    total_value = (SELECT COALESCE(SUM(value), 0) FROM jobs WHERE batch_id = NEW.batch_id),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.batch_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER batch_totals_update
AFTER INSERT OR UPDATE OF batch_id ON jobs
FOR EACH ROW
WHEN (NEW.batch_id IS NOT NULL)
EXECUTE FUNCTION update_batch_totals();
```

---

## 🔐 Database Security

1. **Row-Level Security (RLS):**
   - Enable RLS on sensitive tables
   - Users can only see their own data (unless admin)

2. **Encryption:**
   - Encrypt sensitive fields (passwords, tokens)
   - Use PostgreSQL pgcrypto extension

3. **Backups:**
   - Daily automated backups
   - Point-in-time recovery enabled

4. **Connection Security:**
   - Use SSL/TLS for database connections
   - Restrict database access by IP

---

## 📊 Database Size Estimates

### Estimated Storage (1 year, 10,000 jobs):
- **jobs table:** ~10MB
- **job_timeline:** ~5MB
- **job_documents:** ~1GB (depends on file storage)
- **customers:** ~1MB
- **batches:** ~500KB
- **invoices:** ~2MB
- **audit_logs:** ~10MB
- **Total:** ~1-2GB (excluding document files)

### Scaling Considerations:
- **Partitioning:** Partition `jobs` and `job_timeline` by date (monthly/yearly)
- **Archiving:** Move old completed jobs to archive tables
- **Read Replicas:** Set up read replicas for reporting queries

---

## ✅ Database Setup Checklist

- [ ] Choose database (PostgreSQL recommended)
- [ ] Set up database server/hosting
- [ ] Create database and user
- [ ] Run schema creation scripts
- [ ] Add indexes
- [ ] Set up triggers (optional)
- [ ] Seed initial data (roles, settings)
- [ ] Configure backups
- [ ] Set up monitoring
- [ ] Create ORM models (if using ORM)

---

**Ready for implementation!** 🚀

Which approach do you prefer:
1. **ORM (Prisma/Sequelize/TypeORM)** - Easier development, type-safe
2. **Raw SQL + Query Builder** - More control, better performance
3. **Hybrid** - ORM for common operations, raw SQL for complex queries







