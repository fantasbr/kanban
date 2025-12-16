-- Migration: Create crm_deal_titles table
-- Description: Stores predefined deal titles that can be configured in Settings

-- Create the table
CREATE TABLE IF NOT EXISTS crm_deal_titles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_deal_titles_active ON crm_deal_titles(is_active);

-- Insert default deal titles (common for driving schools)
INSERT INTO crm_deal_titles (title) VALUES
  ('CNH Categoria A'),
  ('CNH Categoria B'),
  ('CNH Categoria AB'),
  ('CNH Categoria C'),
  ('CNH Categoria D'),
  ('CNH Categoria E'),
  ('Renovação de CNH'),
  ('Mudança de Categoria'),
  ('Primeira Habilitação'),
  ('Reciclagem')
ON CONFLICT (title) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE crm_deal_titles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read deal titles"
  ON crm_deal_titles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow all authenticated users to insert
CREATE POLICY "Allow authenticated users to insert deal titles"
  ON crm_deal_titles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow all authenticated users to update
CREATE POLICY "Allow authenticated users to update deal titles"
  ON crm_deal_titles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow all authenticated users to delete
CREATE POLICY "Allow authenticated users to delete deal titles"
  ON crm_deal_titles
  FOR DELETE
  TO authenticated
  USING (true);
