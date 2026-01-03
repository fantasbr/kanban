-- ============================================
-- Migration: Add Extra Credits Flag
-- Descrição: Adiciona campo para identificar itens extras comprados após contrato inicial
-- ============================================

-- Adicionar campo is_extra
ALTER TABLE erp_contract_items 
ADD COLUMN IF NOT EXISTS is_extra BOOLEAN DEFAULT false;

-- Criar índice para filtrar itens extras
CREATE INDEX IF NOT EXISTS idx_contract_items_is_extra 
  ON erp_contract_items(is_extra) 
  WHERE is_extra = true;

-- Adicionar comentário
COMMENT ON COLUMN erp_contract_items.is_extra IS 
  'Indica se este item foi adicionado como extra (aula extra) após a criação do contrato inicial';

-- Garantir que itens existentes sejam marcados como não-extras
UPDATE erp_contract_items 
SET is_extra = false 
WHERE is_extra IS NULL;
