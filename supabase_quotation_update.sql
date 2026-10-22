-- ====================================================================
-- SUPABASE MIGRATION: Multi-Item Quotation Layout & Details
-- Run this in your Supabase SQL Editor:
-- ====================================================================

-- 1. Add columns for quotation multi-item table and header metadata
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS quotation_date TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'Wiring';
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE public.quotations ADD COLUMN IF NOT EXISTS intro_text TEXT;

-- 2. Ensure RLS allows full access
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to quotations" ON public.quotations;
CREATE POLICY "Allow all access to quotations" ON public.quotations FOR ALL USING (true) WITH CHECK (true);
