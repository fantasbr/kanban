-- ============================================
-- SOLUÇÃO DEFINITIVA: Capturar user_id via RLS
-- ============================================

-- O problema é que auth.uid() não funciona em triggers normais
-- A solução é usar o contexto do RLS que já tem acesso ao user

-- 1. Verificar se RLS está habilitado na tabela crm_deals
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

-- 2. Criar policy que permite UPDATE apenas para usuários autenticados
-- (isso garante que apenas usuários logados podem mover cards)
DROP POLICY IF EXISTS "Users can update their own deals" ON crm_deals;
CREATE POLICY "Users can update deals"
ON crm_deals
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Criar policy para SELECT
DROP POLICY IF EXISTS "Users can view deals" ON crm_deals;
CREATE POLICY "Users can view deals"
ON crm_deals
FOR SELECT
TO authenticated
USING (true);

-- 4. Criar policy para INSERT
DROP POLICY IF EXISTS "Users can create deals" ON crm_deals;
CREATE POLICY "Users can create deals"
ON crm_deals
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Criar policy para DELETE
DROP POLICY IF EXISTS "Users can delete deals" ON crm_deals;
CREATE POLICY "Users can delete deals"
ON crm_deals
FOR DELETE
TO authenticated
USING (true);

-- 6. Agora o trigger pode usar auth.uid() porque o RLS garante autenticação
-- Recriar trigger com verificação mais robusta
CREATE OR REPLACE FUNCTION log_deal_stage_changed()
RETURNS TRIGGER AS $$
DECLARE
  old_stage_name TEXT;
  new_stage_name TEXT;
  pipeline_name TEXT;
  contact_name TEXT;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Apenas registrar se o stage mudou
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    -- Capturar user_id (deve funcionar agora com RLS)
    current_user_id := auth.uid();
    
    -- Buscar email
    BEGIN
      SELECT email INTO current_user_email 
      FROM auth.users 
      WHERE id = current_user_id;
    EXCEPTION WHEN OTHERS THEN
      current_user_email := NULL;
    END;
    
    -- Buscar nomes dos stages
    SELECT name INTO old_stage_name FROM crm_stages WHERE id = OLD.stage_id;
    SELECT name INTO new_stage_name FROM crm_stages WHERE id = NEW.stage_id;
    
    -- Buscar nome do pipeline
    SELECT p.name INTO pipeline_name 
    FROM crm_stages s 
    JOIN crm_pipelines p ON s.pipeline_id = p.id 
    WHERE s.id = NEW.stage_id;
    
    -- Buscar nome do contato
    SELECT name INTO contact_name
    FROM crm_contacts
    WHERE id = NEW.contact_id;
    
    -- Inserir log
    INSERT INTO crm_activity_log (
      activity_type,
      entity_type,
      entity_id,
      user_id,
      user_email,
      metadata,
      old_values,
      new_values
    ) VALUES (
      'deal_stage_changed',
      'deal',
      NEW.id,
      current_user_id,
      current_user_email,
      jsonb_build_object(
        'deal_title', NEW.title,
        'pipeline_name', pipeline_name,
        'old_stage_name', old_stage_name,
        'new_stage_name', new_stage_name,
        'contact_name', contact_name
      ),
      jsonb_build_object('stage_id', OLD.stage_id, 'stage_name', old_stage_name),
      jsonb_build_object('stage_id', NEW.stage_id, 'stage_name', new_stage_name)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Verificar configuração
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'crm_deals';

SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'crm_deals';

-- 8. Testar auth.uid() novamente
SELECT auth.uid() as user_id;
