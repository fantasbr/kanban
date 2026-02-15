-- ==============================================================================
-- SISTEMA DE GERENCIAMENTO DE USUÁRIOS - SIMPLIFICADO
-- ==============================================================================
-- Implementa controle de acesso baseado em roles com permissões simples:
-- - can_view: Pode visualizar dados
-- - can_create: Pode criar novos registros
-- - can_edit: Pode editar registros existentes
-- - is_admin: Acesso total (inclui gerenciar usuários)
-- ==============================================================================

-- ==============================================================================
-- 1. CRIAR TABELAS
-- ==============================================================================

-- Tabela de Roles
CREATE TABLE IF NOT EXISTS system_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  can_view BOOLEAN DEFAULT TRUE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  is_system_role BOOLEAN DEFAULT FALSE, -- Não pode ser deletada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role_id UUID REFERENCES system_roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES system_users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_auth ON system_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON system_users(role_id) WHERE is_active = true;

-- ==============================================================================
-- 2. POPULAR ROLES PADRÃO
-- ==============================================================================

INSERT INTO system_roles (name, slug, description, can_view, can_create, can_edit, is_admin, is_system_role)
VALUES 
  ('Superadmin', 'superadmin', 'Acesso total ao sistema', true, true, true, true, true),
  ('Admin', 'admin', 'Administrador', true, true, true, false, true),
  ('Editor', 'editor', 'Pode visualizar e editar', true, false, true, false, true),
  ('Viewer', 'viewer', 'Apenas visualização', true, false, false, false, true)
ON CONFLICT (slug) DO NOTHING;

-- ==============================================================================
-- 3. FUNÇÃO HELPER PARA OBTER PERMISSÕES
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  is_admin BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(r.can_view, false) as can_view,
    COALESCE(r.can_create, false) as can_create,
    COALESCE(r.can_edit, false) as can_edit,
    COALESCE(r.is_admin, false) as is_admin
  FROM system_users u
  LEFT JOIN system_roles r ON u.role_id = r.id
  WHERE u.auth_user_id = p_user_id
  AND u.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 4. ADICIONAR is_active EM TABELAS EXISTENTES
-- ==============================================================================

-- CRM
ALTER TABLE crm_pipelines ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE crm_stages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE crm_contacts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE crm_deal_titles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- crm_deals já tem is_active (adicionado no soft delete anterior)

-- ERP
ALTER TABLE erp_contract_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE erp_payment_methods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE erp_contract_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
-- erp_companies, erp_clients já têm is_active

-- Atualizar registros existentes para is_active = true
UPDATE crm_pipelines SET is_active = true WHERE is_active IS NULL;
UPDATE crm_stages SET is_active = true WHERE is_active IS NULL;
UPDATE crm_contacts SET is_active = true WHERE is_active IS NULL;
UPDATE crm_deal_titles SET is_active = true WHERE is_active IS NULL;
UPDATE erp_contract_types SET is_active = true WHERE is_active IS NULL;
UPDATE erp_payment_methods SET is_active = true WHERE is_active IS NULL;
UPDATE erp_contract_templates SET is_active = true WHERE is_active IS NULL;

-- ==============================================================================
-- 5. HABILITAR RLS NAS NOVAS TABELAS
-- ==============================================================================

ALTER TABLE system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;

-- Políticas para system_roles (todos podem ver, apenas admin pode modificar)
CREATE POLICY "Anyone can view roles" ON system_roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can manage roles" ON system_roles
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- Políticas para system_users (todos podem ver, apenas admin pode modificar)
CREATE POLICY "Anyone can view users" ON system_users
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Only admins can manage users" ON system_users
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- ==============================================================================
-- 6. FUNÇÃO RPC PARA CRIAR USUÁRIO
-- ==============================================================================

CREATE OR REPLACE FUNCTION create_system_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role_id UUID
) RETURNS UUID AS $$
DECLARE
  v_auth_user_id UUID;
  v_system_user_id UUID;
BEGIN
  -- Verificar se quem está criando é admin
  IF NOT EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  -- Criar usuário no auth.users (via admin API)
  -- Nota: Isso precisa ser feito via Supabase Admin API no frontend
  -- Esta função apenas cria o registro em system_users
  
  -- Por enquanto, assumimos que o auth_user_id já foi criado
  -- e é passado via parâmetro (ajustaremos isso no frontend)
  
  RAISE NOTICE 'Função create_system_user será complementada com chamada à Admin API';
  
  RETURN v_system_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- VERIFICAÇÃO
-- ==============================================================================

DO $$
DECLARE
  v_roles_count INTEGER;
  v_tables_with_is_active INTEGER;
BEGIN
  -- Verificar roles criadas
  SELECT COUNT(*) INTO v_roles_count FROM system_roles;
  RAISE NOTICE '✅ Roles criadas: %', v_roles_count;
  
  -- Verificar tabelas com is_active
  SELECT COUNT(*) INTO v_tables_with_is_active
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND column_name = 'is_active';
  RAISE NOTICE '✅ Tabelas com is_active: %', v_tables_with_is_active;
  
  RAISE NOTICE '🎉 Migração de usuários concluída com sucesso!';
END $$;
