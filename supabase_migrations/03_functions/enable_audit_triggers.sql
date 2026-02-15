-- Função para preencher automaticamente created_by e updated_by
CREATE OR REPLACE FUNCTION public.handle_audit_fields()
RETURNS TRIGGER AS $$
DECLARE
  v_system_user_id UUID;
BEGIN
  -- Busca o ID do usuário do sistema correspondente ao usuário autenticado
  SELECT id INTO v_system_user_id
  FROM public.system_users
  WHERE auth_user_id = auth.uid();

  -- Se não encontrar usuário (ex: operação via service role sem contexto de usuário), deixa null ou usa o que veio
  IF v_system_user_id IS NOT NULL THEN
    -- Se for INSERT
    IF (TG_OP = 'INSERT') THEN
      NEW.created_by = v_system_user_id;
      NEW.updated_by = v_system_user_id;
    -- Se for UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
      NEW.updated_by = v_system_user_id;
      -- Protege created_by original
      NEW.created_by = OLD.created_by;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para erp_clients
DROP TRIGGER IF EXISTS set_audit_fields_erp_clients ON public.erp_clients;

CREATE TRIGGER set_audit_fields_erp_clients
BEFORE INSERT OR UPDATE ON public.erp_clients
FOR EACH ROW
EXECUTE FUNCTION public.handle_audit_fields();

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.handle_audit_fields() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_audit_fields() TO service_role;
