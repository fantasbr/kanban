-- ============================================
-- MIGRAÇÃO: Adicionar campo updated_at em crm_deals
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Adicionar coluna updated_at
ALTER TABLE crm_deals 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar trigger para atualizar automaticamente o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger na tabela crm_deals
DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON crm_deals;
CREATE TRIGGER update_crm_deals_updated_at
    BEFORE UPDATE ON crm_deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Atualizar deals existentes com a data de criação como updated_at inicial
UPDATE crm_deals 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verificar
SELECT id, title, created_at, updated_at FROM crm_deals ORDER BY created_at DESC LIMIT 10;
