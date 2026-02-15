-- ==============================================================================
-- FIX RLS: crm_deal_items
-- ==============================================================================
-- CRITICAL: This table has RLS DISABLED, making data accessible without auth
-- 
-- Risk Level: HIGH
-- Impact: Deal items (products/services in deals) are unprotected
-- 
-- Solution: Enable RLS + create standard policies
-- ==============================================================================

-- ==============================================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE crm_deal_items ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. CREATE POLICIES
-- ==============================================================================

-- SELECT: Users with view permission can see deal items
CREATE POLICY "select_with_view_permission" ON crm_deal_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_view = true OR p.is_admin = true
  )
);

-- INSERT: Users with create permission can add deal items
CREATE POLICY "insert_with_create_permission" ON crm_deal_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

-- UPDATE: Users with edit permission can modify deal items
CREATE POLICY "update_with_edit_permission" ON crm_deal_items
FOR UPDATE
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

-- DELETE: Only admins can delete deal items
CREATE POLICY "delete_admin_only" ON crm_deal_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 3. VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policy_count INTEGER;
BEGIN
  -- Check RLS status
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'crm_deal_items';
  
  -- Count policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'crm_deal_items';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS FIX: crm_deal_items';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Enabled: %', v_rls_enabled;
  RAISE NOTICE 'Policies Created: %', v_policy_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ SELECT policy (can_view or is_admin)';
  RAISE NOTICE '✅ INSERT policy (can_create or is_admin)';
  RAISE NOTICE '✅ UPDATE policy (can_edit or is_admin)';
  RAISE NOTICE '✅ DELETE policy (is_admin only)';
  RAISE NOTICE '========================================';
END $$;
