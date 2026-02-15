-- Migração 2: Adicionar deal_id em erp_contracts
-- Data: 2026-01-10
-- Descrição: Adiciona rastreamento bidirecional entre deals e contratos

-- Adicionar coluna deal_id em erp_contracts
ALTER TABLE erp_contracts 
ADD COLUMN deal_id UUID REFERENCES crm_deals(id);

-- Adicionar índice para performance
CREATE INDEX idx_contracts_deal ON erp_contracts(deal_id);

-- Adicionar comentário explicativo
COMMENT ON COLUMN erp_contracts.deal_id IS 'Referência ao deal do CRM que originou este contrato. Permite rastreamento completo do ciclo comercial: Deal → Cliente → Contrato.';

-- Verificação
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'erp_contracts' AND column_name = 'deal_id';
