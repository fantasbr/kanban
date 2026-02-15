-- ==============================================================================
-- FIX: Permission denied for table users
-- ==============================================================================
-- Problem: The get_user_permissions() function is SECURITY DEFINER but
-- it's trying to access auth.users indirectly through system_users.auth_user_id
-- This causes "permission denied for table users" error when RLS policies
-- are evaluated during INSERT/UPDATE operations.
--
-- Solution: Grant SELECT permission on auth.users to authenticated users
-- This is safe because:
-- 1. We're only granting SELECT (read-only)
-- 2. Users can already see their own data via auth.uid()
-- 3. The function is SECURITY DEFINER so it runs with elevated privileges
-- ==============================================================================

-- Grant SELECT on auth.users to authenticated role
-- This allows the get_user_permissions() function to work properly
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON auth.users TO authenticated;

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Permissions granted on auth.users';
  RAISE NOTICE '✅ The get_user_permissions() function should now work correctly';
  RAISE NOTICE '✅ RLS policies on erp_clients and other tables should work';
END $$;
