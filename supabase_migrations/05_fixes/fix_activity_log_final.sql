-- ============================================
-- FIX FINAL: Trigger de Mudança de Stage
-- Solução que funciona com contexto de auth do Supabase
-- ============================================

-- A solução é remover SECURITY DEFINER e garantir que a tabela
-- crm_activity_log tenha RLS configurado corretamente

-- 1. Recriar função SEM SECURITY DEFINER
CREATE OR REPLACE FUNCTION log_deal_stage_changed()
RETURNS TRIGGER AS $$
DECLARE
  old_stage_name TEXT;
  new_stage_name TEXT;
  pipeline_name TEXT;
  contact_name TEXT;
BEGIN
  -- Apenas registrar se o stage mudou
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    -- Buscar nomes dos stages
    SELECT name INTO old_stage_name FROM crm_stages WHERE id = OLD.stage_id;
    SELECT name INTO new_stage_name FROM crm_stages WHERE id = NEW.stage_id;
    
    -- Buscar nome do pipeline
    SELECT p.name INTO pipeline_name 
    FROM crm_stages s 
    JOIN crm_pipelines p ON s.pipeline_id = p.id 
    WHERE s.id = NEW.stage_id;
    
    -- Buscar nome do contato
    SELECT name INTO contact_name
    FROM crm_contacts
    WHERE id = NEW.contact_id;
    
    -- Inserir log
    INSERT INTO crm_activity_log (
      activity_type,
      entity_type,
      entity_id,
      user_id,
      user_email,
      metadata,
      old_values,
      new_values
    ) VALUES (
      'deal_stage_changed',
      'deal',
      NEW.id,
      auth.uid(),
      (SELECT email FROM auth.users WHERE id = auth.uid()),
      jsonb_build_object(
        'deal_title', NEW.title,
        'pipeline_name', pipeline_name,
        'old_stage_name', old_stage_name,
        'new_stage_name', new_stage_name,
        'contact_name', contact_name
      ),
      jsonb_build_object('stage_id', OLD.stage_id, 'stage_name', old_stage_name),
      jsonb_build_object('stage_id', NEW.stage_id, 'stage_name', new_stage_name)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicar mesma correção aos outros triggers
CREATE OR REPLACE FUNCTION log_contact_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO crm_activity_log (
    activity_type,
    entity_type,
    entity_id,
    user_id,
    user_email,
    metadata,
    new_values
  ) VALUES (
    'contact_created',
    'contact',
    NEW.id,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    jsonb_build_object(
      'contact_name', NEW.name,
      'phone', NEW.phone,
      'email', NEW.email,
      'chatwoot_id', NEW.chatwoot_id
    ),
    to_jsonb(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_deal_created()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_name TEXT;
  stage_name TEXT;
  contact_name TEXT;
BEGIN
  -- Buscar informações relacionadas
  SELECT p.name INTO pipeline_name
  FROM crm_stages s
  JOIN crm_pipelines p ON s.pipeline_id = p.id
  WHERE s.id = NEW.stage_id;
  
  SELECT name INTO stage_name
  FROM crm_stages
  WHERE id = NEW.stage_id;
  
  SELECT name INTO contact_name
  FROM crm_contacts
  WHERE id = NEW.contact_id;
  
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
    (SELECT email FROM auth.users WHERE id = auth.uid()),
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

-- 3. Habilitar o trigger novamente
ALTER TABLE crm_deals ENABLE TRIGGER trigger_log_deal_stage_changed;

-- 4. Configurar RLS na tabela crm_activity_log
-- Permitir INSERT para usuários autenticados
ALTER TABLE crm_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy para permitir INSERT (triggers precisam disso)
CREATE POLICY "Allow authenticated users to insert activity logs"
ON crm_activity_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy para permitir SELECT apenas dos próprios logs ou admins
CREATE POLICY "Allow users to view activity logs"
ON crm_activity_log
FOR SELECT
TO authenticated
USING (true);  -- Todos podem ver todos os logs (ajuste conforme necessário)

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'crm_activity_log';

-- Verificar policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'crm_activity_log';

-- Verificar status dos triggers
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE 'trigger_log_%';
