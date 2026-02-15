-- =====================================================
-- Migration: Create Vehicles Tables
-- Description: Creates tables for vehicle management with company relationships
-- =====================================================

-- 1. Create vehicles table
CREATE TABLE IF NOT EXISTS erp_vehicles (
  id SERIAL PRIMARY KEY,
  plate VARCHAR(10) NOT NULL UNIQUE,
  renavam VARCHAR(20) NOT NULL UNIQUE,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  transmission VARCHAR(20) NOT NULL CHECK (transmission IN ('manual', 'automatic')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('car', 'motorcycle', 'bus', 'truck')),
  photo_url TEXT,
  lesson_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create vehicle-companies relationship table
CREATE TABLE IF NOT EXISTS erp_vehicle_companies (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES erp_vehicles(id) ON DELETE CASCADE,
  company_id INTEGER NOT NULL REFERENCES erp_companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vehicle_id, company_id)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON erp_vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON erp_vehicles(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicle_companies_vehicle ON erp_vehicle_companies(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_companies_company ON erp_vehicle_companies(company_id);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_erp_vehicles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_erp_vehicles_updated_at ON erp_vehicles;
CREATE TRIGGER trigger_update_erp_vehicles_updated_at
  BEFORE UPDATE ON erp_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_erp_vehicles_updated_at();

-- 5. Enable RLS
ALTER TABLE erp_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE erp_vehicle_companies ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for vehicles
CREATE POLICY "Users can view active vehicles"
  ON erp_vehicles
  FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

CREATE POLICY "Users can insert vehicles"
  ON erp_vehicles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

CREATE POLICY "Users can update vehicles"
  ON erp_vehicles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

CREATE POLICY "Users can delete vehicles"
  ON erp_vehicles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

-- 7. Create RLS policies for vehicle_companies
CREATE POLICY "Users can view vehicle companies"
  ON erp_vehicle_companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

CREATE POLICY "Users can manage vehicle companies"
  ON erp_vehicle_companies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_edit = true
    )
  );

-- 8. Add comments
COMMENT ON TABLE erp_vehicles IS 'Vehicles for driving school';
COMMENT ON TABLE erp_vehicle_companies IS 'Many-to-many relationship between vehicles and companies';
COMMENT ON COLUMN erp_vehicles.transmission IS 'manual or automatic';
COMMENT ON COLUMN erp_vehicles.category IS 'car, motorcycle, bus, or truck';
COMMENT ON COLUMN erp_vehicles.lesson_price IS 'Price per lesson in BRL';
