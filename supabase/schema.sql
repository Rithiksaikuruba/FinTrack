-- ============================================================
-- LOAN COLLECTION APP - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  address       TEXT,
  loan_amount   NUMERIC(12, 2) NOT NULL,
  interest      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_amount  NUMERIC(12, 2) NOT NULL,
  daily_amount  NUMERIC(12, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 100,
  start_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  method      TEXT NOT NULL DEFAULT 'cash' CHECK (method IN ('cash', 'upi')),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- VIEWS FOR DERIVED DATA
-- ============================================================

-- Customer summary with paid/pending amounts
CREATE OR REPLACE VIEW customer_summary AS
SELECT
  c.id,
  c.name,
  c.phone,
  c.address,
  c.loan_amount,
  c.interest,
  c.total_amount,
  c.daily_amount,
  c.duration_days,
  c.start_date,
  c.status,
  c.notes,
  c.created_at,
  COALESCE(SUM(p.amount), 0) AS paid_amount,
  c.total_amount - COALESCE(SUM(p.amount), 0) AS pending_amount,
  -- Days elapsed since start
  EXTRACT(DAY FROM NOW() - c.start_date::TIMESTAMPTZ)::INTEGER AS days_elapsed,
  -- Remaining days
  GREATEST(0, c.duration_days - EXTRACT(DAY FROM NOW() - c.start_date::TIMESTAMPTZ)::INTEGER) AS remaining_days
FROM customers c
LEFT JOIN payments p ON p.customer_id = c.id
GROUP BY c.id;

-- Daily collection summary
CREATE OR REPLACE VIEW daily_collection_summary AS
SELECT
  p.date,
  SUM(CASE WHEN p.method = 'cash' THEN p.amount ELSE 0 END) AS cash_total,
  SUM(CASE WHEN p.method = 'upi' THEN p.amount ELSE 0 END) AS upi_total,
  SUM(p.amount) AS grand_total,
  COUNT(DISTINCT p.customer_id) AS customers_paid
FROM payments p
GROUP BY p.date
ORDER BY p.date DESC;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can do everything (single owner app)
CREATE POLICY "Allow all for authenticated users" ON customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON payments
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- FUNCTION: Auto-complete loan when fully paid
-- ============================================================
CREATE OR REPLACE FUNCTION check_loan_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_amount NUMERIC;
  v_paid_amount NUMERIC;
BEGIN
  -- Get total amount for this customer
  SELECT total_amount INTO v_total_amount
  FROM customers WHERE id = NEW.customer_id;

  -- Get total paid including new payment
  SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
  FROM payments WHERE customer_id = NEW.customer_id;

  -- Mark as completed if fully paid
  IF v_paid_amount >= v_total_amount THEN
    UPDATE customers SET status = 'completed'
    WHERE id = NEW.customer_id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_loan_completion
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE PROCEDURE check_loan_completion();

-- ============================================================
-- SAMPLE DATA (Optional - remove for production)
-- ============================================================
/*
INSERT INTO customers (name, phone, address, loan_amount, interest, total_amount, daily_amount, duration_days, start_date) VALUES
('Rajesh Kumar', '9876543210', '12 MG Road, Hyderabad', 10000, 2000, 12000, 120, 100, CURRENT_DATE - INTERVAL '10 days'),
('Priya Sharma', '9876543211', '45 Jubilee Hills, Hyderabad', 5000, 1000, 6000, 60, 100, CURRENT_DATE - INTERVAL '5 days'),
('Suresh Reddy', '9876543212', '78 Banjara Hills, Hyderabad', 20000, 4000, 24000, 240, 100, CURRENT_DATE - INTERVAL '20 days');
*/
