-- =====================================================
-- Migration: Add Contract Status Audit System
-- Description: Implements status change history with justification
-- Status: active (Ativo), completed (Concluído), inactive (Inativo)
-- =====================================================

-- 1. Create status history table
CREATE TABLE IF NOT EXISTS erp_contract_status_history (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES erp_contracts(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  reason TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_contract_status_history_contract 
  ON erp_contract_status_history(contract_id);
  
CREATE INDEX IF NOT EXISTS idx_contract_status_history_changed_at 
  ON erp_contract_status_history(changed_at DESC);

-- 3. Add temporary field for status change reason
ALTER TABLE erp_contracts 
ADD COLUMN IF NOT EXISTS status_change_reason TEXT;

-- 4. Create function to log status changes
CREATE OR REPLACE FUNCTION log_contract_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO erp_contract_status_history (
      contract_id,
      old_status,
      new_status,
      changed_by,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      COALESCE(NEW.status_change_reason, 'Mudança sem justificativa registrada')
    );
    
    -- Clear temporary field
    NEW.status_change_reason := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger
DROP TRIGGER IF EXISTS trigger_log_contract_status_change ON erp_contracts;
CREATE TRIGGER trigger_log_contract_status_change
  BEFORE UPDATE ON erp_contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_status_change();

-- 6. Enable RLS
ALTER TABLE erp_contract_status_history ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
-- View: Users with can_view permission
CREATE POLICY "Users can view contract status history"
  ON erp_contract_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM get_user_permissions(auth.uid())
      WHERE can_view = true
    )
  );

-- Insert: System only (via trigger)
CREATE POLICY "System can insert status history"
  ON erp_contract_status_history
  FOR INSERT
  WITH CHECK (true);

-- 8. Add comment
COMMENT ON TABLE erp_contract_status_history IS 'Audit trail for contract status changes';
COMMENT ON COLUMN erp_contract_status_history.reason IS 'Justification for status change (required)';
COMMENT ON COLUMN erp_contract_status_history.changed_by IS 'User who made the change';
