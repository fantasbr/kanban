-- ==============================================================================
-- TESTE: Verificar se o deal foi criado
-- ==============================================================================

-- Ver todos os deals recentes
SELECT 
  id,
  title,
  deal_value_negotiated,
  created_at,
  CASE 
    WHEN title LIKE '%TESTE%' THEN '✅ Deal de teste criado!'
    ELSE 'Deal normal'
  END as tipo
FROM crm_deals
ORDER BY created_at DESC
LIMIT 10;

-- Contar deals
SELECT 
  COUNT(*) as total_deals,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Existem deals no banco'
    ELSE '❌ Nenhum deal no banco'
  END as status
FROM crm_deals;

-- Ver se há algum deal de teste
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM crm_deals WHERE title LIKE '%TESTE%') 
    THEN '✅ Deal de teste FOI criado via SQL - problema é no FRONTEND'
    ELSE '❌ Deal de teste NÃO foi criado - problema é no BANCO'
  END as diagnostico;
