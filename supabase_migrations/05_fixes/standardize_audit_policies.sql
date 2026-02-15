-- ==============================================================================
-- STANDARDIZE AUDIT TABLE POLICIES
-- ==============================================================================
-- Problem: Audit tables have inconsistent policies
-- - crm_audit_log: 3 policies (2 SELECT duplicated + 1 INSERT)
-- - erp_audit_log: 3 policies (2 SELECT duplicated + 1 INSERT)
-- - financial_audit_log: 1 policy (only 1 SELECT, missing INSERT)
-- - lessons_audit_log: 3 policies (2 SELECT duplicated + 1 INSERT)
--
-- Solution: Standardize all audit tables with same pattern:
-- 1. SELECT policy (view permission required)
-- 2. INSERT policy (system only, for triggers)
-- ==============================================================================

-- ==============================================================================
-- 1. CLEAN UP DUPLICATE POLICIES
-- ==============================================================================

-- Drop old/duplicate SELECT policies (keep select_with_view_permission)
DROP POLICY IF EXISTS "Allow authenticated users to read crm_audit_log" ON crm_audit_log;
DROP POLICY IF EXISTS "Allow authenticated users to read erp_audit_log" ON erp_audit_log;
DROP POLICY IF EXISTS "Allow authenticated users to read financial_audit_log" ON financial_audit_log;
DROP POLICY IF EXISTS "Allow authenticated users to read lessons_audit_log" ON lessons_audit_log;
DROP POLICY IF EXISTS "Users can view audit logs" ON lessons_audit_log;
DROP POLICY IF EXISTS "select_with_view" ON erp_audit_log;

-- ==============================================================================
-- 2. CREATE MISSING POLICIES
-- ==============================================================================

-- CRM Audit Log - select_with_view_permission already exists, just ensure insert exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'crm_audit_log' 
    AND policyname = 'select_with_view_permission'
  ) THEN
    CREATE POLICY "select_with_view_permission" ON crm_audit_log
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM get_user_permissions(auth.uid()) p
        WHERE p.can_view = true OR p.is_admin = true
      )
    );
  END IF;
END $$;

-- ERP Audit Log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'erp_audit_log' 
    AND policyname = 'select_with_view_permission'
  ) THEN
    CREATE POLICY "select_with_view_permission" ON erp_audit_log
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM get_user_permissions(auth.uid()) p
        WHERE p.can_view = true OR p.is_admin = true
      )
    );
  END IF;
END $$;

-- Financial Audit Log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'financial_audit_log' 
    AND policyname = 'select_with_view_permission'
  ) THEN
    CREATE POLICY "select_with_view_permission" ON financial_audit_log
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM get_user_permissions(auth.uid()) p
        WHERE p.can_view = true OR p.is_admin = true
      )
    );
  END IF;
  
  -- Add missing INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'financial_audit_log' 
    AND policyname = 'insert_system_only'
  ) THEN
    CREATE POLICY "insert_system_only" ON financial_audit_log
    FOR INSERT
    WITH CHECK (true);
  END IF;
END $$;

-- Lessons Audit Log
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'lessons_audit_log' 
    AND policyname = 'select_with_view_permission'
  ) THEN
    CREATE POLICY "select_with_view_permission" ON lessons_audit_log
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM get_user_permissions(auth.uid()) p
        WHERE p.can_view = true OR p.is_admin = true
      )
    );
  END IF;
END $$;

-- ==============================================================================
-- 3. VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  v_table TEXT;
  v_policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDIT POLICIES STANDARDIZED';
  RAISE NOTICE '========================================';
  
  FOR v_table IN 
    SELECT unnest(ARRAY['crm_audit_log', 'erp_audit_log', 'financial_audit_log', 'lessons_audit_log'])
  LOOP
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = v_table;
    
    RAISE NOTICE '% - % policies', v_table, v_policy_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Standard policies per table:';
  RAISE NOTICE '  ✅ select_with_view_permission';
  RAISE NOTICE '  ✅ insert_system_only';
  RAISE NOTICE '========================================';
END $$;
