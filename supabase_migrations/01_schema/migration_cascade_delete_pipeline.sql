-- ============================================
-- MIGRAÇÃO: Adicionar CASCADE para deletar pipelines
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Primeiro, precisamos remover as constraints existentes e recriá-las com ON DELETE CASCADE

-- 1. Remover constraint de pipeline_id em crm_stages
ALTER TABLE crm_stages 
DROP CONSTRAINT IF EXISTS crm_stages_pipeline_id_fkey;

-- 2. Recriar constraint com CASCADE
ALTER TABLE crm_stages
ADD CONSTRAINT crm_stages_pipeline_id_fkey 
FOREIGN KEY (pipeline_id) 
REFERENCES crm_pipelines(id) 
ON DELETE CASCADE;

-- 3. Remover constraint de pipeline_id em crm_deals
ALTER TABLE crm_deals
DROP CONSTRAINT IF EXISTS crm_deals_pipeline_id_fkey;

-- 4. Recriar constraint com CASCADE
ALTER TABLE crm_deals
ADD CONSTRAINT crm_deals_pipeline_id_fkey 
FOREIGN KEY (pipeline_id) 
REFERENCES crm_pipelines(id) 
ON DELETE CASCADE;

-- Verificar as constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'crm_stages' OR tc.table_name = 'crm_deals')
  AND (kcu.column_name = 'pipeline_id')
ORDER BY tc.table_name;
