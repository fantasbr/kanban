-- ==============================================================================
-- AUDITORIA DE RLS (ROW LEVEL SECURITY)
-- ==============================================================================
-- Este script verifica o estado do RLS em todas as tabelas do schema public
-- e lista todas as políticas configuradas
-- ==============================================================================

-- Verificar quais tabelas têm RLS habilitado
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ Habilitado'
    ELSE '❌ Desabilitado'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Listar todas as políticas RLS existentes
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE cmd
    WHEN 'r' THEN 'SELECT'
    WHEN 'a' THEN 'INSERT'
    WHEN 'w' THEN 'UPDATE'
    WHEN 'd' THEN 'DELETE'
    WHEN '*' THEN 'ALL'
  END as command,
  roles,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Contar políticas por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY total_policies DESC, tablename;

-- Tabelas SEM RLS habilitado (potencial problema de segurança)
SELECT 
  tablename,
  '⚠️ RLS não habilitado - RISCO DE SEGURANÇA!' as warning
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
ORDER BY tablename;

-- Tabelas COM RLS mas SEM políticas (ninguém consegue acessar)
SELECT 
  t.tablename,
  '⚠️ RLS habilitado mas sem políticas - ACESSO BLOQUEADO!' as warning
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
AND t.rowsecurity = true
AND p.policyname IS NULL
ORDER BY t.tablename;

-- Resumo geral
DO $$
DECLARE
  v_total_tables INTEGER;
  v_tables_with_rls INTEGER;
  v_tables_without_rls INTEGER;
  v_total_policies INTEGER;
BEGIN
  -- Contar tabelas
  SELECT COUNT(*) INTO v_total_tables
  FROM pg_tables
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  SELECT COUNT(*) INTO v_tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;
  
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO DA AUDITORIA DE RLS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de tabelas: %', v_total_tables;
  RAISE NOTICE 'Tabelas com RLS: % (%.0f%%)', v_tables_with_rls, (v_tables_with_rls::float / v_total_tables * 100);
  RAISE NOTICE 'Tabelas sem RLS: % (%.0f%%)', v_tables_without_rls, (v_tables_without_rls::float / v_total_tables * 100);
  RAISE NOTICE 'Total de políticas: %', v_total_policies;
  RAISE NOTICE '========================================';
  
  IF v_tables_without_rls > 0 THEN
    RAISE WARNING '⚠️ Existem % tabelas sem RLS habilitado!', v_tables_without_rls;
  ELSE
    RAISE NOTICE '✅ Todas as tabelas têm RLS habilitado!';
  END IF;
END $$;
