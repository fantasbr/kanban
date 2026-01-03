-- ============================================
-- MIGRAÇÃO: Sistema de Log de Atividades CRM
-- Rastreamento de criação de contatos, deals e mudanças de stage
-- ============================================

-- Criar tabela de log de atividades
CREATE TABLE IF NOT EXISTS crm_activity_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Tipo de atividade
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'contact_created',
    'deal_created', 
    'deal_stage_changed',
    'deal_updated'
  )),
  
  -- Entidade afetada
  entity_type TEXT NOT NULL,
  entity_id BIGINT NOT NULL,
  
  -- Usuário que realizou a ação
  user_id UUID,
  user_email TEXT,
  
  -- Dados da atividade
  metadata JSONB,
  old_values JSONB,
  new_values JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_activity_log_type ON crm_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON crm_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON crm_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON crm_activity_log(created_at DESC);

-- ============================================
-- TRIGGER 1: Log de Criação de Contatos
-- ============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para contatos
DROP TRIGGER IF EXISTS trigger_log_contact_created ON crm_contacts;
CREATE TRIGGER trigger_log_contact_created
AFTER INSERT ON crm_contacts
FOR EACH ROW
EXECUTE FUNCTION log_contact_created();

-- ============================================
-- TRIGGER 2: Log de Criação de Deals
-- ============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para deals
DROP TRIGGER IF EXISTS trigger_log_deal_created ON crm_deals;
CREATE TRIGGER trigger_log_deal_created
AFTER INSERT ON crm_deals
FOR EACH ROW
EXECUTE FUNCTION log_deal_created();

-- ============================================
-- TRIGGER 3: Log de Mudança de Stage
-- ============================================

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para mudanças de stage
DROP TRIGGER IF EXISTS trigger_log_deal_stage_changed ON crm_deals;
CREATE TRIGGER trigger_log_deal_stage_changed
AFTER UPDATE OF stage_id ON crm_deals
FOR EACH ROW
EXECUTE FUNCTION log_deal_stage_changed();

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar tabela criada
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'crm_activity_log') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'crm_activity_log';

-- Verificar triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_log_%'
ORDER BY event_object_table, trigger_name;
