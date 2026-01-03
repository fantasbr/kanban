-- =====================================================
-- Migration: Update Contract Status Constraint
-- Description: Updates status check constraint to accept new status values
-- =====================================================

-- 1. Drop old constraint
ALTER TABLE erp_contracts 
DROP CONSTRAINT IF EXISTS erp_contracts_status_check;

-- 2. Add new constraint with updated status values
ALTER TABLE erp_contracts 
ADD CONSTRAINT erp_contracts_status_check 
CHECK (status IN ('active', 'completed', 'inactive'));

-- 3. Update any existing 'draft' or 'cancelled' contracts to 'inactive'
UPDATE erp_contracts 
SET status = 'inactive' 
WHERE status IN ('draft', 'cancelled');
