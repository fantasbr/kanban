-- Migração 1: Adicionar contract_template_id em crm_deals
-- Data: 2026-01-10
-- Descrição: Adiciona referência ao template de contrato que será usado como base editável

-- Adicionar coluna contract_template_id em crm_deals
ALTER TABLE crm_deals 
ADD COLUMN contract_template_id INTEGER REFERENCES erp_contract_templates(id);

-- Adicionar índice para performance
CREATE INDEX idx_deals_contract_template ON crm_deals(contract_template_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN crm_deals.contract_template_id IS 'Template de contrato sugerido para este deal. Usado como base editável na criação do contrato. O usuário pode modificar itens e valores livremente.';

-- Verificação
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'crm_deals' AND column_name = 'contract_template_id';
