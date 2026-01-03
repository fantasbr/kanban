-- ============================================
-- DADOS DE EXEMPLO PARA TESTE
-- Execute APÓS a migration_erp_complete.sql
-- ============================================

-- ============================================
-- 1. EMPRESAS
-- ============================================

INSERT INTO erp_companies (name, cnpj, phone, email, address, city, state, zip_code) VALUES
  ('Autoescola Vibe', '12.345.678/0001-90', '(11) 98765-4321', 'contato@autoescolavibe.com.br', 'Av. Principal, 1000', 'São Paulo', 'SP', '01234-567'),
  ('Despachante Express', '98.765.432/0001-10', '(11) 91234-5678', 'atendimento@despachanteexpress.com.br', 'Rua Secundária, 500', 'São Paulo', 'SP', '01234-890'),
  ('Autoescola Trânsito Seguro', '11.222.333/0001-44', '(11) 93456-7890', 'contato@transitoseguro.com.br', 'Av. Paulista, 2000', 'São Paulo', 'SP', '01310-100');

-- ============================================
-- 2. CLIENTES DE EXEMPLO (Balcão)
-- ============================================

INSERT INTO erp_clients (
  full_name, cpf, rg_number, rg_issuer_state, rg_issue_date,
  birth_date, gender, father_name, mother_name,
  birth_country, birth_state, birth_city,
  address, address_number, address_complement, neighborhood, city, state, zip_code,
  source
) VALUES
  (
    'Roberto Carlos da Silva',
    '123.456.789-00',
    '12.345.678-9',
    'SP',
    '2005-01-15',
    '1990-05-20',
    'M',
    'Carlos Alberto da Silva',
    'Maria José da Silva',
    'Brasil',
    'SP',
    'São Paulo',
    'Rua das Flores',
    '123',
    'Apto 42',
    'Jardim Paulista',
    'São Paulo',
    'SP',
    '01234-567',
    'balcao'
  ),
  (
    'Fernanda Oliveira Santos',
    '987.654.321-00',
    '98.765.432-1',
    'SP',
    '2010-03-10',
    '1995-08-15',
    'F',
    'José Oliveira Santos',
    'Ana Paula Oliveira',
    'Brasil',
    'SP',
    'Campinas',
    'Av. Brasil',
    '456',
    NULL,
    'Centro',
    'São Paulo',
    'SP',
    '01234-890',
    'balcao'
  );

-- ============================================
-- 3. TEMPLATE DE CONTRATO (Exemplo Básico)
-- ============================================

INSERT INTO erp_contract_templates (
  name,
  type,
  contract_type_id,
  template_html,
  css_styles,
  header_html,
  footer_html,
  is_default,
  is_active
) VALUES (
  'Contrato Padrão Autoescola',
  'contract',
  (SELECT id FROM erp_contract_types WHERE name = 'Autoescola'),
  '
  <div class="contract">
    <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h1>
    <h2>{{company_name}}</h2>
    
    <p><strong>Contrato Nº:</strong> {{contract_number}}</p>
    <p><strong>Data:</strong> {{contract_date}}</p>
    
    <h3>CONTRATANTE</h3>
    <p><strong>Nome:</strong> {{client_name}}</p>
    <p><strong>CPF:</strong> {{client_cpf}}</p>
    <p><strong>RG:</strong> {{client_rg}}</p>
    <p><strong>Endereço:</strong> {{client_address}}</p>
    
    <h3>SERVIÇOS CONTRATADOS</h3>
    {{services_table}}
    
    <h3>VALORES</h3>
    <p><strong>Valor Total:</strong> R$ {{total_value}}</p>
    <p><strong>Desconto:</strong> R$ {{discount}}</p>
    <p><strong>Valor Final:</strong> R$ {{final_value}}</p>
    <p><strong>Parcelas:</strong> {{installments}}x de R$ {{installment_value}}</p>
    
    <div class="signatures">
      <div class="signature">
        <p>_______________________________</p>
        <p>{{company_name}}</p>
      </div>
      <div class="signature">
        <p>_______________________________</p>
        <p>{{client_name}}</p>
      </div>
    </div>
  </div>
  ',
  '
  body { font-family: Arial, sans-serif; }
  .contract { padding: 40px; max-width: 800px; margin: 0 auto; }
  h1 { text-align: center; color: #333; }
  h2 { text-align: center; color: #666; margin-bottom: 30px; }
  h3 { color: #444; margin-top: 25px; border-bottom: 2px solid #333; }
  .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
  .signature { text-align: center; }
  ',
  '<div style="text-align: center; margin-bottom: 20px;"><img src="{{company_logo}}" alt="Logo" style="max-width: 200px;"></div>',
  '<div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">{{company_address}} - {{company_phone}} - {{company_email}}</div>',
  true,
  true
);

-- Template de Recibo
INSERT INTO erp_contract_templates (
  name,
  type,
  contract_type_id,
  template_html,
  css_styles,
  is_default,
  is_active
) VALUES (
  'Recibo Padrão',
  'receipt',
  NULL,
  '
  <div class="receipt">
    <h1>RECIBO DE PAGAMENTO</h1>
    <h2>{{company_name}}</h2>
    
    <p><strong>Recibo Nº:</strong> {{receipt_number}}</p>
    <p><strong>Data:</strong> {{receipt_date}}</p>
    
    <p class="amount">R$ {{amount}}</p>
    
    <p>Recebi de <strong>{{client_name}}</strong>, CPF {{client_cpf}}, 
    a quantia de <strong>{{amount_words}}</strong>, referente a {{description}}.</p>
    
    <p><strong>Forma de Pagamento:</strong> {{payment_method}}</p>
    
    <div class="signature">
      <p>_______________________________</p>
      <p>{{company_name}}</p>
      <p>{{company_cnpj}}</p>
    </div>
  </div>
  ',
  '
  body { font-family: Arial, sans-serif; }
  .receipt { padding: 40px; max-width: 600px; margin: 0 auto; border: 2px solid #333; }
  h1 { text-align: center; color: #333; }
  h2 { text-align: center; color: #666; }
  .amount { text-align: center; font-size: 32px; font-weight: bold; color: #28a745; margin: 30px 0; }
  .signature { text-align: center; margin-top: 60px; }
  ',
  true,
  true
);

-- ============================================
-- 4. CONTRATO DE EXEMPLO
-- ============================================

-- Criar contrato para Roberto Carlos
DO $$
DECLARE
  client_id_roberto BIGINT;
  company_id_vibe BIGINT;
  contract_type_autoescola BIGINT;
  payment_method_pix BIGINT;
  template_id_contract BIGINT;
  contract_id_new BIGINT;
  contract_number TEXT;
BEGIN
  -- Buscar IDs
  SELECT id INTO client_id_roberto FROM erp_clients WHERE cpf = '123.456.789-00';
  SELECT id INTO company_id_vibe FROM erp_companies WHERE name = 'Autoescola Vibe';
  SELECT id INTO contract_type_autoescola FROM erp_contract_types WHERE name = 'Autoescola';
  SELECT id INTO payment_method_pix FROM erp_payment_methods WHERE name = 'PIX';
  SELECT id INTO template_id_contract FROM erp_contract_templates WHERE name = 'Contrato Padrão Autoescola';
  
  -- Gerar número do contrato
  contract_number := generate_document_number('contract');
  
  -- Criar contrato
  INSERT INTO erp_contracts (
    company_id,
    client_id,
    contract_type_id,
    template_id,
    contract_number,
    total_value,
    discount,
    final_value,
    installments,
    payment_method_id,
    start_date,
    status
  ) VALUES (
    company_id_vibe,
    client_id_roberto,
    contract_type_autoescola,
    template_id_contract,
    contract_number,
    2500.00,
    100.00,
    2400.00,
    3,
    payment_method_pix,
    CURRENT_DATE,
    'active'
  ) RETURNING id INTO contract_id_new;
  
  -- Adicionar itens do contrato
  INSERT INTO erp_contract_items (contract_id, description, quantity, unit_price, total_price) VALUES
    (contract_id_new, 'CNH Categoria B - Aulas Teóricas', 45, 30.00, 1350.00),
    (contract_id_new, 'CNH Categoria B - Aulas Práticas', 25, 40.00, 1000.00),
    (contract_id_new, 'Taxa de Matrícula', 1, 150.00, 150.00);
  
  -- Gerar contas a receber (3 parcelas)
  INSERT INTO erp_receivables (
    contract_id,
    company_id,
    client_id,
    installment_number,
    due_date,
    amount,
    status
  ) VALUES
    (contract_id_new, company_id_vibe, client_id_roberto, 1, CURRENT_DATE + INTERVAL '30 days', 800.00, 'pending'),
    (contract_id_new, company_id_vibe, client_id_roberto, 2, CURRENT_DATE + INTERVAL '60 days', 800.00, 'pending'),
    (contract_id_new, company_id_vibe, client_id_roberto, 3, CURRENT_DATE + INTERVAL '90 days', 800.00, 'pending');
  
  RAISE NOTICE 'Contrato % criado com sucesso!', contract_number;
END $$;

-- ============================================
-- VERIFICAÇÕES
-- ============================================

-- Ver empresas
SELECT id, name, cnpj, is_active FROM erp_companies;

-- Ver clientes
SELECT id, full_name, cpf, source FROM erp_clients;

-- Ver contratos
SELECT 
  c.contract_number,
  cl.full_name as client,
  co.name as company,
  ct.name as type,
  c.final_value,
  c.installments,
  c.status
FROM erp_contracts c
JOIN erp_clients cl ON c.client_id = cl.id
JOIN erp_companies co ON c.company_id = co.id
JOIN erp_contract_types ct ON c.contract_type_id = ct.id;

-- Ver contas a receber
SELECT 
  r.installment_number,
  cl.full_name as client,
  r.due_date,
  r.amount,
  r.status
FROM erp_receivables r
JOIN erp_clients cl ON r.client_id = cl.id
ORDER BY r.due_date;
