-- ============================================
-- SISTEMA DE API KEYS E WEBHOOKS
-- Migration: API System
-- Descrição: Tabelas para autenticação via API Keys,
--            logs de requisições e sistema de webhooks
-- ============================================

-- ============================================
-- TABELA: API KEYS
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL, -- Primeiros 8 caracteres para identificação visual
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by TEXT, -- Email do usuário que criou
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX idx_api_keys_created_at ON api_keys(created_at DESC);

-- Comentários
COMMENT ON TABLE api_keys IS 'API Keys para autenticação de requisições externas (N8N, Zapier, etc)';
COMMENT ON COLUMN api_keys.key_hash IS 'Hash SHA-256 da API key (nunca armazenamos a key em texto puro)';
COMMENT ON COLUMN api_keys.key_prefix IS 'Primeiros 8 caracteres da key para identificação visual';
COMMENT ON COLUMN api_keys.permissions IS 'Array de permissões: crm:read, crm:write, erp:read, erp:write, *';

-- ============================================
-- TABELA: LOGS DE API
-- ============================================

CREATE TABLE IF NOT EXISTS api_logs (
  id BIGSERIAL PRIMARY KEY,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  duration_ms INTEGER, -- Duração da requisição em milissegundos
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_api_logs_api_key_id ON api_logs(api_key_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX idx_api_logs_status_code ON api_logs(status_code);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);

COMMENT ON TABLE api_logs IS 'Logs de todas as requisições à API REST';
COMMENT ON COLUMN api_logs.duration_ms IS 'Tempo de execução da requisição em milissegundos';

-- ============================================
-- TABELA: WEBHOOK SUBSCRIPTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Ex: ['deal.created', 'contract.signed', 'payment.received']
  secret TEXT NOT NULL, -- Para validação HMAC-SHA256
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  headers JSONB DEFAULT '{}'::jsonb, -- Headers customizados opcionais
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_webhook_subscriptions_api_key_id ON webhook_subscriptions(api_key_id);
CREATE INDEX idx_webhook_subscriptions_is_active ON webhook_subscriptions(is_active);
CREATE INDEX idx_webhook_subscriptions_events ON webhook_subscriptions USING GIN(events);

COMMENT ON TABLE webhook_subscriptions IS 'Configurações de webhooks para notificações em tempo real';
COMMENT ON COLUMN webhook_subscriptions.secret IS 'Secret para gerar assinatura HMAC-SHA256 nos payloads';
COMMENT ON COLUMN webhook_subscriptions.events IS 'Array de eventos que disparam este webhook';
COMMENT ON COLUMN webhook_subscriptions.retry_count IS 'Número de tentativas em caso de falha';

-- ============================================
-- TABELA: WEBHOOK LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id BIGSERIAL PRIMARY KEY,
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_webhook_logs_subscription_id ON webhook_logs(subscription_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status_code ON webhook_logs(status_code);

COMMENT ON TABLE webhook_logs IS 'Logs de todas as tentativas de envio de webhooks';
COMMENT ON COLUMN webhook_logs.attempt_number IS 'Número da tentativa (1 = primeira tentativa)';

-- ============================================
-- TABELA: FILA DE WEBHOOKS
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_queue (
  id BIGSERIAL PRIMARY KEY,
  subscription_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, sent, failed
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_webhook_queue_status ON webhook_queue(status);
CREATE INDEX idx_webhook_queue_created_at ON webhook_queue(created_at);
CREATE INDEX idx_webhook_queue_subscription_id ON webhook_queue(subscription_id);

COMMENT ON TABLE webhook_queue IS 'Fila de webhooks pendentes de envio';
COMMENT ON COLUMN webhook_queue.status IS 'Status: pending (aguardando), processing (enviando), sent (enviado), failed (falhou)';

-- ============================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNÇÃO HELPER: Validar Permissões
-- ============================================

CREATE OR REPLACE FUNCTION has_api_permission(
  p_permissions TEXT[],
  p_required_permission TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Permissão wildcard '*' permite tudo
  IF '*' = ANY(p_permissions) THEN
    RETURN TRUE;
  END IF;
  
  -- Verificar permissão específica
  RETURN p_required_permission = ANY(p_permissions);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION has_api_permission IS 'Verifica se um array de permissões contém a permissão requerida ou wildcard (*)';

-- ============================================
-- FUNÇÃO: Disparar Webhooks
-- ============================================

CREATE OR REPLACE FUNCTION trigger_webhook(
  p_event_type TEXT,
  p_payload JSONB
)
RETURNS void AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  -- Buscar webhooks ativos para este evento
  FOR v_subscription IN
    SELECT * FROM webhook_subscriptions
    WHERE is_active = true
    AND p_event_type = ANY(events)
  LOOP
    -- Inserir na fila de webhooks (será processado pela Edge Function)
    INSERT INTO webhook_queue (subscription_id, event_type, payload)
    VALUES (v_subscription.id, p_event_type, p_payload);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION trigger_webhook IS 'Adiciona webhooks à fila para processamento assíncrono';

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir acesso via service role (Edge Functions)
CREATE POLICY "Service role has full access to api_keys"
  ON api_keys FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to webhook_subscriptions"
  ON webhook_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to api_logs"
  ON api_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to webhook_logs"
  ON webhook_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to webhook_queue"
  ON webhook_queue FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTADO)
-- ============================================

-- Descomentar para criar uma API key de teste
-- IMPORTANTE: Em produção, criar via interface

/*
-- Exemplo de API key de teste
-- Hash SHA-256 precisa ser calculado no frontend ao criar

INSERT INTO api_keys (name, key_hash, key_prefix, permissions, created_by) VALUES
(
  'Test API Key - Full Access',
  'hash_calculado_aqui', -- Substituir pelo hash real
  'sk_test_',
  ARRAY['*'], -- Permissão total
  'admin@example.com'
);

INSERT INTO api_keys (name, key_hash, key_prefix, permissions, created_by) VALUES
(
  'Test API Key - CRM Only',
  'hash_calculado_aqui_2',
  'sk_test_',
  ARRAY['crm:read', 'crm:write'],
  'admin@example.com'
);
*/

-- ============================================
-- VERIFICAÇÕES E VALIDAÇÕES
-- ============================================

-- Verificar que todas as tabelas foram criadas
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('api_keys', 'api_logs', 'webhook_subscriptions', 'webhook_logs', 'webhook_queue');
  
  IF v_count = 5 THEN
    RAISE NOTICE '✅ Todas as 5 tabelas foram criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Esperado 5 tabelas, encontrado %', v_count;
  END IF;
END $$;

-- Testar função has_api_permission
DO $$
BEGIN
  -- Teste 1: Permissão específica existe
  IF has_api_permission(ARRAY['crm:read', 'crm:write'], 'crm:read') THEN
    RAISE NOTICE '✅ Teste 1 passou: Permissão específica encontrada';
  ELSE
    RAISE WARNING '❌ Teste 1 falhou';
  END IF;
  
  -- Teste 2: Permissão específica não existe
  IF NOT has_api_permission(ARRAY['crm:read'], 'erp:write') THEN
    RAISE NOTICE '✅ Teste 2 passou: Permissão não encontrada corretamente';
  ELSE
    RAISE WARNING '❌ Teste 2 falhou';
  END IF;
  
  -- Teste 3: Wildcard permite tudo
  IF has_api_permission(ARRAY['*'], 'qualquer:coisa') THEN
    RAISE NOTICE '✅ Teste 3 passou: Wildcard funciona';
  ELSE
    RAISE WARNING '❌ Teste 3 falhou';
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETA
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Migration API System executada com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: api_keys, api_logs, webhook_subscriptions, webhook_logs, webhook_queue';
  RAISE NOTICE '🔐 RLS habilitado em todas as tabelas';
  RAISE NOTICE '⚙️ Funções criadas: has_api_permission, trigger_webhook';
  RAISE NOTICE '🚀 Próximo passo: Criar Edge Functions';
END $$;

