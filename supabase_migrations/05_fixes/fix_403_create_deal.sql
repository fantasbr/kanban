-- ==============================================================================
-- DIAGNÓSTICO E CORREÇÃO - ERRO 403 AO CRIAR DEALS
-- ==============================================================================
-- Este script verifica se o usuário atual tem permissões configuradas
-- e oferece soluções para o problema
-- ==============================================================================

-- 1. Verificar se você está autenticado
SELECT 
  auth.uid() as meu_user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NÃO AUTENTICADO'
    ELSE '✅ AUTENTICADO'
  END as status_auth;

-- 2. Verificar se você existe em system_users
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM system_users WHERE auth_user_id = auth.uid()
    ) THEN '✅ Usuário existe em system_users'
    ELSE '❌ Usuário NÃO existe em system_users - ESTE É O PROBLEMA!'
  END as status_system_user;

-- 3. Verificar suas permissões atuais
SELECT * FROM get_user_permissions(auth.uid());

-- 4. Ver seu registro completo (se existir)
SELECT 
  u.*,
  r.name as role_name,
  r.can_view,
  r.can_create,
  r.can_edit,
  r.is_admin
FROM system_users u
LEFT JOIN system_roles r ON u.role_id = r.id
WHERE u.auth_user_id = auth.uid();

-- ==============================================================================
-- SOLUÇÃO RÁPIDA: Criar seu usuário como Superadmin
-- ==============================================================================
-- Execute este bloco se o diagnóstico mostrou que você não existe em system_users

DO $$
DECLARE
  v_superadmin_role_id UUID;
  v_current_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Pegar ID do usuário atual
  SELECT auth.uid() INTO v_current_user_id;
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Você não está autenticado! Faça login primeiro.';
  END IF;
  
  -- Verificar se já existe
  IF EXISTS (SELECT 1 FROM system_users WHERE auth_user_id = v_current_user_id) THEN
    RAISE NOTICE '✅ Você já existe em system_users!';
    RAISE NOTICE 'O problema pode ser com as permissões da sua role.';
    RETURN;
  END IF;
  
  -- Buscar role Superadmin
  SELECT id INTO v_superadmin_role_id 
  FROM system_roles 
  WHERE slug = 'superadmin';
  
  IF v_superadmin_role_id IS NULL THEN
    RAISE EXCEPTION 'Role Superadmin não encontrada! Execute migration_user_management.sql primeiro.';
  END IF;
  
  -- Buscar email do usuário
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_current_user_id;
  
  -- Criar registro em system_users
  INSERT INTO system_users (
    auth_user_id,
    email,
    full_name,
    role_id,
    is_active
  ) VALUES (
    v_current_user_id,
    v_user_email,
    COALESCE(
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_current_user_id),
      split_part(v_user_email, '@', 1)
    ),
    v_superadmin_role_id,
    true
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USUÁRIO CRIADO COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_user_email;
  RAISE NOTICE 'Role: Superadmin';
  RAISE NOTICE 'Permissões: TODAS (can_view, can_create, can_edit, is_admin)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 IMPORTANTE: Recarregue a página do navegador!';
  RAISE NOTICE 'As permissões serão carregadas no próximo login/refresh.';
  RAISE NOTICE '========================================';
END $$;

-- ==============================================================================
-- VERIFICAÇÃO FINAL
-- ==============================================================================

-- Verificar novamente suas permissões
SELECT 
  '=== SUAS PERMISSÕES ATUAIS ===' as info,
  * 
FROM get_user_permissions(auth.uid());

-- Ver todos os usuários do sistema
SELECT 
  u.email,
  u.full_name,
  r.name as role,
  u.is_active,
  u.created_at
FROM system_users u
LEFT JOIN system_roles r ON u.role_id = r.id
ORDER BY u.created_at DESC;
