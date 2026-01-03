-- ============================================
-- DIAGNÓSTICO COMPLETO DO TRIGGER
-- ============================================

-- 1. Verificar se o trigger está habilitado
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_log_deal_stage_changed';

-- 2. Ver o código da função atual
SELECT pg_get_functiondef('log_deal_stage_changed'::regproc);

-- 3. Verificar se há logs recentes na tabela
SELECT 
  id,
  activity_type,
  user_id,
  user_email,
  metadata->>'deal_title' as deal_title,
  created_at
FROM crm_activity_log
ORDER BY created_at DESC
LIMIT 10;

-- 4. Fazer um UPDATE manual para forçar o trigger
-- (Escolha um deal qualquer e mude o stage)
UPDATE crm_deals
SET stage_id = stage_id  -- Isso não muda nada, mas força o trigger
WHERE id = (SELECT id FROM crm_deals LIMIT 1);

-- Se não aparecer erro, mas também não criar log, o problema é que
-- o trigger tem EXCEPTION handler que está engolindo erros

-- ============================================
-- SOLUÇÃO: Remover EXCEPTION handler temporariamente
-- para ver o erro real
-- ============================================

CREATE OR REPLACE FUNCTION log_deal_stage_changed()
RETURNS TRIGGER AS $$
DECLARE
  old_stage_name TEXT;
  new_stage_name TEXT;
  pipeline_name TEXT;
  contact_name TEXT;
  current_user_id UUID;
  current_user_email VARCHAR;
BEGIN
  -- Apenas registrar se o stage mudou
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    -- Capturar user_id
    current_user_id := auth.uid();
    
    -- Buscar email
    SELECT email INTO current_user_email 
    FROM auth.users 
    WHERE id = current_user_id;
    
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
    
    -- Inserir log (SEM EXCEPTION HANDLER para ver erros)
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
      current_user_id,
      current_user_email,
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
-- SEM EXCEPTION HANDLER - vai mostrar o erro real se houver
