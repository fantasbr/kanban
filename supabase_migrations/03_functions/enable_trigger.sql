-- ============================================
-- HABILITAR TRIGGER COM AUTH FUNCIONANDO
-- ============================================

-- Agora que confirmamos que auth.uid() funciona via frontend,
-- vamos habilitar o trigger novamente

ALTER TABLE crm_deals ENABLE TRIGGER trigger_log_deal_stage_changed;

-- Verificar status
SELECT 
  tgname as trigger_name,
  tgenabled as is_enabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'trigger_log_deal_stage_changed';

-- Agora teste mover um card no Kanban
-- Deve funcionar E registrar a atividade no histórico
