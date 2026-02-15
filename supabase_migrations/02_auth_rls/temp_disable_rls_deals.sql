-- ==============================================================================
-- DESABILITAR RLS EM TODAS AS TABELAS CRM (TEMPORÁRIO)
-- ==============================================================================
-- Este script desabilita RLS em todas as tabelas CRM para permitir operações
-- Depois de criar seu usuário, execute o script de reabilitar
-- ==============================================================================

-- Desabilitar RLS em todas as tabelas CRM
ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_titles DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log DISABLE ROW LEVEL SECURITY;

-- Verificar status
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 RLS Habilitado'
    ELSE '🔓 RLS Desabilitado'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'crm_%'
ORDER BY tablename;

SELECT '========================================' as info
UNION ALL
SELECT '✅ RLS DESABILITADO EM TODAS AS TABELAS CRM'
UNION ALL
SELECT '⚠️ ATENÇÃO: Sistema temporariamente sem proteção'
UNION ALL
SELECT '📝 Execute create_my_user_and_enable_rls.sql depois'
UNION ALL
SELECT '========================================';
