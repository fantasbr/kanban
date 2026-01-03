-- ============================================
-- SOFT DELETE: Adicionar campo is_active
-- ============================================

-- 1. Adicionar coluna is_active (padrão TRUE para deals existentes)
ALTER TABLE crm_deals 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Atualizar deals existentes para is_active = TRUE
UPDATE crm_deals 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- 3. Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_crm_deals_is_active 
ON crm_deals(is_active);

-- 4. Verificar estrutura
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'crm_deals'
  AND column_name = 'is_active';
