-- ==============================================================================
-- VERIFICAR E CORRIGIR SUAS PERMISSÕES
-- ==============================================================================

-- Ver suas permissões atuais
SELECT 
  u.email,
  u.full_name,
  r.name as role_name,
  r.can_view,
  r.can_create,
  r.can_edit,
  r.is_admin,
  u.is_active
FROM system_users u
LEFT JOIN system_roles r ON u.role_id = r.id
JOIN auth.users a ON u.auth_user_id = a.id
WHERE a.email = 'angelofilho@gmail.com';

-- Atualizar para Superadmin se não for
DO $$
DECLARE
  v_superadmin_role_id UUID;
  v_user_id UUID;
BEGIN
  -- Buscar role Superadmin
  SELECT id INTO v_superadmin_role_id 
  FROM system_roles 
  WHERE slug = 'superadmin';
  
  -- Buscar seu user_id
  SELECT u.id INTO v_user_id
  FROM system_users u
  JOIN auth.users a ON u.auth_user_id = a.id
  WHERE a.email = 'angelofilho@gmail.com';
  
  -- Atualizar para Superadmin
  UPDATE system_users
  SET role_id = v_superadmin_role_id,
      is_active = true
  WHERE id = v_user_id;
  
  RAISE NOTICE '✅ Permissões atualizadas para Superadmin!';
END $$;

-- Verificar novamente
SELECT 
  u.email,
  u.full_name,
  r.name as role_name,
  r.can_view,
  r.can_create,
  r.can_edit,
  r.is_admin,
  u.is_active,
  CASE 
    WHEN r.can_create THEN '✅ PODE CRIAR'
    ELSE '❌ NÃO PODE CRIAR'
  END as status_create
FROM system_users u
LEFT JOIN system_roles r ON u.role_id = r.id
JOIN auth.users a ON u.auth_user_id = a.id
WHERE a.email = 'angelofilho@gmail.com';
