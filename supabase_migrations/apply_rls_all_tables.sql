-- ==============================================================================
-- APLICAR RLS EM TODAS AS TABELAS - VERSÃO COMPLETA
-- ==============================================================================
-- Este script garante que TODAS as tabelas do sistema tenham RLS habilitado
-- e políticas básicas configuradas usando o sistema de permissões
-- ==============================================================================

-- ==============================================================================
-- 1. HABILITAR RLS EM TODAS AS TABELAS
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'sql_%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', r.tablename);
    RAISE NOTICE 'RLS habilitado em: %', r.tablename;
  END LOOP;
END $$;

-- ==============================================================================
-- 2. APLICAR POLÍTICAS PADRÃO BASEADAS EM PERMISSÕES
-- ==============================================================================

-- Lista de tabelas principais do sistema
DO $$
DECLARE
  tables TEXT[] := ARRAY[
    'crm_pipelines', 'crm_stages', 'crm_deals', 'crm_contacts', 'crm_deal_titles', 'crm_activity_log',
    'erp_companies', 'erp_contract_types', 'erp_payment_methods', 'erp_contract_templates',
    'erp_clients', 'erp_contracts', 'erp_contract_items', 'erp_receivables', 'erp_receipts', 'erp_audit_log',
    'app_settings', 'pdf_templates', 'api_keys', 'webhook_subscriptions', 'api_logs', 'webhook_logs', 'webhook_queue',
    'contract_items_catalog'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
      
      -- Remover políticas antigas para recriar
      EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated users" ON %I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users" ON %I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Enable update for authenticated users" ON %I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Enable delete for authenticated users" ON %I;', t);
      
      -- SELECT: Usuários autenticados com permissão de visualizar
      EXECUTE format('
        CREATE POLICY "Enable read for authenticated users" ON %I
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM get_user_permissions(auth.uid()) p
            WHERE p.can_view = true OR p.is_admin = true
          )
        );
      ', t);
      
      -- INSERT: Usuários com permissão de criar
      EXECUTE format('
        CREATE POLICY "Enable insert for authenticated users" ON %I
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM get_user_permissions(auth.uid()) p
            WHERE p.can_create = true OR p.is_admin = true
          )
        );
      ', t);
      
      -- UPDATE: Usuários com permissão de editar
      EXECUTE format('
        CREATE POLICY "Enable update for authenticated users" ON %I
        FOR UPDATE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM get_user_permissions(auth.uid()) p
            WHERE p.can_edit = true OR p.is_admin = true
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM get_user_permissions(auth.uid()) p
            WHERE p.can_edit = true OR p.is_admin = true
          )
        );
      ', t);
      
      -- DELETE: Apenas admins (soft delete via UPDATE)
      EXECUTE format('
        CREATE POLICY "Enable delete for authenticated users" ON %I
        FOR DELETE TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM get_user_permissions(auth.uid()) p
            WHERE p.is_admin = true
          )
        );
      ', t);
      
      RAISE NOTICE '✅ Políticas aplicadas em: %', t;
    ELSE
      RAISE NOTICE '⚠️ Tabela não existe: %', t;
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 3. POLÍTICAS ESPECIAIS PARA TABELAS DO SISTEMA
-- ==============================================================================

-- system_roles: Todos podem ver, apenas admin pode modificar
DROP POLICY IF EXISTS "Anyone can view roles" ON system_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON system_roles;

CREATE POLICY "Anyone can view roles" ON system_roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can manage roles" ON system_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- system_users: Todos podem ver, apenas admin pode modificar
DROP POLICY IF EXISTS "Anyone can view users" ON system_users;
DROP POLICY IF EXISTS "Only admins can manage users" ON system_users;

CREATE POLICY "Anyone can view users" ON system_users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can manage users" ON system_users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- VERIFICAÇÃO FINAL
-- ==============================================================================

DO $$
DECLARE
  v_total_tables INTEGER;
  v_tables_with_rls INTEGER;
  v_total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_tables
  FROM pg_tables
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO v_tables_with_rls
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = true;
  
  SELECT COUNT(*) INTO v_total_policies
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS APLICADO COM SUCESSO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de tabelas: %', v_total_tables;
  RAISE NOTICE 'Tabelas com RLS: %', v_tables_with_rls;
  RAISE NOTICE 'Total de políticas: %', v_total_policies;
  RAISE NOTICE '========================================';
  
  IF v_tables_with_rls = v_total_tables THEN
    RAISE NOTICE '✅ TODAS as tabelas estão protegidas com RLS!';
  ELSE
    RAISE WARNING '⚠️ Algumas tabelas ainda não têm RLS!';
  END IF;
END $$;
