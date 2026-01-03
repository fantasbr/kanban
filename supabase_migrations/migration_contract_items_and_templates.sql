-- ============================================
-- Migration: Sistema de Catálogo de Itens e Templates de Contrato
-- Descrição: Implementa catálogo fixo de itens e templates de sugestão
-- ============================================

-- Remover tabelas existentes (se houver)
DROP TABLE IF EXISTS erp_contract_template_items CASCADE;
DROP TABLE IF EXISTS erp_contract_templates CASCADE;
DROP TABLE IF EXISTS erp_contract_items_catalog CASCADE;

-- Criar função para atualizar updated_at se não existir
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. CATÁLOGO DE ITENS DE CONTRATO (Fixo)
-- ============================================

CREATE TABLE IF NOT EXISTS erp_contract_items_catalog (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  default_unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit_type TEXT DEFAULT 'unidade', -- unidade, hora, aula, serviço, etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_catalog_items_active 
  ON erp_contract_items_catalog(is_active);

CREATE INDEX IF NOT EXISTS idx_catalog_items_name 
  ON erp_contract_items_catalog(name);

-- RLS
ALTER TABLE erp_contract_items_catalog ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura de catálogo para autenticados"
  ON erp_contract_items_catalog FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de catálogo para autenticados"
  ON erp_contract_items_catalog FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de catálogo para autenticados"
  ON erp_contract_items_catalog FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de catálogo para autenticados"
  ON erp_contract_items_catalog FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_catalog_items_updated_at
  BEFORE UPDATE ON erp_contract_items_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE erp_contract_items_catalog IS 'Catálogo fixo de itens/serviços para contratos';
COMMENT ON COLUMN erp_contract_items_catalog.name IS 'Nome único do item (ex: Aula de Carro)';
COMMENT ON COLUMN erp_contract_items_catalog.unit_type IS 'Tipo de unidade (unidade, hora, aula, serviço)';

-- ============================================
-- 2. TEMPLATES DE CONTRATO
-- ============================================

CREATE TABLE IF NOT EXISTS erp_contract_templates (
  id BIGSERIAL PRIMARY KEY,
  contract_type_id BIGINT NOT NULL REFERENCES erp_contract_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Carro e Moto", "Moto", "Transferência"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_templates_type 
  ON erp_contract_templates(contract_type_id);

CREATE INDEX IF NOT EXISTS idx_templates_active 
  ON erp_contract_templates(is_active);

-- RLS
ALTER TABLE erp_contract_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura de templates para autenticados"
  ON erp_contract_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de templates para autenticados"
  ON erp_contract_templates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de templates para autenticados"
  ON erp_contract_templates FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de templates para autenticados"
  ON erp_contract_templates FOR DELETE
  USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON erp_contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE erp_contract_templates IS 'Templates de contrato (sugestões de combinações de itens)';
COMMENT ON COLUMN erp_contract_templates.name IS 'Nome do template (ex: Carro e Moto)';

-- ============================================
-- 3. ITENS QUE COMPÕEM CADA TEMPLATE
-- ============================================

CREATE TABLE IF NOT EXISTS erp_contract_template_items (
  id BIGSERIAL PRIMARY KEY,
  template_id BIGINT NOT NULL REFERENCES erp_contract_templates(id) ON DELETE CASCADE,
  catalog_item_id BIGINT NOT NULL REFERENCES erp_contract_items_catalog(id) ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_template_items_template 
  ON erp_contract_template_items(template_id);

CREATE INDEX IF NOT EXISTS idx_template_items_catalog 
  ON erp_contract_template_items(catalog_item_id);

CREATE INDEX IF NOT EXISTS idx_template_items_order 
  ON erp_contract_template_items(template_id, display_order);

-- RLS
ALTER TABLE erp_contract_template_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Permitir leitura de itens de template para autenticados"
  ON erp_contract_template_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir inserção de itens de template para autenticados"
  ON erp_contract_template_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização de itens de template para autenticados"
  ON erp_contract_template_items FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão de itens de template para autenticados"
  ON erp_contract_template_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- Comentários
COMMENT ON TABLE erp_contract_template_items IS 'Itens que compõem cada template de contrato';
COMMENT ON COLUMN erp_contract_template_items.quantity IS 'Quantidade sugerida do item';

-- ============================================
-- 4. MODIFICAR TABELA EXISTENTE
-- ============================================

-- Adicionar referência ao catálogo na tabela de itens do contrato
ALTER TABLE erp_contract_items 
ADD COLUMN IF NOT EXISTS catalog_item_id BIGINT REFERENCES erp_contract_items_catalog(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contract_items_catalog 
  ON erp_contract_items(catalog_item_id);

COMMENT ON COLUMN erp_contract_items.catalog_item_id IS 'Referência ao item do catálogo (para relatórios)';

-- ============================================
-- 5. DADOS DE EXEMPLO (Opcional - comentar se não quiser)
-- ============================================

-- Inserir itens no catálogo
INSERT INTO erp_contract_items_catalog (name, description, default_unit_price, unit_type) VALUES
  ('Aula de Carro', 'Aula prática de direção de carro', 80.00, 'aula'),
  ('Aula de Moto', 'Aula prática de direção de moto', 70.00, 'aula'),
  ('Matrícula Primeira Habilitação', 'Taxa de matrícula para primeira habilitação', 500.00, 'serviço'),
  ('Serviço Transferência de Propriedade', 'Serviço de transferência de propriedade de veículo', 300.00, 'serviço'),
  ('Serviço Licenciamento', 'Serviço de licenciamento de veículo', 200.00, 'serviço'),
  ('Placa', 'Confecção de placa veicular', 150.00, 'unidade')
ON CONFLICT (name) DO NOTHING;

-- Criar template "Carro e Moto" para Autoescola
DO $$
DECLARE
  autoescola_id BIGINT;
  template_id BIGINT;
  matricula_id BIGINT;
  aula_carro_id BIGINT;
  aula_moto_id BIGINT;
BEGIN
  -- Buscar ID do tipo Autoescola
  SELECT id INTO autoescola_id FROM erp_contract_types WHERE name = 'Autoescola' LIMIT 1;
  
  IF autoescola_id IS NOT NULL THEN
    -- Criar template
    INSERT INTO erp_contract_templates (contract_type_id, name)
    VALUES (autoescola_id, 'Carro e Moto')
    RETURNING id INTO template_id;
    
    -- Buscar IDs dos itens do catálogo
    SELECT id INTO matricula_id FROM erp_contract_items_catalog WHERE name = 'Matrícula Primeira Habilitação' LIMIT 1;
    SELECT id INTO aula_carro_id FROM erp_contract_items_catalog WHERE name = 'Aula de Carro' LIMIT 1;
    SELECT id INTO aula_moto_id FROM erp_contract_items_catalog WHERE name = 'Aula de Moto' LIMIT 1;
    
    -- Adicionar itens ao template
    INSERT INTO erp_contract_template_items (template_id, catalog_item_id, quantity, display_order) VALUES
      (template_id, matricula_id, 1, 1),
      (template_id, aula_carro_id, 2, 2),
      (template_id, aula_moto_id, 2, 3);
  END IF;
END $$;

-- Criar template "Moto" para Autoescola
DO $$
DECLARE
  autoescola_id BIGINT;
  template_id BIGINT;
  matricula_id BIGINT;
  aula_moto_id BIGINT;
BEGIN
  SELECT id INTO autoescola_id FROM erp_contract_types WHERE name = 'Autoescola' LIMIT 1;
  
  IF autoescola_id IS NOT NULL THEN
    INSERT INTO erp_contract_templates (contract_type_id, name)
    VALUES (autoescola_id, 'Moto')
    RETURNING id INTO template_id;
    
    SELECT id INTO matricula_id FROM erp_contract_items_catalog WHERE name = 'Matrícula Primeira Habilitação' LIMIT 1;
    SELECT id INTO aula_moto_id FROM erp_contract_items_catalog WHERE name = 'Aula de Moto' LIMIT 1;
    
    INSERT INTO erp_contract_template_items (template_id, catalog_item_id, quantity, display_order) VALUES
      (template_id, matricula_id, 1, 1),
      (template_id, aula_moto_id, 2, 2);
  END IF;
END $$;

-- Criar template "Transferência de Propriedade" para Despachante
DO $$
DECLARE
  despachante_id BIGINT;
  template_id BIGINT;
  transferencia_id BIGINT;
  placa_id BIGINT;
BEGIN
  SELECT id INTO despachante_id FROM erp_contract_types WHERE name = 'Despachante' LIMIT 1;
  
  IF despachante_id IS NOT NULL THEN
    INSERT INTO erp_contract_templates (contract_type_id, name)
    VALUES (despachante_id, 'Transferência de Propriedade')
    RETURNING id INTO template_id;
    
    SELECT id INTO transferencia_id FROM erp_contract_items_catalog WHERE name = 'Serviço Transferência de Propriedade' LIMIT 1;
    SELECT id INTO placa_id FROM erp_contract_items_catalog WHERE name = 'Placa' LIMIT 1;
    
    INSERT INTO erp_contract_template_items (template_id, catalog_item_id, quantity, display_order) VALUES
      (template_id, transferencia_id, 1, 1),
      (template_id, placa_id, 1, 2);
  END IF;
END $$;
