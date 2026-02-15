-- ==============================================================================
-- FIX FINANCIAL AUDIT FUNCTION
-- ==============================================================================
-- Problem: Function tries to access NEW.receipt_number on erp_receivables
-- which doesn't have that column (only erp_receipts has it)
--
-- Solution: Only access table-specific columns when on the correct table
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
      -- FIX: Only access columns that exist in the current table
      CASE 
        WHEN TG_TABLE_NAME = 'erp_receivables' THEN jsonb_build_object(
          'amount', NEW.amount,
          'due_date', NEW.due_date,
          'status', NEW.status,
          'installment_number', NEW.installment_number
        )
        WHEN TG_TABLE_NAME = 'erp_receipts' THEN jsonb_build_object(
          'receipt_number', NEW.receipt_number,
          'amount', NEW.amount,
          'receipt_date', NEW.receipt_date
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
