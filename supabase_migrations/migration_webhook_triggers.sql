-- ============================================
-- SISTEMA DE WEBHOOKS - TRIGGERS E EVENTOS
-- Migration: Webhook Triggers
-- Descrição: Triggers para disparar webhooks automaticamente
--            quando eventos importantes ocorrem no sistema
-- ============================================

-- ============================================
-- TRIGGER: deal.created
-- ============================================

CREATE OR REPLACE FUNCTION notify_deal_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Disparar webhook para evento 'deal.created'
  PERFORM trigger_webhook('deal.created', to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deal_created
  AFTER INSERT ON crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION notify_deal_created();

COMMENT ON FUNCTION notify_deal_created IS 'Dispara webhook quando um deal é criado';

-- ============================================
-- TRIGGER: contract.signed
-- ============================================

CREATE OR REPLACE FUNCTION notify_contract_signed()
RETURNS TRIGGER AS $$
BEGIN
  -- Disparar apenas quando status muda para 'active' (contrato assinado)
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    PERFORM trigger_webhook('contract.signed', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contract_signed
  AFTER INSERT OR UPDATE ON erp_contracts
  FOR EACH ROW
  EXECUTE FUNCTION notify_contract_signed();

COMMENT ON FUNCTION notify_contract_signed IS 'Dispara webhook quando um contrato é assinado (status = active)';

-- ============================================
-- TRIGGER: payment.received
-- ============================================

CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
BEGIN
  -- Disparar apenas quando receivable é marcado como 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    PERFORM trigger_webhook('payment.received', to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_received
  AFTER UPDATE ON erp_receivables
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

COMMENT ON FUNCTION notify_payment_received IS 'Dispara webhook quando um pagamento é recebido (status = paid)';

-- ============================================
-- FUNÇÃO: Limpar webhooks antigos (manutenção)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar logs de webhook com mais de X dias
  DELETE FROM webhook_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Deleted % old webhook logs', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_webhook_logs IS 'Remove logs de webhooks antigos para economizar espaço';

-- ============================================
-- FUNÇÃO: Limpar webhooks processados da fila
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_webhook_queue()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Deletar webhooks já enviados ou que falharam há mais de 7 dias
  DELETE FROM webhook_queue
  WHERE (status = 'sent' AND created_at < NOW() - INTERVAL '7 days')
     OR (status = 'failed' AND created_at < NOW() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Cleaned up % webhook queue items', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_webhook_queue IS 'Remove itens antigos da fila de webhooks';

-- ============================================
-- VIEW: Estatísticas de Webhooks
-- ============================================

CREATE OR REPLACE VIEW webhook_stats AS
SELECT 
  ws.id AS subscription_id,
  ws.name AS subscription_name,
  ws.url,
  ws.is_active,
  COUNT(wl.id) AS total_attempts,
  COUNT(CASE WHEN wl.status_code >= 200 AND wl.status_code < 300 THEN 1 END) AS successful_attempts,
  COUNT(CASE WHEN wl.status_code >= 400 OR wl.error_message IS NOT NULL THEN 1 END) AS failed_attempts,
  AVG(wl.duration_ms) AS avg_duration_ms,
  MAX(wl.created_at) AS last_attempt_at
FROM webhook_subscriptions ws
LEFT JOIN webhook_logs wl ON ws.id = wl.subscription_id
GROUP BY ws.id, ws.name, ws.url, ws.is_active;

COMMENT ON VIEW webhook_stats IS 'Estatísticas de performance dos webhooks';

-- ============================================
-- VERIFICAÇÕES E VALIDAÇÕES
-- ============================================

DO $$
DECLARE
  v_trigger_count INTEGER;
BEGIN
  -- Verificar que os triggers foram criados
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND trigger_name IN ('trigger_deal_created', 'trigger_contract_signed', 'trigger_payment_received');
  
  IF v_trigger_count = 3 THEN
    RAISE NOTICE '✅ Todos os 3 triggers foram criados com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Esperado 3 triggers, encontrado %', v_trigger_count;
  END IF;
  
  -- Verificar que a view foi criada
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'webhook_stats') THEN
    RAISE NOTICE '✅ View webhook_stats criada com sucesso!';
  ELSE
    RAISE WARNING '⚠️ View webhook_stats não foi criada';
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Migration Webhook Triggers executada com sucesso!';
  RAISE NOTICE '📊 Triggers criados: deal.created, contract.signed, payment.received';
  RAISE NOTICE '🧹 Funções de limpeza criadas: cleanup_old_webhook_logs, cleanup_webhook_queue';
  RAISE NOTICE '📈 View de estatísticas criada: webhook_stats';
  RAISE NOTICE '🚀 Próximo passo: Criar Edge Function webhook-processor';
END $$;
