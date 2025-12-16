-- ============================================
-- MIGRAÇÃO: Criar tabela de configurações
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Criar tabela de configurações
CREATE TABLE IF NOT EXISTS app_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para buscas rápidas por key
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Inserir configuração padrão do Chatwoot
INSERT INTO app_settings (key, value) 
VALUES ('chatwoot_url', 'https://app.chatwoot.com')
ON CONFLICT (key) DO NOTHING;

-- Verificar
SELECT * FROM app_settings;
