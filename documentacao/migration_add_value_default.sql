-- Migration: Add value_default to crm_deal_titles
-- Description: Adds a value_default column to store default deal values for each title

ALTER TABLE crm_deal_titles 
ADD COLUMN value_default NUMERIC(10, 2) DEFAULT NULL;

COMMENT ON COLUMN crm_deal_titles.value_default IS 'Default value for deals with this title';
