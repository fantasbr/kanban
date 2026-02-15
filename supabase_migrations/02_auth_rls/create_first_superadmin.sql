-- ==============================================================================
-- CRIAR PRIMEIRO SUPERADMIN
-- ==============================================================================
-- Este script vincula o primeiro usuário do auth.users como Superadmin
-- Execute este script APÓS a migration_user_management.sql
-- ==============================================================================

DO $$
DECLARE
  v_role_id UUID;
  v_auth_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Buscar role Superadmin
  SELECT id INTO v_role_id FROM system_roles WHERE slug = 'superadmin';
  
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role Superadmin não encontrada. Execute migration_user_management.sql primeiro.';
  END IF;
  
  -- Buscar o primeiro usuário do auth (assumindo que é você)
  SELECT id, email INTO v_auth_user_id, v_user_email 
  FROM auth.users 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum usuário encontrado no auth.users. Crie um usuário primeiro via Supabase Dashboard.';
  END IF;
  
  -- Criar registro em system_users
  INSERT INTO system_users (auth_user_id, email, full_name, role_id, is_active)
  SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    v_role_id,
    true
  FROM auth.users
  WHERE id = v_auth_user_id
  ON CONFLICT (auth_user_id) DO UPDATE
  SET role_id = v_role_id, is_active = true;
  
  RAISE NOTICE '✅ Superadmin criado com sucesso!';
  RAISE NOTICE '📧 Email: %', v_user_email;
  RAISE NOTICE '🔑 User ID: %', v_auth_user_id;
  RAISE NOTICE '👑 Role: Superadmin';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Próximo passo: Faça login e acesse /system/users';
END $$;
