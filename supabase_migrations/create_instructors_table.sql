-- =====================================================
-- Migration: Create Instructors Tables
-- Description: Creates tables for instructor management with company relationships
-- =====================================================

-- 1. Create instructors table
CREATE TABLE IF NOT EXISTS erp_instructors (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg VARCHAR(20),
  birth_date DATE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  cnh VARCHAR(20) NOT NULL UNIQUE,
  cnh_category VARCHAR(5) NOT NULL CHECK (cnh_category IN ('A', 'B', 'AB', 'C', 'D', 'E', 'AC', 'AD', 'AE')),
  cnh_expiration_date DATE NOT NULL,
  credencial_detran VARCHAR(50) NOT NULL UNIQUE,
  credencial_expiration_date DATE NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create instructor-companies relationship table
CREATE TABLE IF NOT EXISTS erp_instructor_companies (
  id SERIAL PRIMARY KEY,
  instructor_id INTEGER NOT NULL REFERENCES erp_instructors(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instructor_id, company_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_cpf ON erp_instructors(cpf);
CREATE INDEX IF NOT EXISTS idx_instructors_cnh ON erp_instructors(cnh);
CREATE INDEX IF NOT EXISTS idx_instructors_is_active ON erp_instructors(is_active);
CREATE INDEX IF NOT EXISTS idx_instructors_credencial ON erp_instructors(credencial_detran);
CREATE INDEX IF NOT EXISTS idx_instructor_companies_instructor ON erp_instructor_companies(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_companies_company ON erp_instructor_companies(company_id);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_erp_instructors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_erp_instructors_updated_at ON erp_instructors;
CREATE TRIGGER trigger_update_erp_instructors_updated_at
  BEFORE UPDATE ON erp_instructors
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_instructors_updated_at();

-- 5. Enable RLS
ALTER TABLE erp_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_instructor_companies ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for instructors
CREATE POLICY "Users can view active instructors"
  ON erp_instructors
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

CREATE POLICY "Users can insert instructors"
  ON erp_instructors
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

CREATE POLICY "Users can update instructors"
  ON erp_instructors
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

CREATE POLICY "Users can delete instructors"
  ON erp_instructors
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

-- 7. Create RLS policies for instructor_companies
CREATE POLICY "Users can view instructor companies"
  ON erp_instructor_companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

CREATE POLICY "Users can manage instructor companies"
  ON erp_instructor_companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

-- 8. Add comments
COMMENT ON TABLE erp_instructors IS 'Instructors for driving school';
COMMENT ON TABLE erp_instructor_companies IS 'Many-to-many relationship between instructors and companies';
COMMENT ON COLUMN erp_instructors.cnh_category IS 'A, B, AB, C, D, E, AC, AD, or AE';
COMMENT ON COLUMN erp_instructors.hourly_rate IS 'Hourly rate for lessons in BRL';
COMMENT ON COLUMN erp_instructors.credencial_detran IS 'DETRAN credential number';
