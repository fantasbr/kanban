-- ==============================================================================
-- CONFIGURE FINANCIAL AUDIT TABLE
-- ==============================================================================
-- Decision: Use separate financial_audit_log for financial operations
-- 
-- Rationale:
-- 1. Financial data requires separate audit trail for compliance
-- 2. Different schema (entity_type, entity_id, metadata) vs erp_audit_log
-- 3. Easier to export/analyze financial audit separately
--
-- Tables to audit in financial_audit_log:
-- - erp_receivables (contas a receber)
-- - erp_receipts (recibos)
-- ==============================================================================

-- ==============================================================================
-- 1. CREATE FINANCIAL AUDIT FUNCTION
-- ==============================================================================

CREATE OR REPLACE FUNCTION log_financial_audit()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_user_email VARCHAR;
  action_type TEXT;
  entity_type_name TEXT;
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
  
  -- Determinar entity_type baseado na tabela
  CASE TG_TABLE_NAME
    WHEN 'erp_receivables' THEN entity_type_name := 'receivable';
    WHEN 'erp_receipts' THEN entity_type_name := 'receipt';
    ELSE entity_type_name := 'unknown';
  END CASE;
  
  -- Inserir log em financial_audit_log
  IF TG_OP = 'DELETE' THEN
    INSERT INTO financial_audit_log (
      action,
      entity_type,
      entity_id,
      user_id,
      user_email,
      metadata,
      old_values
    ) VALUES (
      action_type,
      entity_type_name,
      OLD.id::TEXT,
      current_user_id,
      current_user_email,
      CASE 
        WHEN TG_TABLE_NAME = 'erp_receivables' THEN jsonb_build_object(
          'amount', OLD.amount,
          'due_date', OLD.due_date,
          'status', OLD.status,
          'installment_number', OLD.installment_number
        )
        WHEN TG_TABLE_NAME = 'erp_receipts' THEN jsonb_build_object(
          'receipt_number', OLD.receipt_number,
          'amount', OLD.amount,
          'receipt_date', OLD.receipt_date
        )
        ELSE NULL
      END,
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSE
    INSERT INTO financial_audit_log (
      action,
      entity_type,
      entity_id,
      user_id,
      user_email,
      metadata,
      old_values,
      new_values
    ) VALUES (
      action_type,
      entity_type_name,
      NEW.id::TEXT,
      current_user_id,
      current_user_email,
      CASE 
        WHEN TG_TABLE_NAME = 'erp_receivables' THEN jsonb_build_object(
          'amount', NEW.amount,
          'due_date', NEW.due_date,
          'status', NEW.status,
          'installment_number', NEW.installment_number,
          'contract_id', NEW.contract_id,
          'client_id', NEW.client_id
        )
        WHEN TG_TABLE_NAME = 'erp_receipts' THEN jsonb_build_object(
          'receipt_number', NEW.receipt_number,
          'amount', NEW.amount,
          'receipt_date', NEW.receipt_date,
          'client_id', NEW.client_id
        )
        ELSE NULL
      END,
      CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. UPDATE TRIGGERS TO USE FINANCIAL AUDIT
-- ==============================================================================

-- Drop existing ERP audit triggers on financial tables
DROP TRIGGER IF EXISTS trigger_log_erp_audit ON erp_receivables;
DROP TRIGGER IF EXISTS trigger_log_erp_audit ON erp_receipts;

-- Create financial audit triggers
CREATE TRIGGER trigger_log_financial_audit
AFTER INSERT OR UPDATE OR DELETE ON erp_receivables
FOR EACH ROW
EXECUTE FUNCTION log_financial_audit();

CREATE TRIGGER trigger_log_financial_audit
AFTER INSERT OR UPDATE OR DELETE ON erp_receipts
FOR EACH ROW
EXECUTE FUNCTION log_financial_audit();

-- ==============================================================================
-- 3. MIGRATE EXISTING FINANCIAL LOGS FROM ERP_AUDIT_LOG
-- ==============================================================================

-- Move existing receivables and receipts logs to financial_audit_log
INSERT INTO financial_audit_log (
  action,
  entity_type,
  entity_id,
  user_id,
  user_email,
  metadata,
  old_values,
  new_values,
  created_at
)
SELECT 
  action,
  CASE 
    WHEN table_name = 'erp_receivables' THEN 'receivable'
    WHEN table_name = 'erp_receipts' THEN 'receipt'
  END as entity_type,
  record_id::TEXT as entity_id,
  user_id,
  user_email,
  CASE 
    WHEN table_name = 'erp_receivables' THEN jsonb_build_object(
      'amount', new_values->>'amount',
      'due_date', new_values->>'due_date',
      'status', new_values->>'status',
      'installment_number', new_values->>'installment_number'
    )
    WHEN table_name = 'erp_receipts' THEN jsonb_build_object(
      'receipt_number', new_values->>'receipt_number',
      'amount', new_values->>'amount',
      'receipt_date', new_values->>'receipt_date'
    )
  END as metadata,
  old_values,
  new_values,
  created_at
FROM erp_audit_log
WHERE table_name IN ('erp_receivables', 'erp_receipts');

-- Delete migrated records from erp_audit_log
DELETE FROM erp_audit_log
WHERE table_name IN ('erp_receivables', 'erp_receipts');

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  v_financial_logs INTEGER;
  v_erp_logs INTEGER;
BEGIN
  -- Count financial logs
  SELECT COUNT(*) INTO v_financial_logs FROM financial_audit_log;
  
  -- Count remaining ERP logs
  SELECT COUNT(*) INTO v_erp_logs FROM erp_audit_log;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINANCIAL AUDIT CONFIGURED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Financial audit logs: %', v_financial_logs;
  RAISE NOTICE 'ERP audit logs: %', v_erp_logs;
  RAISE NOTICE '';
  RAISE NOTICE '✅ log_financial_audit() function created';
  RAISE NOTICE '✅ Triggers updated on erp_receivables';
  RAISE NOTICE '✅ Triggers updated on erp_receipts';
  RAISE NOTICE '✅ Existing logs migrated';
  RAISE NOTICE '========================================';
END $$;
