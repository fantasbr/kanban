-- Migração 4: Adicionar company_id em crm_deals
-- Descrição: Adiciona referência à empresa no deal para rastreamento completo

-- Adicionar coluna company_id
ALTER TABLE crm_deals 
ADD COLUMN company_id INTEGER REFERENCES erp_companies(id);

-- Adicionar índice para performance
CREATE INDEX idx_deals_company ON crm_deals(company_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN crm_deals.company_id IS 'Empresa associada ao deal. Permite rastreamento da empresa desde a negociação até o contrato.';
