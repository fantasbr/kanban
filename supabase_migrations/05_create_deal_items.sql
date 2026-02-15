-- Migração 5: Criar tabela crm_deal_items
-- Descrição: Armazena itens customizados negociados no deal antes da conversão em contrato

-- Criar tabela
CREATE TABLE crm_deal_items (
  id SERIAL PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES crm_deals(id) ON DELETE CASCADE,
  catalog_item_id INTEGER REFERENCES erp_contract_items_catalog(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_deal_items_deal ON crm_deal_items(deal_id);
CREATE INDEX idx_deal_items_catalog ON crm_deal_items(catalog_item_id);
CREATE INDEX idx_deal_items_created_by ON crm_deal_items(created_by);

-- Comentários
COMMENT ON TABLE crm_deal_items IS 'Itens customizados do deal. Permite rastrear o que foi negociado antes da conversão em contrato. Dados valiosos para análise de negociações e conversões.';
COMMENT ON COLUMN crm_deal_items.catalog_item_id IS 'Referência ao catálogo de itens de contrato (erp_contract_items_catalog). Mesma tabela usada em contratos.';
COMMENT ON COLUMN crm_deal_items.created_by IS 'Usuário que criou o item (auditoria).';
COMMENT ON COLUMN crm_deal_items.updated_by IS 'Usuário que atualizou o item pela última vez (auditoria).';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_crm_deal_items_updated_at
  BEFORE UPDATE ON crm_deal_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
