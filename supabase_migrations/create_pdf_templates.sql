-- Migration: Create erp_pdf_templates table
-- Description: Table to store PDF template configurations for contracts and receipts

CREATE TABLE IF NOT EXISTS erp_pdf_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id INTEGER NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('contract', 'receipt')),
  
  -- Header configuration
  show_logo BOOLEAN NOT NULL DEFAULT true,
  header_text TEXT,
  
  -- Footer configuration
  footer_text TEXT,
  show_contact_info BOOLEAN NOT NULL DEFAULT true,
  
  -- Color configuration
  primary_color TEXT NOT NULL DEFAULT '#6366f1',
  secondary_color TEXT NOT NULL DEFAULT '#8b5cf6',
  
  -- Default texts
  contract_terms TEXT,
  contract_notes TEXT,
  receipt_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one template per company and type
  UNIQUE(company_id, template_type)
);

-- Create index for faster lookups
CREATE INDEX idx_pdf_templates_company_type ON erp_pdf_templates(company_id, template_type);

-- Add RLS policies
ALTER TABLE erp_pdf_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view templates for their companies
CREATE POLICY "Users can view PDF templates"
  ON erp_pdf_templates
  FOR SELECT
  USING (true);

-- Policy: Users can insert templates
CREATE POLICY "Users can insert PDF templates"
  ON erp_pdf_templates
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update templates
CREATE POLICY "Users can update PDF templates"
  ON erp_pdf_templates
  FOR UPDATE
  USING (true);

-- Policy: Users can delete templates
CREATE POLICY "Users can delete PDF templates"
  ON erp_pdf_templates
  FOR DELETE
  USING (true);

-- Add comment to table
COMMENT ON TABLE erp_pdf_templates IS 'Stores PDF template configurations for contracts and receipts per company';
