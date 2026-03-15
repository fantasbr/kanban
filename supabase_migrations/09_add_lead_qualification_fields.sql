-- ============================================
-- CRM - Lead qualification fields on crm_deals
-- Migration: 09_add_lead_qualification_fields
-- Date: 2026-03-15
-- ============================================

ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS decisor_imediato text,
  ADD COLUMN IF NOT EXISTS tipo_servico text,
  ADD COLUMN IF NOT EXISTS local_servico text,
  ADD COLUMN IF NOT EXISTS experiencia_previa text,
  ADD COLUMN IF NOT EXISTS urgencia text,
  ADD COLUMN IF NOT EXISTS forma_pagamento text,
  ADD COLUMN IF NOT EXISTS ponto_decisao text,
  ADD COLUMN IF NOT EXISTS objecao_principal text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_deals_tipo_servico_check'
  ) THEN
    ALTER TABLE public.crm_deals
      ADD CONSTRAINT crm_deals_tipo_servico_check
      CHECK (
        tipo_servico IS NULL
        OR tipo_servico IN ('Carro', 'Moto', 'PCD', 'Carreta')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'crm_deals_urgencia_check'
  ) THEN
    ALTER TABLE public.crm_deals
      ADD CONSTRAINT crm_deals_urgencia_check
      CHECK (
        urgencia IS NULL
        OR urgencia IN ('imediata', 'semana', 'mes', 'sem_pressa')
      );
  END IF;
END $$;

