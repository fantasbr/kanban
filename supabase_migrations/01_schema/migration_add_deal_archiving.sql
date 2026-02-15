-- ============================================
-- MIGRAÇÃO: Sistema de Arquivamento de Deals
-- Adiciona campos para arquivar deals concluídos
-- ============================================

-- Adicionar campos de arquivamento
ALTER TABLE crm_deals 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_reason TEXT,
ADD COLUMN IF NOT EXISTS contract_id BIGINT REFERENCES erp_contracts(id) ON DELETE SET NULL;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_crm_deals_archived ON crm_deals(is_archived);
CREATE INDEX IF NOT EXISTS idx_crm_deals_archived_at ON crm_deals(archived_at);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contract_id ON crm_deals(contract_id);

-- Comentários para documentação
COMMENT ON COLUMN crm_deals.is_archived IS 'Deal foi arquivado após conclusão (ex: contrato criado)';
COMMENT ON COLUMN crm_deals.archived_at IS 'Data/hora em que o deal foi arquivado';
COMMENT ON COLUMN crm_deals.archived_reason IS 'Motivo do arquivamento (ex: número do contrato)';
COMMENT ON COLUMN crm_deals.contract_id IS 'Referência ao contrato criado a partir deste deal';

-- Verificação
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'crm_deals'
  AND column_name IN ('is_archived', 'archived_at', 'archived_reason', 'contract_id')
ORDER BY column_name;

-- Verificar índices criados
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'crm_deals'
  AND indexname LIKE '%archived%'
ORDER BY indexname;
