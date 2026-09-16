-- Apply once before deploying the updated API; additive and safe to rerun.
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ADD COLUMN IF NOT EXISTS receiver_name TEXT,
  ADD COLUMN IF NOT EXISTS receiver_address TEXT,
  ADD COLUMN IF NOT EXISTS receiver_contact TEXT,
  ADD COLUMN IF NOT EXISTS freight_type TEXT,
  ADD COLUMN IF NOT EXISTS packages JSONB,
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0;
