-- ====================================================================
-- SUPABASE UPDATE: REFERENCE HOME PLANS & STORAGE BUCKET
-- Run this script in your Supabase Dashboard → SQL Editor
-- ====================================================================

-- 1. Add 'plans' JSONB column to public.projects table (if not exists)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS plans JSONB DEFAULT '[]'::jsonb;

-- 2. Create the storage bucket 'project-plans' (publicly accessible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-plans',
  'project-plans',
  true,
  52428800, -- 50MB file size limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

-- 3. Storage Policies for 'project-plans' bucket
-- (Note: RLS is already enabled on storage.objects by default)

-- Allow public viewing/downloading of files in 'project-plans'
DROP POLICY IF EXISTS "Public can view project plans" ON storage.objects;
CREATE POLICY "Public can view project plans"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-plans');

-- Allow uploading files to 'project-plans'
DROP POLICY IF EXISTS "Anyone can upload project plans" ON storage.objects;
CREATE POLICY "Anyone can upload project plans"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'project-plans');

-- Allow updating files in 'project-plans'
DROP POLICY IF EXISTS "Anyone can update project plans" ON storage.objects;
CREATE POLICY "Anyone can update project plans"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'project-plans');

-- Allow deleting files in 'project-plans'
DROP POLICY IF EXISTS "Anyone can delete project plans" ON storage.objects;
CREATE POLICY "Anyone can delete project plans"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'project-plans');
