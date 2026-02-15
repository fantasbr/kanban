-- ============================================
-- Migration: Sistema de Branding
-- Descrição: Adiciona suporte para logo e favicon personalizados
-- ============================================

-- Tabela para armazenar configurações de branding
CREATE TABLE IF NOT EXISTS app_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  favicon_url TEXT,
  system_name TEXT DEFAULT 'Branca SGI',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir configuração padrão
INSERT INTO app_branding (system_name) 
VALUES ('Branca SGI')
ON CONFLICT DO NOTHING;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_app_branding_updated_at
  BEFORE UPDATE ON app_branding
  FOR EACH ROW
  EXECUTE FUNCTION update_branding_updated_at();

-- RLS Policies
ALTER TABLE app_branding ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública de branding
CREATE POLICY "Permitir leitura pública de branding"
  ON app_branding FOR SELECT
  USING (true);

-- Apenas autenticados podem atualizar branding
CREATE POLICY "Apenas autenticados podem atualizar branding"
  ON app_branding FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================
-- Storage Bucket para Branding
-- ============================================

-- Criar bucket para logos e favicons
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "Permitir leitura pública de branding"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "Apenas autenticados podem fazer upload de branding"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem atualizar branding"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

CREATE POLICY "Apenas autenticados podem deletar branding"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'branding' AND auth.role() = 'authenticated');

-- ============================================
-- Comentários
-- ============================================

COMMENT ON TABLE app_branding IS 'Configurações de branding do sistema (logo, favicon, nome)';
COMMENT ON COLUMN app_branding.logo_url IS 'URL do logotipo do sistema';
COMMENT ON COLUMN app_branding.favicon_url IS 'URL do favicon do sistema';
COMMENT ON COLUMN app_branding.system_name IS 'Nome do sistema exibido na interface';
