-- ==============================================================================
-- CRIAR SEU USUÁRIO E REABILITAR RLS
-- ==============================================================================
-- Execute este script DEPOIS de conseguir fazer login na aplicação
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email real
-- ==============================================================================

DO $$
DECLARE
  v_superadmin_role_id UUID;
  v_auth_user_id UUID;
  v_user_email TEXT := 'angelofilho@gmail.com'; -- ✅ SEU EMAIL
BEGIN
  -- Buscar role Superadmin
  SELECT id INTO v_superadmin_role_id 
  FROM system_roles 
  WHERE slug = 'superadmin';
  
  IF v_superadmin_role_id IS NULL THEN
    RAISE EXCEPTION 'Role Superadmin não encontrada!';
  END IF;
  
  -- Buscar seu user_id pelo email
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_user_email;
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado em auth.users!', v_user_email;
  END IF;
  
  -- Verificar se já existe
  IF EXISTS (SELECT 1 FROM system_users WHERE auth_user_id = v_auth_user_id) THEN
    RAISE NOTICE '✅ Usuário já existe em system_users!';
    
    -- Atualizar para garantir que está ativo e é superadmin
    UPDATE system_users
    SET role_id = v_superadmin_role_id,
        is_active = true
    WHERE auth_user_id = v_auth_user_id;
    
    RAISE NOTICE '✅ Permissões atualizadas para Superadmin!';
  ELSE
    -- Criar registro em system_users
    INSERT INTO system_users (
      auth_user_id,
      email,
      full_name,
      role_id,
      is_active
    ) VALUES (
      v_auth_user_id,
      v_user_email,
      COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_auth_user_id),
        split_part(v_user_email, '@', 1)
      ),
      v_superadmin_role_id,
      true
    );
    
    RAISE NOTICE '✅ Usuário criado com sucesso!';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email: %', v_user_email;
  RAISE NOTICE 'Role: Superadmin';
  RAISE NOTICE 'Permissões: TODAS';
  RAISE NOTICE '========================================';
END $$;

-- Reabilitar RLS em TODAS as tabelas CRM
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deal_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

-- Verificar
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

-- Ver seu usuário criado
SELECT 
  u.email,
  u.full_name,
  r.name as role,
  r.can_view,
  r.can_create,
  r.can_edit,
  r.is_admin,
  u.is_active
FROM system_users u
LEFT JOIN system_roles r ON u.role_id = r.id
WHERE u.email = 'angelofilho@gmail.com'; -- ✅ SEU EMAIL

SELECT '✅ Tudo pronto! Recarregue a página do navegador.' as status;
