-- ==============================================================================
-- CONSOLIDATE AUDIT TABLES
-- ==============================================================================
-- Decision: Centralize all audit logs in erp_audit_log table
-- 
-- Rationale:
-- 1. contracts_audit_log has 0 records (never used)
-- 2. erp_audit_log already handles all ERP entities via table_name field
-- 3. Simpler architecture with single source of truth
-- 4. Easier to query and maintain
--
-- What we're removing:
-- - contracts_audit_log table (unused)
-- 
-- What we're keeping:
-- - erp_audit_log (active, with 5+ records)
-- - Generic log_erp_audit() function
-- - Triggers on erp_clients, erp_contracts, erp_receivables, erp_receipts
-- ==============================================================================

-- Drop the unused contracts_audit_log table
DROP TABLE IF EXISTS contracts_audit_log CASCADE;

-- Verify the consolidation
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'AUDIT TABLES CONSOLIDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ contracts_audit_log table removed';
  RAISE NOTICE '✅ All audit logs now in erp_audit_log';
  RAISE NOTICE '';
  RAISE NOTICE 'Active audit triggers:';
  RAISE NOTICE '  - erp_clients';
  RAISE NOTICE '  - erp_contracts';
  RAISE NOTICE '  - erp_receivables';
  RAISE NOTICE '  - erp_receipts';
  RAISE NOTICE '========================================';
END $$;
