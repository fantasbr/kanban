-- Migration: Rename deal_value to deal_value_negotiated
-- Description: Renames the deal_value column to deal_value_negotiated in crm_deals table

ALTER TABLE crm_deals 
RENAME COLUMN deal_value TO deal_value_negotiated;
