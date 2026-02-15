-- Migração 6: Adicionar notes e remover title de crm_deals
-- Descrição: Adiciona campo de observações e remove campo title que não é mais usado

-- Adicionar coluna notes
ALTER TABLE crm_deals
ADD COLUMN notes TEXT;

-- Remover coluna title (não é mais usada)
ALTER TABLE crm_deals
DROP COLUMN title;

-- Comentário
COMMENT ON COLUMN crm_deals.notes IS 'Observações sobre a negociação. Campo livre para anotações do vendedor.';
