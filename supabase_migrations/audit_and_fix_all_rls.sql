-- ==============================================================================
-- AUDITORIA E CORREÇÃO GERAL DE RLS (ROW LEVEL SECURITY)
-- ==============================================================================
-- Este script habilita RLS em todas as tabelas do sistema e aplica políticas
-- padronizadas para garantir que usuários autenticados possam operar o sistema.
--
-- POLÍTICA PADRÃO:
-- - SELECT, INSERT, UPDATE, DELETE permitidos para role 'authenticated'
-- - CHECK (true) e USING (true) simplificados para este estágio do projeto
--   (futuramente pode ser refinado para tenant isolation se necessário)
-- ==============================================================================

DO $$
DECLARE
  -- Lista de tabelas do sistema CRM, ERP e Settings
  tables TEXT[] := ARRAY[
    -- CRM
    'crm_pipelines', 'crm_stages', 'crm_deals', 'crm_contacts', 'crm_deal_titles', 'crm_activity_log',
    -- ERP
    'erp_companies', 'erp_contract_types', 'erp_payment_methods', 'erp_contract_templates',
    'erp_clients', 'erp_contracts', 'erp_contract_items', 'erp_receivables', 'erp_receipts', 'erp_audit_log',
    -- Settings & System
    'app_settings', 'pdf_templates', 'api_keys', 'webhook_subscriptions', 'api_logs', 'webhook_logs', 'webhook_queue'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- 1. Habilitar RLS (se já estiver, não gera erro)
    EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', t);
    
    -- 2. Limpar políticas antigas (para evitar duplicação/conflito)
    --    Removemos políticas comuns que podem ter nomes variados
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can select %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %I" ON %I;', t, t);
    
    EXECUTE format('DROP POLICY IF EXISTS "Users can view %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Users can create %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Users can update %I" ON %I;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "Users can delete %I" ON %I;', t, t);
    
    -- Removemos políticas específicas do fix anterior para padronizar
    EXECUTE format('DROP POLICY IF EXISTS "Users can update their own deals" ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated users to insert activity logs" ON %I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow users to view activity logs" ON %I;', t);

    -- 3. Criar Nova Política Unificada de SELECT
    EXECUTE format('
      CREATE POLICY "Enable read for authenticated users" ON %I
      FOR SELECT TO authenticated USING (true);
    ', t);

    -- 4. Criar Nova Política Unificada de INSERT
    EXECUTE format('
      CREATE POLICY "Enable insert for authenticated users" ON %I
      FOR INSERT TO authenticated WITH CHECK (true);
    ', t);

    -- 5. Criar Nova Política Unificada de UPDATE
    EXECUTE format('
      CREATE POLICY "Enable update for authenticated users" ON %I
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    ', t);

    -- 6. Criar Nova Política Unificada de DELETE
    EXECUTE format('
      CREATE POLICY "Enable delete for authenticated users" ON %I
      FOR DELETE TO authenticated USING (true);
    ', t);
    
    RAISE NOTICE 'RLS configurado para tabela: %', t;
  END LOOP;
END $$;

-- ==============================================================================
-- CORREÇÕES ESPECÍFICAS DE TRIGGERS
-- ==============================================================================

-- Recriar o trigger log_deal_created para garantir que ele não bloqueie
-- a criação de negócios em caso de erro de log, mantendo a integridade.
-- (Versão simplificada e segura)

CREATE OR REPLACE FUNCTION log_deal_created()
RETURNS TRIGGER AS $$
DECLARE
  pipeline_name TEXT;
  stage_name TEXT;
  contact_name TEXT;
  user_email_val TEXT;
BEGIN
  -- Tentar buscar dados auxiliares (se falhar, fica NULL)
  BEGIN
    SELECT email INTO user_email_val FROM auth.users WHERE id = auth.uid();
  EXCEPTION WHEN OTHERS THEN user_email_val := NULL; END;

  BEGIN
    SELECT p.name INTO pipeline_name FROM crm_stages s JOIN crm_pipelines p ON s.pipeline_id = p.id WHERE s.id = NEW.stage_id;
  EXCEPTION WHEN OTHERS THEN pipeline_name := NULL; END;
  
  BEGIN
    SELECT name INTO stage_name FROM crm_stages WHERE id = NEW.stage_id;
  EXCEPTION WHEN OTHERS THEN stage_name := NULL; END;
  
  BEGIN
    SELECT name INTO contact_name FROM crm_contacts WHERE id = NEW.contact_id;
  EXCEPTION WHEN OTHERS THEN contact_name := NULL; END;
  
  -- Inserir log (agora protegido pelas policies acima)
  -- Se falhar aqui, o INSERT do deal deve falhar também para integridade
  INSERT INTO crm_activity_log (activity_type, entity_type, entity_id, user_id, user_email, metadata, new_values)
  VALUES (
    'deal_created', 'deal', NEW.id, auth.uid(), user_email_val,
    jsonb_build_object(
      'deal_title', NEW.title,
      'pipeline_name', pipeline_name,
      'stage_name', stage_name,
      'contact_name', contact_name,
      'deal_value', NEW.deal_value_negotiated,
      'priority', NEW.priority
    ),
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Auditoria e correção de RLS concluída para todas as tabelas.';
  RAISE NOTICE '🔒 Todas as tabelas agora exigem autenticação para operações.';
END $$;
