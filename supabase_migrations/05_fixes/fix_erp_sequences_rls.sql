-- ==============================================================================
-- CORRIGIR RLS DA TABELA erp_sequences
-- ==============================================================================
-- A tabela erp_sequences é usada para gerar números sequenciais de contratos
-- Precisa de políticas específicas pois é acessada por funções do sistema
-- ==============================================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read for authenticated users" ON erp_sequences;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON erp_sequences;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON erp_sequences;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON erp_sequences;

-- SELECT: Usuários autenticados podem visualizar
CREATE POLICY "Enable read for authenticated users" ON erp_sequences
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_view = true OR p.is_admin = true
  )
);

-- INSERT: Apenas admins podem criar novas sequências
CREATE POLICY "Enable insert for authenticated users" ON erp_sequences
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- UPDATE: Usuários com permissão de criar podem atualizar (para incrementar sequências)
-- Isso é importante pois a função de criar contrato precisa atualizar o contador
CREATE POLICY "Enable update for authenticated users" ON erp_sequences
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.can_create = true OR p.is_admin = true
  )
);

-- DELETE: Apenas admins podem deletar sequências
CREATE POLICY "Enable delete for authenticated users" ON erp_sequences
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM get_user_permissions(auth.uid()) p
    WHERE p.is_admin = true
  )
);

-- Verificação
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename = 'erp_sequences';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'POLÍTICAS APLICADAS EM erp_sequences';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de políticas: %', v_policy_count;
  
  IF v_policy_count >= 4 THEN
    RAISE NOTICE '✅ Tabela erp_sequences protegida com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Algumas políticas podem não ter sido criadas';
  END IF;
END $$;
