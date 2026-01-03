-- ============================================
-- FIX: Permissões de Criação de Deals e Logs
-- ============================================

-- 1. Garantir RLS em crm_deals
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

-- Recriar política de INSERT para crm_deals com permissão explícita
DROP POLICY IF EXISTS "Users can create deals" ON crm_deals;
CREATE POLICY "Users can create deals"
ON crm_deals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Recriar política de SELECT para crm_deals
DROP POLICY IF EXISTS "Users can view deals" ON crm_deals;
CREATE POLICY "Users can view deals"
ON crm_deals
FOR SELECT
TO authenticated
USING (true);

-- Recriar política de UPDATE para crm_deals
DROP POLICY IF EXISTS "Users can update deals" ON crm_deals;
CREATE POLICY "Users can update deals"
ON crm_deals
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Garantir RLS em crm_activity_log
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

-- Recriar política de INSERT para crm_activity_log
DROP POLICY IF EXISTS "Allow authenticated users to insert activity logs" ON crm_activity_log;
CREATE POLICY "Allow authenticated users to insert activity logs"
ON crm_activity_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Melhorar o trigger log_deal_created para ser mais resiliente
CREATE OR REPLACE FUNCTION log_deal_created()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_name TEXT;
  stage_name TEXT;
  contact_name TEXT;
  user_email_val TEXT;
BEGIN
  -- Tentar buscar email do usuário
  BEGIN
    SELECT email INTO user_email_val FROM auth.users WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN
    user_email_val := NULL;
  END;

  -- Buscar informações relacionadas (com tratamento básico de erro/nulo)
  BEGIN
    SELECT p.name INTO pipeline_name
    FROM crm_stages s
    JOIN crm_pipelines p ON s.pipeline_id = p.id
    WHERE s.id = NEW.stage_id;
  EXCEPTION WHEN OTHERS THEN
    pipeline_name := NULL;
  END;
  
  BEGIN
    SELECT name INTO stage_name
    FROM crm_stages
    WHERE id = NEW.stage_id;
  EXCEPTION WHEN OTHERS THEN
    stage_name := NULL;
  END;
  
  BEGIN
    SELECT name INTO contact_name
    FROM crm_contacts
    WHERE id = NEW.contact_id;
  EXCEPTION WHEN OTHERS THEN
    contact_name := NULL;
  END;
  
  -- Tentar inserir o log
  -- REMOVIDO: EXCEPTION WHEN OTHERS (Falhar se não conseguir logar)
  INSERT INTO crm_activity_log (
    activity_type,
    entity_type,
    entity_id,
    user_id,
    user_email,
    metadata,
    new_values
  ) VALUES (
    'deal_created',
    'deal',
    NEW.id,
    auth.uid(),
    user_email_val,
    jsonb_build_object(
      'deal_title', NEW.title,
      'pipeline_name', pipeline_name,
      'stage_name', stage_name,
      'contact_name', contact_name,
      'deal_value', NEW.deal_value_negotiated,
      'priority', NEW.priority
    ),
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
