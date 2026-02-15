-- ==============================================================================
-- ADD AUDIT TRIGGERS FOR ALL ERP TABLES
-- ==============================================================================
-- Currently only erp_clients has audit triggers
-- This migration adds audit triggers for:
-- - erp_contracts
-- - erp_receivables
-- - erp_receipts
-- ==============================================================================

-- ==============================================================================
-- 1. CREATE GENERIC AUDIT FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION log_erp_audit()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_user_email VARCHAR;
  action_type TEXT;
BEGIN
  -- Capturar user_id
  current_user_id := auth.uid();
  
  -- Buscar email
  SELECT email INTO current_user_email 
  FROM auth.users 
  WHERE id = current_user_id;
  
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
  END IF;
  
  -- Inserir log em erp_audit_log
  IF TG_OP = 'DELETE' THEN
    INSERT INTO erp_audit_log (
      table_name,
      record_id,
      action,
      user_id,
      user_email,
      old_values
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      action_type,
      current_user_id,
      current_user_email,
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSE
    INSERT INTO erp_audit_log (
      table_name,
      record_id,
      action,
      user_id,
      user_email,
      old_values,
      new_values
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id,
      action_type,
      current_user_id,
      current_user_email,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. UPDATE EXISTING TRIGGER FOR CLIENTS TO USE GENERIC FUNCTION
-- ==============================================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trigger_log_client_audit ON erp_clients;

-- Create new trigger using generic function
CREATE TRIGGER trigger_log_erp_audit
AFTER INSERT OR UPDATE OR DELETE ON erp_clients
FOR EACH ROW
EXECUTE FUNCTION log_erp_audit();

-- ==============================================================================
-- 3. CREATE TRIGGERS FOR CONTRACTS
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_log_erp_audit ON erp_contracts;

CREATE TRIGGER trigger_log_erp_audit
AFTER INSERT OR UPDATE OR DELETE ON erp_contracts
FOR EACH ROW
EXECUTE FUNCTION log_erp_audit();

-- ==============================================================================
-- 4. CREATE TRIGGERS FOR RECEIVABLES
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_log_erp_audit ON erp_receivables;

CREATE TRIGGER trigger_log_erp_audit
AFTER INSERT OR UPDATE OR DELETE ON erp_receivables
FOR EACH ROW
EXECUTE FUNCTION log_erp_audit();

-- ==============================================================================
-- 5. CREATE TRIGGERS FOR RECEIPTS
-- ==============================================================================

DROP TRIGGER IF EXISTS trigger_log_erp_audit ON erp_receipts;

CREATE TRIGGER trigger_log_erp_audit
AFTER INSERT OR UPDATE OR DELETE ON erp_receipts
FOR EACH ROW
EXECUTE FUNCTION log_erp_audit();

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  -- Count triggers using log_erp_audit
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND action_statement LIKE '%log_erp_audit%';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDIT TRIGGERS CREATED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total audit triggers: %', v_trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE '✅ erp_clients - audit enabled';
  RAISE NOTICE '✅ erp_contracts - audit enabled';
  RAISE NOTICE '✅ erp_receivables - audit enabled';
  RAISE NOTICE '✅ erp_receipts - audit enabled';
  RAISE NOTICE '========================================';
END $$;
