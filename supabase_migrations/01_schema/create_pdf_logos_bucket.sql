-- Create Storage Bucket for PDF Logos
-- Run this in Supabase SQL Editor or Dashboard

-- Create the bucket (if using SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-logos', 'pdf-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'pdf-logos' );

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-logos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'pdf-logos' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can delete their logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'pdf-logos' AND auth.role() = 'authenticated' );

-- Alternative: Create via Dashboard
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Name: pdf-logos
-- 4. Public: Yes
-- 5. File size limit: 2MB
-- 6. Allowed MIME types: image/*
