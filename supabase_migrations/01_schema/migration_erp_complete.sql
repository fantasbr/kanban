-- ============================================
-- MIGRAÇÃO COMPLETA: Módulo ERP
-- Sistema de Gestão de Clientes, Contratos e Financeiro
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- ============================================
-- PARTE 1: TABELAS DE CONFIGURAÇÃO
-- ============================================

-- 1.1. Empresas da Rede
CREATE TABLE IF NOT EXISTS erp_companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT, -- Logo para contratos/recibos
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_companies_cnpj ON erp_companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_erp_companies_active ON erp_companies(is_active);

-- 1.2. Tipos de Contrato (Configurável)
CREATE TABLE IF NOT EXISTS erp_contract_types (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir tipos iniciais
INSERT INTO erp_contract_types (name, description) VALUES
  ('Autoescola', 'Serviços de formação de condutores'),
  ('Despachante', 'Serviços de despachante documentação veicular')
ON CONFLICT (name) DO NOTHING;

-- 1.3. Métodos de Pagamento (Configurável)
CREATE TABLE IF NOT EXISTS erp_payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir métodos iniciais
INSERT INTO erp_payment_methods (name) VALUES
  ('PIX'),
  ('Boleto'),
  ('Cartão de Crédito'),
  ('Cartão de Débito'),
  ('Dinheiro'),
  ('Carnê')
ON CONFLICT (name) DO NOTHING;

-- 1.4. Templates de PDF (Contratos e Recibos)
CREATE TABLE IF NOT EXISTS erp_contract_templates (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('contract', 'receipt')),
  contract_type_id BIGINT REFERENCES erp_contract_types(id) ON DELETE SET NULL,
  
  -- Template HTML/configuração
  template_html TEXT NOT NULL,
  css_styles TEXT,
  
  -- Configurações
  header_html TEXT,
  footer_html TEXT,
  
  -- Metadados
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_templates_type ON erp_contract_templates(type);
CREATE INDEX IF NOT EXISTS idx_erp_templates_contract_type ON erp_contract_templates(contract_type_id);

-- ============================================
-- PARTE 2: CLIENTES
-- ============================================

CREATE TABLE IF NOT EXISTS erp_clients (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT REFERENCES crm_contacts(id) ON DELETE SET NULL,
  
  -- Dados pessoais básicos
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  
  -- RG
  rg_number TEXT,
  rg_issuer_state TEXT,
  rg_issue_date DATE,
  
  -- Dados pessoais adicionais
  birth_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'Outro')),
  
  -- Filiação
  father_name TEXT,
  mother_name TEXT,
  
  -- Naturalidade
  birth_country TEXT DEFAULT 'Brasil',
  birth_state TEXT,
  birth_city TEXT,
  
  -- Endereço completo
  address TEXT,
  address_number TEXT,
  address_complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- CNH (para autoescola)
  cnh_number TEXT,
  cnh_expiration_date DATE,
  
  -- Metadados
  source TEXT DEFAULT 'crm' CHECK (source IN ('crm', 'balcao')),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_clients_contact_id ON erp_clients(contact_id);
CREATE INDEX IF NOT EXISTS idx_erp_clients_cpf ON erp_clients(cpf);
CREATE INDEX IF NOT EXISTS idx_erp_clients_active ON erp_clients(is_active);
CREATE INDEX IF NOT EXISTS idx_erp_clients_name ON erp_clients(full_name);

-- ============================================
-- PARTE 3: CONTRATOS
-- ============================================

CREATE TABLE IF NOT EXISTS erp_contracts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES erp_companies(id) ON DELETE RESTRICT,
  client_id BIGINT NOT NULL REFERENCES erp_clients(id) ON DELETE CASCADE,
  contract_type_id BIGINT NOT NULL REFERENCES erp_contract_types(id) ON DELETE RESTRICT,
  template_id BIGINT REFERENCES erp_contract_templates(id) ON DELETE SET NULL,
  
  -- Dados do contrato
  contract_number TEXT UNIQUE NOT NULL,
  
  -- Valores
  total_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) DEFAULT 0,
  final_value NUMERIC(10, 2) NOT NULL,
  
  -- Parcelamento
  installments INTEGER DEFAULT 1,
  payment_method_id BIGINT REFERENCES erp_payment_methods(id) ON DELETE SET NULL,
  
  -- Datas
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  
  -- PDF gerado
  pdf_url TEXT,
  
  -- Observações
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_contracts_company ON erp_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_contracts_client ON erp_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_erp_contracts_type ON erp_contracts(contract_type_id);
CREATE INDEX IF NOT EXISTS idx_erp_contracts_status ON erp_contracts(status);
CREATE INDEX IF NOT EXISTS idx_erp_contracts_number ON erp_contracts(contract_number);

-- Itens/Serviços do Contrato
CREATE TABLE IF NOT EXISTS erp_contract_items (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES erp_contracts(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_contract_items_contract ON erp_contract_items(contract_id);

-- ============================================
-- PARTE 4: FINANCEIRO
-- ============================================

-- Contas a Receber
CREATE TABLE IF NOT EXISTS erp_receivables (
  id BIGSERIAL PRIMARY KEY,
  contract_id BIGINT NOT NULL REFERENCES erp_contracts(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES erp_companies(id) ON DELETE RESTRICT,
  client_id BIGINT NOT NULL REFERENCES erp_clients(id) ON DELETE CASCADE,
  
  -- Dados da parcela
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  
  -- Status de pagamento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  paid_date DATE,
  paid_amount NUMERIC(10, 2),
  
  -- Método de pagamento
  payment_method_id BIGINT REFERENCES erp_payment_methods(id) ON DELETE SET NULL,
  
  -- Referências
  receipt_id BIGINT,
  
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_receivables_contract ON erp_receivables(contract_id);
CREATE INDEX IF NOT EXISTS idx_erp_receivables_client ON erp_receivables(client_id);
CREATE INDEX IF NOT EXISTS idx_erp_receivables_company ON erp_receivables(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_receivables_status ON erp_receivables(status);
CREATE INDEX IF NOT EXISTS idx_erp_receivables_due_date ON erp_receivables(due_date);

-- Recibos
CREATE TABLE IF NOT EXISTS erp_receipts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES erp_companies(id) ON DELETE RESTRICT,
  client_id BIGINT NOT NULL REFERENCES erp_clients(id) ON DELETE CASCADE,
  receivable_id BIGINT REFERENCES erp_receivables(id) ON DELETE SET NULL,
  
  -- Dados do recibo
  receipt_number TEXT UNIQUE NOT NULL,
  receipt_date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method_id BIGINT REFERENCES erp_payment_methods(id) ON DELETE SET NULL,
  
  -- Descrição
  description TEXT NOT NULL,
  
  -- PDF/Impressão
  pdf_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_receipts_company ON erp_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_erp_receipts_client ON erp_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_erp_receipts_receivable ON erp_receipts(receivable_id);
CREATE INDEX IF NOT EXISTS idx_erp_receipts_date ON erp_receipts(receipt_date);

-- ============================================
-- PARTE 5: AUDITORIA
-- ============================================

CREATE TABLE IF NOT EXISTS erp_audit_log (
  id BIGSERIAL PRIMARY KEY,
  
  -- Contexto
  table_name TEXT NOT NULL,
  record_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  
  -- Usuário
  user_id UUID,
  user_email TEXT,
  
  -- Dados
  old_values JSONB,
  new_values JSONB,
  
  -- Metadados
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_erp_audit_log_table ON erp_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_record ON erp_audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_user ON erp_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_erp_audit_log_created ON erp_audit_log(created_at);

-- ============================================
-- PARTE 6: SISTEMA DE NUMERAÇÃO AUTOMÁTICA
-- ============================================

CREATE TABLE IF NOT EXISTS erp_sequences (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER DEFAULT 0,
  UNIQUE(type, year)
);

-- Função para gerar número de documento
CREATE OR REPLACE FUNCTION generate_document_number(
  doc_type TEXT
) RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_number INTEGER;
  prefix TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW());
  
  -- Definir prefixo
  prefix := CASE doc_type
    WHEN 'contract' THEN 'CONT'
    WHEN 'receipt' THEN 'REC'
    ELSE 'DOC'
  END;
  
  -- Inserir ou atualizar sequência
  INSERT INTO erp_sequences (type, year, last_number)
  VALUES (doc_type, current_year, 1)
  ON CONFLICT (type, year) 
  DO UPDATE SET last_number = erp_sequences.last_number + 1
  RETURNING last_number INTO next_number;
  
  -- Retornar número formatado: CONT-2024-0001
  RETURN prefix || '-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 7: INTEGRAÇÃO CRM ↔ ERP
-- ============================================

-- Adicionar campos de controle na tabela de deals
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS 
  needs_contract BOOLEAN DEFAULT false;

ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS 
  existing_client_id BIGINT REFERENCES erp_clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_crm_deals_existing_client ON crm_deals(existing_client_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_needs_contract ON crm_deals(needs_contract);

-- Função para processar deal ganho
CREATE OR REPLACE FUNCTION process_won_deal()
RETURNS TRIGGER AS $$
DECLARE
  stage_won BOOLEAN;
  client_id_found BIGINT;
BEGIN
  -- Verificar se o novo stage é "won"
  SELECT is_won INTO stage_won
  FROM crm_stages
  WHERE id = NEW.stage_id;
  
  -- Se não é stage ganho, retorna
  IF NOT stage_won THEN
    RETURN NEW;
  END IF;
  
  -- Buscar se já existe cliente para este contato
  SELECT id INTO client_id_found
  FROM erp_clients 
  WHERE contact_id = NEW.contact_id
  LIMIT 1;
  
  IF client_id_found IS NULL AND NEW.contact_id IS NOT NULL THEN
    -- Cliente não existe, criar novo (dados básicos)
    INSERT INTO erp_clients (
      contact_id, 
      full_name,
      cpf,
      source,
      is_active
    )
    SELECT 
      c.id,
      c.name,
      'PENDENTE-' || c.id::TEXT, -- CPF temporário até completar cadastro
      'crm',
      true
    FROM crm_contacts c
    WHERE c.id = NEW.contact_id
    RETURNING id INTO client_id_found;
  END IF;
  
  -- Marcar deal como precisando de contrato e armazenar referência ao cliente
  UPDATE crm_deals 
  SET 
    needs_contract = true,
    existing_client_id = client_id_found
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_convert_deal_to_client ON crm_deals;
DROP TRIGGER IF EXISTS trigger_process_won_deal ON crm_deals;

-- Criar novo trigger
CREATE TRIGGER trigger_process_won_deal
AFTER UPDATE OF stage_id ON crm_deals
FOR EACH ROW
EXECUTE FUNCTION process_won_deal();

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar tabelas criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' AND table_name LIKE 'erp_%'
ORDER BY table_name;

-- Verificar tipos de contrato
SELECT * FROM erp_contract_types;

-- Verificar métodos de pagamento
SELECT * FROM erp_payment_methods;
