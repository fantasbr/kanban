-- ============================================
-- FIX: Alterar entity_id para suportar UUID
-- ============================================

-- A tabela crm_activity_log foi criada com entity_id BIGINT
-- mas crm_deals usa UUID para id

-- Opção 1: Alterar entity_id para TEXT (mais flexível)
ALTER TABLE crm_activity_log 
ALTER COLUMN entity_id TYPE TEXT;

-- Agora a função RPC deve funcionar
-- Teste novamente:
SELECT update_deal_stage(
  '47346329-7f6e-4414-b4a4-d0be7e201e03'::uuid,
  '5e38a23a-1de2-4de8-b19e-594b18fbdc97'::uuid
);

-- Verificar se funcionou
SELECT * FROM crm_activity_log ORDER BY created_at DESC LIMIT 5;
