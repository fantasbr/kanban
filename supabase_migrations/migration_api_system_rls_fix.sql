-- ============================================
-- FIX: Políticas RLS para Usuários Autenticados
-- Migration: API System RLS Fix
-- Descrição: Adiciona políticas para permitir que usuários
--            autenticados acessem API Keys e Webhooks via frontend
-- ============================================

-- ============================================
-- API KEYS - Políticas para Usuários Autenticados
-- ============================================

CREATE POLICY "Authenticated users can read api_keys"
  ON api_keys FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert api_keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete api_keys"
  ON api_keys FOR DELETE
  USING (auth.role() = 'authenticated');

COMMENT ON POLICY "Authenticated users can read api_keys" ON api_keys 
  IS 'Permite usuários autenticados lerem API keys';

-- ============================================
-- WEBHOOK SUBSCRIPTIONS - Políticas para Usuários Autenticados
-- ============================================

CREATE POLICY "Authenticated users can read webhook_subscriptions"
  ON webhook_subscriptions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert webhook_subscriptions"
  ON webhook_subscriptions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update webhook_subscriptions"
  ON webhook_subscriptions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete webhook_subscriptions"
  ON webhook_subscriptions FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- LOGS - Políticas de Leitura
-- ============================================

CREATE POLICY "Authenticated users can read api_logs"
  ON api_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read webhook_logs"
  ON webhook_logs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read webhook_queue"
  ON webhook_queue FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- VERIFICAÇÃO
-- ============================================

DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  -- Contar políticas criadas
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('api_keys', 'webhook_subscriptions', 'api_logs', 'webhook_logs', 'webhook_queue')
  AND policyname LIKE '%Authenticated users%';
  
  IF v_policy_count >= 10 THEN
    RAISE NOTICE '✅ Políticas RLS para usuários autenticados criadas com sucesso!';
    RAISE NOTICE '📊 Total de políticas: %', v_policy_count;
  ELSE
    RAISE WARNING '⚠️ Esperado pelo menos 10 políticas, encontrado %', v_policy_count;
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Migration RLS Fix executada com sucesso!';
  RAISE NOTICE '🔐 Usuários autenticados agora podem acessar API Keys e Webhooks';
  RAISE NOTICE '🚀 Frontend pronto para uso';
END $$;
