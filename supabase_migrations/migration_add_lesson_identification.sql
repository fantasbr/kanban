-- ============================================
-- Migration: Identificação de Itens de Aula e Categoria de Veículo
-- Descrição: Adiciona campos para identificar itens de aula e sua categoria de veículo
-- ============================================

-- 1. Adicionar campo is_lesson ao catálogo
ALTER TABLE erp_contract_items_catalog 
ADD COLUMN IF NOT EXISTS is_lesson BOOLEAN DEFAULT false;

-- 2. Adicionar campo vehicle_category ao catálogo
-- Deve corresponder aos valores de VehicleCategory: 'car' | 'motorcycle' | 'bus' | 'truck'
ALTER TABLE erp_contract_items_catalog 
ADD COLUMN IF NOT EXISTS vehicle_category TEXT;

-- 3. Adicionar constraint para validar vehicle_category
ALTER TABLE erp_contract_items_catalog
DROP CONSTRAINT IF EXISTS check_vehicle_category;

ALTER TABLE erp_contract_items_catalog
ADD CONSTRAINT check_vehicle_category 
CHECK (vehicle_category IS NULL OR vehicle_category IN ('car', 'motorcycle', 'bus', 'truck'));

-- 4. Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_catalog_items_is_lesson 
  ON erp_contract_items_catalog(is_lesson) 
  WHERE is_lesson = true;

CREATE INDEX IF NOT EXISTS idx_catalog_items_vehicle_category 
  ON erp_contract_items_catalog(vehicle_category) 
  WHERE vehicle_category IS NOT NULL;

-- 5. Adicionar comentários
COMMENT ON COLUMN erp_contract_items_catalog.is_lesson IS 
  'Indica se este item representa uma aula (consome créditos de agendamento)';

COMMENT ON COLUMN erp_contract_items_catalog.vehicle_category IS 
  'Categoria de veículo para aulas: car, motorcycle, bus, truck';

-- 6. Atualizar itens existentes
-- Marcar "Aula de Carro" como aula de categoria 'car'
UPDATE erp_contract_items_catalog 
SET is_lesson = true, vehicle_category = 'car'
WHERE name ILIKE '%aula%carro%' OR name ILIKE '%aula%car%';

-- Marcar "Aula de Moto" como aula de categoria 'motorcycle'
UPDATE erp_contract_items_catalog 
SET is_lesson = true, vehicle_category = 'motorcycle'
WHERE name ILIKE '%aula%moto%' OR name ILIKE '%aula%motorcycle%';

-- Marcar "Aula de Ônibus" como aula de categoria 'bus' (se existir)
UPDATE erp_contract_items_catalog 
SET is_lesson = true, vehicle_category = 'bus'
WHERE name ILIKE '%aula%ônibus%' OR name ILIKE '%aula%onibus%' OR name ILIKE '%aula%bus%';

-- Marcar "Aula de Caminhão" como aula de categoria 'truck' (se existir)
UPDATE erp_contract_items_catalog 
SET is_lesson = true, vehicle_category = 'truck'
WHERE name ILIKE '%aula%caminhão%' OR name ILIKE '%aula%caminhao%' OR name ILIKE '%aula%truck%';

-- 7. Garantir que itens não-aula tenham is_lesson = false
UPDATE erp_contract_items_catalog 
SET is_lesson = false, vehicle_category = NULL
WHERE is_lesson IS NULL OR (is_lesson = false AND vehicle_category IS NOT NULL);

-- 8. Verificar resultados (opcional - comentar em produção)
-- SELECT id, name, is_lesson, vehicle_category, unit_type 
-- FROM erp_contract_items_catalog 
-- ORDER BY is_lesson DESC, name;
