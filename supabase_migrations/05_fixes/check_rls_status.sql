-- ==============================================================================
-- VERIFICAR STATUS ATUAL DO RLS
-- ==============================================================================

-- Ver status de RLS em todas as tabelas CRM
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '🔒 HABILITADO (bloqueando)'
    ELSE '🔓 DESABILITADO (permitindo)'
  END as rls_status,
  rowsecurity as raw_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'crm_%'
ORDER BY tablename;

-- Ver políticas ativas em crm_deals
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'w' THEN 'UPDATE'
    WHEN cmd = 'd' THEN 'DELETE'
    ELSE 'ALL'
  END as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'crm_deals';

-- Verificar se você existe em system_users
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM auth.users WHERE email = 'angelofilho@gmail.com'
    ) THEN '✅ Você existe em auth.users'
    ELSE '❌ Você NÃO existe em auth.users'
  END as auth_status;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM system_users u
      JOIN auth.users a ON u.auth_user_id = a.id
      WHERE a.email = 'angelofilho@gmail.com'
    ) THEN '✅ Você existe em system_users'
    ELSE '❌ Você NÃO existe em system_users'
  END as system_user_status;
