-- ====================================================================
-- ELECTRICIAN APP — COMPLETE FRESH DATABASE SETUP FOR SUPABASE
-- Run this in the Supabase Dashboard -> SQL Editor (New Query)
-- Completely safe & idempotent:
--   1. Ensures tables exist
--   2. Ensures any missing columns are added (even if tables already existed)
--   3. Safely resets triggers, indexes, and RLS policies
-- ====================================================================

-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. UTILITY FUNCTION FOR UPDATED_AT TIMESTAMP
-- ====================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 2. CREATE TABLES
-- ====================================================================

-- 1. PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  place TEXT,
  type TEXT NOT NULL DEFAULT 'Wiring',
  status TEXT NOT NULL DEFAULT 'Ongoing',
  description TEXT,
  start_date DATE,
  end_date DATE,
  plans JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS plans JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS place TEXT;

-- 2. QUOTATIONS
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_phone TEXT,
  client_place TEXT,
  client_address TEXT,
  quotation_date TEXT,
  project_type TEXT DEFAULT 'Wiring',
  subject TEXT,
  intro_text TEXT,
  unit TEXT NOT NULL DEFAULT 'Sqft',
  rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description TEXT,
  terms TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS quotation_date TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'Wiring';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS intro_text TEXT;

-- 3. WORKERS (Labour Master)
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  place TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS place TEXT;

-- 4. LABOUR_LOGS (Daily Attendance & Wage Records)
CREATE TABLE IF NOT EXISTS public.labour_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  day TEXT NOT NULL DEFAULT '',
  tach NUMERIC(3, 1) NOT NULL DEFAULT 1,
  ot NUMERIC(4, 1) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  attendance_status TEXT NOT NULL DEFAULT 'full_day',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.labour_logs ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.labour_logs ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'full_day';
ALTER TABLE public.labour_logs DROP CONSTRAINT IF EXISTS chk_labour_logs_attendance_status;
ALTER TABLE public.labour_logs ADD CONSTRAINT chk_labour_logs_attendance_status
  CHECK (attendance_status IN ('full_day', 'half_day', 'overtime', 'absent', 'payment_only'));

-- 5. EXPENSES (Self & Project Expenses)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'self',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  labour_log_id UUID REFERENCES public.labour_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Ensure missing columns are added if table existed from an earlier version
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS labour_log_id UUID REFERENCES public.labour_logs(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'self';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS date DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_project_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_project_check 
  CHECK (type != 'project' OR project_id IS NOT NULL);

-- 6. PAYMENTS (Client Payments to Projects)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_info TEXT,
  method TEXT NOT NULL DEFAULT 'Cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_info TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'Cash';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- 7. MATERIALS (Catalogue Master)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cat TEXT,
  brand TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS cat TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS unit TEXT;

-- 8. MATERIAL_LISTS (Procurement Lists)
CREATE TABLE IF NOT EXISTS public.material_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. MATERIAL_LIST_ITEMS
CREATE TABLE IF NOT EXISTS public.material_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.material_lists(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  cat TEXT,
  brand TEXT,
  unit TEXT NOT NULL DEFAULT 'No',
  qty NUMERIC(10, 2) NOT NULL DEFAULT 1,
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.material_list_items ADD COLUMN IF NOT EXISTS cat TEXT;
ALTER TABLE public.material_list_items ADD COLUMN IF NOT EXISTS brand TEXT;

-- ====================================================================
-- 3. AUTO updated_at TRIGGERS
-- ====================================================================
DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_quotations_updated_at ON public.quotations;
CREATE TRIGGER tr_quotations_updated_at BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_workers_updated_at ON public.workers;
CREATE TRIGGER tr_workers_updated_at BEFORE UPDATE ON public.workers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_expenses_updated_at ON public.expenses;
CREATE TRIGGER tr_expenses_updated_at BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_payments_updated_at ON public.payments;
CREATE TRIGGER tr_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_materials_updated_at ON public.materials;
CREATE TRIGGER tr_materials_updated_at BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_material_lists_updated_at ON public.material_lists;
CREATE TRIGGER tr_material_lists_updated_at BEFORE UPDATE ON public.material_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ====================================================================
-- 4. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workers_created_at ON public.workers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_labour_logs_worker_id ON public.labour_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_labour_logs_project_id ON public.labour_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_labour_logs_date ON public.labour_logs(work_date);
CREATE INDEX IF NOT EXISTS idx_labour_logs_attendance_status ON public.labour_logs(attendance_status);

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);
CREATE INDEX IF NOT EXISTS idx_expenses_labour_log_id ON public.expenses(labour_log_id);

CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_materials_created_at ON public.materials(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_material_lists_project_id ON public.material_lists(project_id);
CREATE INDEX IF NOT EXISTS idx_material_lists_created_at ON public.material_lists(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_material_list_items_list_id ON public.material_list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_material_list_items_material_id ON public.material_list_items(material_id);

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labour_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to quotations" ON public.quotations;
CREATE POLICY "Allow all access to quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to workers" ON public.workers;
CREATE POLICY "Allow all access to workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to labour_logs" ON public.labour_logs;
CREATE POLICY "Allow all access to labour_logs" ON public.labour_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses;
CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to payments" ON public.payments;
CREATE POLICY "Allow all access to payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to materials" ON public.materials;
CREATE POLICY "Allow all access to materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to material_lists" ON public.material_lists;
CREATE POLICY "Allow all access to material_lists" ON public.material_lists FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to material_list_items" ON public.material_list_items;
CREATE POLICY "Allow all access to material_list_items" ON public.material_list_items FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- 6. STORAGE BUCKET CONFIGURATION (project-plans)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-plans',
  'project-plans',
  true,
  52428800, -- 50MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

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
