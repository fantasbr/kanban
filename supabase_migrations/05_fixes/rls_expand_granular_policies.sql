-- ==============================================================================
-- EXPAND RLS POLICIES: ALL → INSERT/UPDATE/DELETE
-- ==============================================================================
-- Goal: Replace generic ALL policies with granular INSERT/UPDATE/DELETE policies
-- 
-- Tables affected: 11 ERP tables
-- - erp_companies, erp_contract_items, erp_contract_items_catalog
-- - erp_contract_template_items, erp_contract_templates, erp_contract_types
-- - erp_instructor_companies, erp_lessons, erp_payment_methods
-- - erp_pdf_templates, erp_vehicle_companies
--
-- Pattern: Same as critical tables (erp_clients, erp_contracts)
-- - SELECT: can_view or is_admin
-- - INSERT: can_create or is_admin
-- - UPDATE: can_edit or is_admin
-- - DELETE: is_admin only
-- ==============================================================================

-- ==============================================================================
-- 1. DROP EXISTING ALL POLICIES
-- ==============================================================================

DROP POLICY IF EXISTS "modify_with_permission" ON erp_companies;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_contract_items;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_contract_items_catalog;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_contract_template_items;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_contract_templates;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_contract_types;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_instructor_companies;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_lessons;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_payment_methods;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_pdf_templates;
DROP POLICY IF EXISTS "modify_with_permission" ON erp_vehicle_companies;

-- ==============================================================================
-- 2. CREATE GRANULAR POLICIES - erp_companies
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_companies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_companies
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

CREATE POLICY "delete_admin_only" ON erp_companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 3. CREATE GRANULAR POLICIES - erp_contract_items
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_contract_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_contract_items
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

CREATE POLICY "delete_admin_only" ON erp_contract_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 4. CREATE GRANULAR POLICIES - erp_contract_items_catalog
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_contract_items_catalog
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_contract_items_catalog
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

CREATE POLICY "delete_admin_only" ON erp_contract_items_catalog
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 5. CREATE GRANULAR POLICIES - erp_contract_template_items
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_contract_template_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_contract_template_items
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

CREATE POLICY "delete_admin_only" ON erp_contract_template_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 6. CREATE GRANULAR POLICIES - erp_contract_templates
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_contract_templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_contract_templates
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

CREATE POLICY "delete_admin_only" ON erp_contract_templates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 7. CREATE GRANULAR POLICIES - erp_contract_types
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_contract_types
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_contract_types
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

CREATE POLICY "delete_admin_only" ON erp_contract_types
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 8. CREATE GRANULAR POLICIES - erp_instructor_companies
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_instructor_companies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_instructor_companies
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

CREATE POLICY "delete_admin_only" ON erp_instructor_companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 9. CREATE GRANULAR POLICIES - erp_lessons
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_lessons
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_lessons
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

CREATE POLICY "delete_admin_only" ON erp_lessons
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 10. CREATE GRANULAR POLICIES - erp_payment_methods
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_payment_methods
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_payment_methods
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

CREATE POLICY "delete_admin_only" ON erp_payment_methods
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 11. CREATE GRANULAR POLICIES - erp_pdf_templates
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_pdf_templates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_pdf_templates
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

CREATE POLICY "delete_admin_only" ON erp_pdf_templates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 12. CREATE GRANULAR POLICIES - erp_vehicle_companies
-- ==============================================================================

CREATE POLICY "insert_with_create_permission" ON erp_vehicle_companies
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

CREATE POLICY "update_with_edit_permission" ON erp_vehicle_companies
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

CREATE POLICY "delete_admin_only" ON erp_vehicle_companies
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 13. VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  v_table TEXT;
  v_policy_count INTEGER;
  v_operations TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICIES EXPANDED TO GRANULAR';
  RAISE NOTICE '========================================';
  
  FOR v_table IN 
    SELECT unnest(ARRAY[
      'erp_companies', 'erp_contract_items', 'erp_contract_items_catalog',
      'erp_contract_template_items', 'erp_contract_templates', 'erp_contract_types',
      'erp_instructor_companies', 'erp_lessons', 'erp_payment_methods',
      'erp_pdf_templates', 'erp_vehicle_companies'
    ])
  LOOP
    SELECT 
      COUNT(*),
      array_agg(cmd ORDER BY cmd)
    INTO v_policy_count, v_operations
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = v_table;
    
    RAISE NOTICE '% - % policies: %', v_table, v_policy_count, v_operations;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Expected: 4 policies per table';
  RAISE NOTICE 'Operations: {DELETE, INSERT, SELECT, UPDATE}';
  RAISE NOTICE '========================================';
END $$;
