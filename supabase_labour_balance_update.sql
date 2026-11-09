-- ====================================================================
-- SUPABASE MIGRATION: LABOUR LOGS BALANCE AMOUNT
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

-- 1. Add balance_amount column to public.labour_logs if not exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labour_logs') THEN
    ALTER TABLE public.labour_logs 
    ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- 2. Add balance_amount to public.labour_entries if legacy table is present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labour_entries') THEN
    ALTER TABLE public.labour_entries 
    ADD COLUMN IF NOT EXISTS balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;
