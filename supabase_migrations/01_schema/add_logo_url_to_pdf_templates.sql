-- Migration: Add logo_url to erp_pdf_templates
-- Description: Add logo_url field to store Supabase Storage URL for company logos

ALTER TABLE erp_pdf_templates
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment
COMMENT ON COLUMN erp_pdf_templates.logo_url IS 'URL of the company logo stored in Supabase Storage';
