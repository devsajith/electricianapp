-- ====================================================
-- Supabase Schema Migration for Electrician App Projects
-- Run this script in the Supabase SQL Editor
-- ====================================================

-- 1. Create projects table if not exists
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  project_address TEXT,
  address TEXT,
  project_type TEXT NOT NULL DEFAULT 'Residential Wiring',
  work_description TEXT,
  start_date DATE,
  expected_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add missing columns safely
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_address TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS expected_completion_date DATE;

-- 3. Drop legacy CHECK constraints if restricting project_type or status
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_project_type_check;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- 4. Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies (Allow access to all users)
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;
CREATE POLICY "Allow all access to projects" ON public.projects
  FOR ALL
  USING (true)
  WITH CHECK (true);
