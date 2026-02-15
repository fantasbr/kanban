-- Migração 3: Remover crm_deal_titles (EXECUTAR APENAS APÓS ATUALIZAR UI)
-- Data: 2026-01-10
-- Descrição: Remove tabela crm_deal_titles e coluna title_id após migração completa para templates

-- ⚠️ ATENÇÃO: Execute este script APENAS DEPOIS de:
-- 1. Atualizar todos os componentes da UI para usar contract_template_id
-- 2. Verificar que nenhum código referencia title_id ou crm_deal_titles
-- 3. Confirmar que todos os deals estão usando contract_template_id

-- Remover a coluna antiga title_id de crm_deals
ALTER TABLE crm_deals DROP COLUMN IF EXISTS title_id;

-- Remover a tabela crm_deal_titles
DROP TABLE IF EXISTS crm_deal_titles CASCADE;

-- Verificação
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_name = 'crm_deal_titles';
-- 
-- SELECT column_name 
-- FROM information_schema.columns 
-- WHERE table_name = 'crm_deals' AND column_name = 'title_id';
