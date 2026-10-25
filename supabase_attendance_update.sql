-- ====================================================================
-- SUPABASE MIGRATION: LABOUR ATTENDANCE STATUS & ABSENT FIX
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ====================================================================

-- 1. Add attendance_status column to public.labour_logs if not exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labour_logs') THEN
    ALTER TABLE public.labour_logs 
    ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'full_day';

    -- Add Check Constraint for supported status types
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'chk_labour_logs_attendance_status'
    ) THEN
      ALTER TABLE public.labour_logs
      ADD CONSTRAINT chk_labour_logs_attendance_status
      CHECK (attendance_status IN ('full_day', 'half_day', 'overtime', 'absent', 'payment_only'));
    END IF;
  END IF;
END $$;

-- 2. Add attendance_status to public.labour_entries if legacy table is present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labour_entries') THEN
    ALTER TABLE public.labour_entries 
    ADD COLUMN IF NOT EXISTS attendance_status TEXT NOT NULL DEFAULT 'full_day';
  END IF;
END $$;

-- 3. Backfill existing attendance records based on shift and OT values
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labour_logs') THEN
    UPDATE public.labour_logs
    SET attendance_status = CASE
      WHEN COALESCE(ot, 0) > 0 THEN 'overtime'
      WHEN tach = 0.5 THEN 'half_day'
      WHEN tach = 0 AND COALESCE(amount_paid, 0) > 0 THEN 'payment_only'
      WHEN tach = 0 AND COALESCE(amount_paid, 0) = 0 THEN 'absent'
      ELSE 'full_day'
    END
    WHERE attendance_status IS NULL OR attendance_status = 'full_day';
  END IF;
END $$;

-- 4. Create performance index on attendance_status
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'labour_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_labour_logs_attendance_status 
    ON public.labour_logs(attendance_status);
  END IF;
END $$;

-- ====================================================================
-- OPTIONAL HELPER: FIX PREVIOUSLY SAVED "ABSENT" RECORDS
-- ====================================================================
-- If you previously marked a worker as "Absent" and it got saved as "Full Day"
-- (tach = 1, ot = 0, amount_paid = 0), you can run one of the following:

-- Option A: Fix all zero-wage, zero-OT records for today:
-- UPDATE public.labour_logs
-- SET attendance_status = 'absent', tach = 0
-- WHERE work_date = CURRENT_DATE 
--   AND COALESCE(ot, 0) = 0 
--   AND COALESCE(amount_paid, 0) = 0;

-- Option B: Fix a specific record by its ID:
-- UPDATE public.labour_logs
-- SET attendance_status = 'absent', tach = 0
-- WHERE id = '<ENTER_LOG_UUID_HERE>';
