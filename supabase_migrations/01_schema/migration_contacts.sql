-- ============================================
-- MIGRAÇÃO: Normalização de Contatos
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: Limpar dados existentes
-- ============================================
DELETE FROM crm_deals;
DELETE FROM crm_stages;
DELETE FROM crm_pipelines;

-- PASSO 2: Criar tabela de contatos
-- ============================================
CREATE TABLE IF NOT EXISTS crm_contacts (
  id BIGSERIAL PRIMARY KEY,
  chatwoot_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  profile_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_crm_contacts_chatwoot_id ON crm_contacts(chatwoot_id);

-- PASSO 3: Adicionar coluna contact_id em crm_deals
-- ============================================
ALTER TABLE crm_deals 
ADD COLUMN IF NOT EXISTS contact_id BIGINT REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact_id ON crm_deals(contact_id);

-- PASSO 4: Inserir contatos de exemplo
-- ============================================
INSERT INTO crm_contacts (chatwoot_id, name, phone, email, profile_url)
VALUES 
  (1001, 'João Silva', '+5511999999999', 'joao.silva@email.com', NULL),
  (1002, 'Maria Santos', '+5511988888888', 'maria.santos@email.com', NULL),
  (1003, 'Pedro Costa', '+5511977777777', 'pedro.costa@email.com', NULL),
  (1004, 'Ana Oliveira', '+5511966666666', 'ana.oliveira@email.com', NULL),
  (1005, 'Carlos Mendes', '+5511955555555', 'carlos.mendes@email.com', NULL),
  (1006, 'Juliana Ferreira', '+5511944444444', 'juliana.ferreira@email.com', NULL);

-- PASSO 5: Recriar pipelines
-- ============================================
INSERT INTO crm_pipelines (name, chatwoot_inbox_id) 
VALUES 
  ('Vendas Autoescola', 'inbox-1'),
  ('Despachante', 'inbox-2')
RETURNING id;

-- PASSO 6: Recriar stages
-- ============================================
-- Para Vendas Autoescola (substitua <pipeline_id_1> pelo ID retornado acima)
INSERT INTO crm_stages (pipeline_id, name, position, is_default)
SELECT id, 'Novo Lead', 1, true FROM crm_pipelines WHERE name = 'Vendas Autoescola'
UNION ALL
SELECT id, 'Contato Inicial', 2, false FROM crm_pipelines WHERE name = 'Vendas Autoescola'
UNION ALL
SELECT id, 'Proposta Enviada', 3, false FROM crm_pipelines WHERE name = 'Vendas Autoescola'
UNION ALL
SELECT id, 'Negociação', 4, false FROM crm_pipelines WHERE name = 'Vendas Autoescola'
UNION ALL
SELECT id, 'Fechado', 5, false FROM crm_pipelines WHERE name = 'Vendas Autoescola';

-- Para Despachante
INSERT INTO crm_stages (pipeline_id, name, position, is_default)
SELECT id, 'Novo Cliente', 1, true FROM crm_pipelines WHERE name = 'Despachante'
UNION ALL
SELECT id, 'Documentação', 2, false FROM crm_pipelines WHERE name = 'Despachante'
UNION ALL
SELECT id, 'Em Processamento', 3, false FROM crm_pipelines WHERE name = 'Despachante'
UNION ALL
SELECT id, 'Concluído', 4, false FROM crm_pipelines WHERE name = 'Despachante';

-- PASSO 7: Inserir deals com contatos
-- ============================================
-- Deals para Vendas Autoescola
INSERT INTO crm_deals (pipeline_id, stage_id, contact_id, title, deal_value, priority, chatwoot_conversation_id, ai_summary)
SELECT 
  p.id,
  s.id,
  1, -- João Silva
  'CNH Categoria B',
  1500.00,
  'high',
  '12345',
  'Cliente interessado em tirar CNH categoria B. Mencionou urgência para começar em 2 semanas.'
FROM crm_pipelines p
JOIN crm_stages s ON s.pipeline_id = p.id
WHERE p.name = 'Vendas Autoescola' AND s.name = 'Novo Lead';

INSERT INTO crm_deals (pipeline_id, stage_id, contact_id, title, deal_value, priority, chatwoot_conversation_id, ai_summary)
SELECT 
  p.id,
  s.id,
  2, -- Maria Santos
  'Renovação CNH',
  350.00,
  'low',
  '12346',
  'Cliente precisa renovar CNH que vence em 3 meses.'
FROM crm_pipelines p
JOIN crm_stages s ON s.pipeline_id = p.id
WHERE p.name = 'Vendas Autoescola' AND s.name = 'Novo Lead';

INSERT INTO crm_deals (pipeline_id, stage_id, contact_id, title, deal_value, priority, chatwoot_conversation_id, ai_summary)
SELECT 
  p.id,
  s.id,
  3, -- Pedro Costa
  'CNH Categoria A',
  2000.00,
  'medium',
  '12347',
  'Interessado em CNH de moto. Já tem experiência com pilotagem.'
FROM crm_pipelines p
JOIN crm_stages s ON s.pipeline_id = p.id
WHERE p.name = 'Vendas Autoescola' AND s.name = 'Contato Inicial';

INSERT INTO crm_deals (pipeline_id, stage_id, contact_id, title, deal_value, priority, chatwoot_conversation_id, ai_summary)
SELECT 
  p.id,
  s.id,
  4, -- Ana Oliveira
  'CNH AB Completa',
  2500.00,
  'high',
  '12348',
  'Quer tirar CNH completa (A+B). Disponibilidade para aulas à tarde.'
FROM crm_pipelines p
JOIN crm_stages s ON s.pipeline_id = p.id
WHERE p.name = 'Vendas Autoescola' AND s.name = 'Proposta Enviada';

INSERT INTO crm_deals (pipeline_id, stage_id, contact_id, title, deal_value, priority, chatwoot_conversation_id, ai_summary)
SELECT 
  p.id,
  s.id,
  5, -- Carlos Mendes
  'Reciclagem CNH',
  800.00,
  'medium',
  '12349',
  'Precisa fazer reciclagem por pontos na carteira.'
FROM crm_pipelines p
JOIN crm_stages s ON s.pipeline_id = p.id
WHERE p.name = 'Vendas Autoescola' AND s.name = 'Negociação';

-- Deal para Despachante
INSERT INTO crm_deals (pipeline_id, stage_id, contact_id, title, deal_value, priority, chatwoot_conversation_id, ai_summary)
SELECT 
  p.id,
  s.id,
  6, -- Juliana Ferreira
  'Transferência de Veículo',
  450.00,
  'medium',
  '12350',
  'Precisa fazer transferência de veículo comprado de particular.'
FROM crm_pipelines p
JOIN crm_stages s ON s.pipeline_id = p.id
WHERE p.name = 'Despachante' AND s.name = 'Novo Cliente';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar contatos
SELECT * FROM crm_contacts ORDER BY id;

-- Verificar deals com contatos
SELECT 
  d.id,
  d.title,
  d.deal_value,
  c.name as contact_name,
  c.phone as contact_phone,
  s.name as stage_name,
  p.name as pipeline_name
FROM crm_deals d
LEFT JOIN crm_contacts c ON d.contact_id = c.id
LEFT JOIN crm_stages s ON d.stage_id = s.id
LEFT JOIN crm_pipelines p ON d.pipeline_id = p.id
ORDER BY d.created_at DESC;
