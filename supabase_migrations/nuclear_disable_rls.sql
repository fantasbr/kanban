-- ==============================================================================
-- SOLUÇÃO DEFINITIVA: REMOVER TODAS AS POLÍTICAS E DESABILITAR RLS
-- ==============================================================================
-- Este script remove TODAS as políticas RLS e desabilita completamente
-- ==============================================================================

-- PASSO 1: Remover TODAS as políticas de crm_deals
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'crm_deals'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON crm_deals', pol.policyname);
    RAISE NOTICE 'Política removida: %', pol.policyname;
  END LOOP;
END $$;

-- PASSO 2: Desabilitar RLS em TODAS as tabelas CRM
ALTER TABLE crm_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_titles DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log DISABLE ROW LEVEL SECURITY;

-- PASSO 3: Remover políticas de outras tabelas CRM também
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'crm_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    RAISE NOTICE 'Política removida: % de %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- Verificar resultado
SELECT 
  '========================================' as info
UNION ALL
SELECT '✅ TODAS AS POLÍTICAS RLS REMOVIDAS'
UNION ALL
SELECT '✅ RLS DESABILITADO EM TODAS AS TABELAS CRM'
UNION ALL
SELECT '⚠️ Sistema SEM proteção - use apenas temporariamente'
UNION ALL
SELECT '========================================';

-- Ver status final
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

-- Contar políticas restantes
SELECT 
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ Nenhuma política ativa'
    ELSE '⚠️ Ainda existem políticas'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'crm_%';
