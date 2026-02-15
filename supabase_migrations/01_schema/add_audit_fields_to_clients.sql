-- Migration: Add audit fields to erp_clients table
-- Description: Adds created_by and updated_by fields to track which user created and modified each client
-- Date: 2026-01-07

-- Add created_by field (nullable for existing records)
ALTER TABLE erp_clients 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES system_users(id) ON DELETE SET NULL;

-- Add updated_by field (nullable for existing records)
ALTER TABLE erp_clients 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES system_users(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_erp_clients_created_by ON erp_clients(created_by);
CREATE INDEX IF NOT EXISTS idx_erp_clients_updated_by ON erp_clients(updated_by);

-- Add comment to document the fields
COMMENT ON COLUMN erp_clients.created_by IS 'UUID of the user who created this client record';
COMMENT ON COLUMN erp_clients.updated_by IS 'UUID of the user who last updated this client record';
