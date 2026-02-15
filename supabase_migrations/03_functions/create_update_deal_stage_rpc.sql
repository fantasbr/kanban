-- ============================================
-- SOLUÇÃO DEFINITIVA: RPC para Update de Stage
-- Com rastreamento correto de usuário
-- ============================================

-- 1. Desabilitar o trigger atual (não funciona com auth.uid())
ALTER TABLE crm_deals DISABLE TRIGGER trigger_log_deal_stage_changed;

-- 2. Criar função RPC que faz UPDATE + LOG em uma transação
CREATE OR REPLACE FUNCTION update_deal_stage(
  p_deal_id UUID,
  p_stage_id UUID
)
RETURNS void AS $$
DECLARE
  v_old_stage_id UUID;
  v_old_stage_name TEXT;
  v_new_stage_name TEXT;
  v_pipeline_name TEXT;
  v_deal_title TEXT;
  v_contact_name TEXT;
  v_contact_id BIGINT;
  v_user_id UUID;
  v_user_email VARCHAR;
BEGIN
  -- Capturar user_id (funciona em RPC!)
  v_user_id := auth.uid();
  
  -- Buscar email do usuário
  SELECT email INTO v_user_email 
  FROM auth.users 
  WHERE id = v_user_id;
  
  -- Buscar dados atuais do deal
  SELECT stage_id, title, contact_id 
  INTO v_old_stage_id, v_deal_title, v_contact_id
  FROM crm_deals 
  WHERE id = p_deal_id;
  
  -- Se o stage não mudou, não fazer nada
  IF v_old_stage_id = p_stage_id THEN
    RETURN;
  END IF;
  
  -- Fazer UPDATE do stage
  UPDATE crm_deals 
  SET stage_id = p_stage_id 
  WHERE id = p_deal_id;
  
  -- Buscar nomes dos stages
  SELECT name INTO v_old_stage_name 
  FROM crm_stages 
  WHERE id = v_old_stage_id;
  
  SELECT name INTO v_new_stage_name 
  FROM crm_stages 
  WHERE id = p_stage_id;
  
  -- Buscar nome do pipeline
  SELECT p.name INTO v_pipeline_name 
  FROM crm_stages s 
  JOIN crm_pipelines p ON s.pipeline_id = p.id 
  WHERE s.id = p_stage_id;
  
  -- Buscar nome do contato
  SELECT name INTO v_contact_name
  FROM crm_contacts
  WHERE id = v_contact_id;
  
  -- Inserir log de atividade
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
    p_deal_id,
    v_user_id,
    v_user_email,
    jsonb_build_object(
      'deal_title', v_deal_title,
      'pipeline_name', v_pipeline_name,
      'old_stage_name', v_old_stage_name,
      'new_stage_name', v_new_stage_name,
      'contact_name', v_contact_name
    ),
    jsonb_build_object('stage_id', v_old_stage_id, 'stage_name', v_old_stage_name),
    jsonb_build_object('stage_id', p_stage_id, 'stage_name', v_new_stage_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Conceder permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION update_deal_stage(UUID, UUID) TO authenticated;

-- 4. Verificar função criada
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'update_deal_stage';
