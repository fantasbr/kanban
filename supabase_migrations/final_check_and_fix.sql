-- ==============================================================================
-- VERIFICAÇÃO FINAL E CORREÇÃO DEFINITIVA
-- ==============================================================================

-- 1. Ver status REAL do RLS
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ HABILITADO (este é o problema!)'
    ELSE '✅ DESABILITADO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'crm_deals';

-- 2. FORÇAR desabilitar RLS
ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;

-- 3. Verificar novamente
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '❌ AINDA HABILITADO'
    ELSE '✅ DESABILITADO COM SUCESSO'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'crm_deals';

-- 4. Ver se há algum trigger ou constraint bloqueando
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'crm_deals'
AND event_object_schema = 'public';

-- 5. Verificar se a tabela tem alguma restrição especial
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    WHEN 'x' THEN 'EXCLUSION'
  END as type_description
FROM pg_constraint
WHERE conrelid = 'crm_deals'::regclass;

SELECT '========================================' as info
UNION ALL
SELECT '✅ Diagnóstico completo executado'
UNION ALL
SELECT 'Se RLS ainda estiver habilitado, há um problema no Supabase'
UNION ALL
SELECT '========================================';
