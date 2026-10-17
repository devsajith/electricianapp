-- ====================================================================
-- ELECTRICIAN APP — DATABASE CLEANUP & SCHEMA MIGRATION
-- Exact 7-table clean schema (removes daily_rate from workers,
-- drops estimate_items, excludes material_lists)
-- Run this in Supabase Dashboard → SQL Editor
-- ====================================================================


-- ====================================================================
-- STEP 1: DROP TABLES THAT ARE NO LONGER NEEDED
-- ====================================================================

DROP TABLE IF EXISTS public.estimate_items CASCADE;


-- ====================================================================
-- STEP 2: PROJECTS — Rename columns, drop unused ones
-- ====================================================================

-- Drop legacy constraints if they exist
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_type_check;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Rename columns
ALTER TABLE public.projects RENAME COLUMN customer_name TO name;
ALTER TABLE public.projects RENAME COLUMN customer_phone TO phone;
ALTER TABLE public.projects RENAME COLUMN project_type TO type;
ALTER TABLE public.projects RENAME COLUMN work_description TO description;
ALTER TABLE public.projects RENAME COLUMN expected_completion_date TO end_date;

-- Add place column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS place TEXT;

-- Drop unused columns
ALTER TABLE public.projects DROP COLUMN IF EXISTS customer_email;
ALTER TABLE public.projects DROP COLUMN IF EXISTS project_address;
ALTER TABLE public.projects DROP COLUMN IF EXISTS address;
ALTER TABLE public.projects DROP COLUMN IF EXISTS notes;

-- Set proper defaults
ALTER TABLE public.projects ALTER COLUMN type SET DEFAULT 'Wiring';
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'Ongoing';


-- ====================================================================
-- STEP 3: ESTIMATES → QUOTATIONS — Rename table + columns
-- ====================================================================

-- Rename table
ALTER TABLE public.estimates RENAME TO quotations;

-- Drop legacy check constraints
ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS estimates_status_check;
ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS quotations_status_check;

-- Rename columns
ALTER TABLE public.quotations RENAME COLUMN estimate_number TO quotation_number;
ALTER TABLE public.quotations RENAME COLUMN terms_and_conditions TO terms;

-- Add quotation columns (standalone rate card)
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS client_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS client_place TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'Sqft';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS rate NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- Drop columns not needed
ALTER TABLE public.quotations DROP COLUMN IF EXISTS project_id;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS discount;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS tax;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS subtotal;
ALTER TABLE public.quotations DROP COLUMN IF EXISTS total_amount;


-- ====================================================================
-- STEP 4: PAYMENTS — Rename columns, drop unused
-- ====================================================================

-- Drop legacy constraints
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;

-- Rename columns
ALTER TABLE public.payments RENAME COLUMN payment_method TO method;
ALTER TABLE public.payments RENAME COLUMN reference_number TO payment_info;

-- Drop unused columns
ALTER TABLE public.payments DROP COLUMN IF EXISTS payment_type;
ALTER TABLE public.payments DROP COLUMN IF EXISTS notes;
ALTER TABLE public.payments DROP COLUMN IF EXISTS receipt_url;
ALTER TABLE public.payments DROP COLUMN IF EXISTS updated_at;

-- Set defaults
ALTER TABLE public.payments ALTER COLUMN method SET DEFAULT 'Cash';
ALTER TABLE public.payments ALTER COLUMN payment_date SET DEFAULT CURRENT_DATE;


-- ====================================================================
-- STEP 5: EXPENSES — Add type, rename columns, drop unused
-- ====================================================================

-- Add type column
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'self';

-- Rename expense_date → date
ALTER TABLE public.expenses RENAME COLUMN expense_date TO date;

-- Make project_id nullable
ALTER TABLE public.expenses ALTER COLUMN project_id DROP NOT NULL;

-- Drop unused columns
ALTER TABLE public.expenses DROP COLUMN IF EXISTS category;
ALTER TABLE public.expenses DROP COLUMN IF EXISTS receipt_url;
ALTER TABLE public.expenses DROP COLUMN IF EXISTS updated_at;

-- Set defaults
ALTER TABLE public.expenses ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- CHECK: if type = 'project', project_id must not be null
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_project_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_project_check
  CHECK (type != 'project' OR project_id IS NOT NULL);


-- ====================================================================
-- STEP 6: MATERIAL_CATALOGUE → MATERIALS — Rename table + columns
-- ====================================================================

-- Drop any conflicting view from previous migrations
DROP VIEW IF EXISTS public.materials;

-- Rename table
ALTER TABLE public.material_catalogue RENAME TO materials;

-- Rename column
ALTER TABLE public.materials RENAME COLUMN item_name TO name;

-- Drop unused columns
ALTER TABLE public.materials DROP COLUMN IF EXISTS category;
ALTER TABLE public.materials DROP COLUMN IF EXISTS default_price;
ALTER TABLE public.materials DROP COLUMN IF EXISTS supplier;
ALTER TABLE public.materials DROP COLUMN IF EXISTS notes;
ALTER TABLE public.materials DROP COLUMN IF EXISTS is_active;


-- ====================================================================
-- STEP 7: WORKERS — Add place, drop daily_rate and unused columns
-- ====================================================================

-- Add place column
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS place TEXT;

-- Drop daily_rate and unused columns
ALTER TABLE public.workers DROP COLUMN IF EXISTS daily_rate;
ALTER TABLE public.workers DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.workers DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.workers DROP COLUMN IF EXISTS notes;


-- ====================================================================
-- STEP 8: LABOUR_ENTRIES → LABOUR_LOGS — Rename table + columns
-- ====================================================================

-- Rename table
ALTER TABLE public.labour_entries RENAME TO labour_logs;

-- Ensure amount_paid column exists and drop legacy amount column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'labour_logs' AND column_name = 'total_amount') THEN
    ALTER TABLE public.labour_logs RENAME COLUMN total_amount TO amount_paid;
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'labour_logs' AND column_name = 'amount') THEN
    ALTER TABLE public.labour_logs RENAME COLUMN amount TO amount_paid;
  ELSE
    ALTER TABLE public.labour_logs ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Drop amount if amount_paid already exists separately
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS amount;

-- Add timesheet columns
ALTER TABLE public.labour_logs ADD COLUMN IF NOT EXISTS day TEXT NOT NULL DEFAULT '';
ALTER TABLE public.labour_logs ADD COLUMN IF NOT EXISTS tach NUMERIC(3, 1) NOT NULL DEFAULT 1;
ALTER TABLE public.labour_logs ADD COLUMN IF NOT EXISTS ot NUMERIC(4, 1) NOT NULL DEFAULT 0;

-- Drop unused legacy columns
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS days_worked;
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS hours_worked;
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS labour_rate;
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS advance_payment;
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS balance_amount;
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS work_description;
ALTER TABLE public.labour_logs DROP COLUMN IF EXISTS updated_at;

-- Set defaults
ALTER TABLE public.labour_logs ALTER COLUMN work_date SET DEFAULT CURRENT_DATE;

-- Link expenses directly to labour_logs (so labour entries record as project expenses)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS labour_log_id UUID REFERENCES public.labour_logs(id) ON DELETE CASCADE;


-- ====================================================================
-- STEP 9: PERFORMANCE INDEXES
-- ====================================================================

DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_payments_project_id;
DROP INDEX IF EXISTS idx_payments_date;
DROP INDEX IF EXISTS idx_expenses_project_id;
DROP INDEX IF EXISTS idx_expenses_date;
DROP INDEX IF EXISTS idx_expenses_type;
DROP INDEX IF EXISTS idx_estimates_project_id;
DROP INDEX IF EXISTS idx_estimate_items_estimate_id;
DROP INDEX IF EXISTS idx_labour_entries_worker_id;
DROP INDEX IF EXISTS idx_labour_entries_date;

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_labour_log_id ON public.expenses(labour_log_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workers_created_at ON public.workers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_labour_logs_worker_id ON public.labour_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_labour_logs_date ON public.labour_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_labour_logs_project_id ON public.labour_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_material_lists_project_id ON public.material_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_material_list_items_list_id ON public.material_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_material_list_items_material_id ON public.material_list_items(material_id);


-- ====================================================================
-- STEP 10: AUTO updated_at TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old triggers
DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
DROP TRIGGER IF EXISTS tr_estimates_updated_at ON public.quotations;
DROP TRIGGER IF EXISTS tr_material_catalogue_updated_at ON public.materials;
DROP TRIGGER IF EXISTS tr_workers_updated_at ON public.workers;
DROP TRIGGER IF EXISTS tr_expenses_updated_at ON public.expenses;
DROP TRIGGER IF EXISTS tr_payments_updated_at ON public.payments;

-- Create triggers on tables that have updated_at
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER tr_workers_updated_at BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ====================================================================
-- STEP 11: ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all 7 tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow all access to estimates" ON public.quotations;
DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;
DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all access to workers" ON public.workers;
DROP POLICY IF EXISTS "Allow all access to labour_entries" ON public.labour_logs;
DROP POLICY IF EXISTS "Allow all access to material_catalogue" ON public.materials;
DROP POLICY IF EXISTS "Allow all access to estimate_items" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated access" ON public.projects;
DROP POLICY IF EXISTS "Authenticated access" ON public.quotations;
DROP POLICY IF EXISTS "Authenticated access" ON public.payments;
DROP POLICY IF EXISTS "Authenticated access" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated access" ON public.materials;
DROP POLICY IF EXISTS "Authenticated access" ON public.workers;
DROP POLICY IF EXISTS "Authenticated access" ON public.labour_logs;

-- Clean policies allowing access for both anon and authenticated
CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to labour_logs" ON public.labour_logs FOR ALL USING (true) WITH CHECK (true);


-- ====================================================================
-- STEP 12: MATERIAL LISTS & ITEMS (PROJECT & GENERAL PROCUREMENT)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.material_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.material_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.material_lists(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  unit TEXT NOT NULL DEFAULT 'No',
  qty NUMERIC(10, 2) NOT NULL DEFAULT 1,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_lists_project_id ON public.material_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_material_lists_created_at ON public.material_lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_material_list_items_list_id ON public.material_list_items(list_id);

ALTER TABLE public.material_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to material_lists" ON public.material_lists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to material_list_items" ON public.material_list_items FOR ALL USING (true) WITH CHECK (true);


-- ====================================================================
-- STEP 13: REFERENCE HOME PLANS & STORAGE BUCKET
-- ====================================================================

-- Add plans JSONB column to public.projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS plans JSONB DEFAULT '[]'::jsonb;

-- Storage bucket 'project-plans'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-plans',
  'project-plans',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- Storage RLS Policies (RLS is already enabled on storage.objects by default)
DROP POLICY IF EXISTS "Public can view project plans" ON storage.objects;
CREATE POLICY "Public can view project plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-plans');

DROP POLICY IF EXISTS "Anyone can upload project plans" ON storage.objects;
CREATE POLICY "Anyone can upload project plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-plans');

DROP POLICY IF EXISTS "Anyone can update project plans" ON storage.objects;
CREATE POLICY "Anyone can update project plans"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'project-plans');

DROP POLICY IF EXISTS "Anyone can delete project plans" ON storage.objects;
CREATE POLICY "Anyone can delete project plans"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'project-plans');
