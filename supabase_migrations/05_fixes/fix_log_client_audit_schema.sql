-- ==============================================================================
-- FIX: Update log_client_audit function to match erp_audit_log schema
-- ==============================================================================
-- Problem: The log_client_audit() function is trying to insert into columns
-- that don't exist: entity_type, entity_id, metadata
--
-- Actual schema has: table_name, record_id, action, user_id, user_email,
-- old_values, new_values, ip_address, user_agent, created_at
--
-- Solution: Recreate the function to match the actual table schema
-- ==============================================================================

CREATE OR REPLACE FUNCTION log_client_audit()
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
      'erp_clients',
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
      'erp_clients',
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

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE '✅ log_client_audit() function updated to match erp_audit_log schema';
  RAISE NOTICE '✅ Function now uses: table_name, record_id instead of entity_type, entity_id';
  RAISE NOTICE '✅ Removed metadata column (data is in old_values/new_values)';
END $$;
