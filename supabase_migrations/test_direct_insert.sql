-- ==============================================================================
-- TESTE DIRETO DE INSERÇÃO
-- ==============================================================================
-- Vamos tentar inserir um deal diretamente no SQL para ver se funciona
-- ==============================================================================

-- Primeiro, buscar IDs necessários
SELECT 
  'IDs disponíveis para teste:' as info;

-- Ver pipelines
SELECT 
  id,
  name,
  'pipeline_id' as tipo
FROM crm_pipelines
WHERE is_active = true
LIMIT 3;

-- Ver stages
SELECT 
  id,
  name,
  pipeline_id,
  'stage_id' as tipo
FROM crm_stages
WHERE is_active = true
LIMIT 3;

-- Ver contacts
SELECT 
  id,
  name,
  'contact_id' as tipo
FROM crm_contacts
WHERE is_active = true
LIMIT 3;

-- TESTE: Tentar inserir um deal de teste
-- ⚠️ AJUSTE OS IDs ABAIXO COM OS VALORES RETORNADOS ACIMA
DO $$
DECLARE
  v_pipeline_id UUID;
  v_stage_id UUID;
  v_contact_id UUID;
  v_new_deal_id UUID;
BEGIN
  -- Pegar primeiro pipeline ativo
  SELECT id INTO v_pipeline_id FROM crm_pipelines WHERE is_active = true LIMIT 1;
  
  -- Pegar primeiro stage desse pipeline
  SELECT id INTO v_stage_id FROM crm_stages WHERE pipeline_id = v_pipeline_id AND is_active = true LIMIT 1;
  
  -- Pegar primeiro contact
  SELECT id INTO v_contact_id FROM crm_contacts WHERE is_active = true LIMIT 1;
  
  IF v_pipeline_id IS NULL OR v_stage_id IS NULL OR v_contact_id IS NULL THEN
    RAISE EXCEPTION 'Faltam dados básicos (pipeline, stage ou contact)';
  END IF;
  
  -- Tentar inserir
  INSERT INTO crm_deals (
    pipeline_id,
    stage_id,
    contact_id,
    title,
    deal_value_negotiated,
    priority,
    is_active,
    is_archived
  ) VALUES (
    v_pipeline_id,
    v_stage_id,
    v_contact_id,
    'TESTE - Deal criado via SQL',
    1000.00,
    'medium',
    true,
    false
  ) RETURNING id INTO v_new_deal_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DEAL CRIADO COM SUCESSO VIA SQL!';
  RAISE NOTICE 'ID do deal: %', v_new_deal_id;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Isso significa que o problema é no FRONTEND ou na AUTENTICAÇÃO';
  RAISE NOTICE 'Não é problema de RLS ou permissões do banco';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '========================================';
  RAISE NOTICE '❌ ERRO AO CRIAR DEAL VIA SQL';
  RAISE NOTICE 'Erro: %', SQLERRM;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Isso significa que há um problema no BANCO DE DADOS';
END $$;

-- Ver o deal criado (se funcionou)
SELECT 
  id,
  title,
  deal_value_negotiated,
  created_at,
  '✅ Deal de teste' as status
FROM crm_deals
WHERE title = 'TESTE - Deal criado via SQL'
ORDER BY created_at DESC
LIMIT 1;
