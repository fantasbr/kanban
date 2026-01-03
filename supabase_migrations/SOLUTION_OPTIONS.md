# Sistema de Histórico de Atividades - Solução Final

## Problema Identificado

`auth.uid()` retorna NULL em triggers mesmo com usuário autenticado no frontend. Isso é uma **limitação do Supabase**: triggers executados via REST API não têm acesso ao contexto JWT.

## Evidência

```sql
-- Log criado pelo trigger:
{
  "id": 2,
  "activity_type": "deal_stage_changed",
  "user_id": null,           -- ❌ NULL
  "user_email": null,         -- ❌ NULL
  "created_at": "2025-12-27 10:34:47"
}

-- Mas via RPC funciona:
{
  "user_id": "c69a98ca-9aef-4774-81b1-df9380adb399",  -- ✅ OK
  "user_email": "angelofilho@gmail.com"                -- ✅ OK
}
```

## Soluções Possíveis

### Opção 1: Usar RPC ao invés de UPDATE direto (Recomendada)

Criar uma função RPC que faz o UPDATE e o log em uma transação.

**Vantagens:**

- ✅ Tem acesso a `auth.uid()`
- ✅ Mantém rastreamento de usuário
- ✅ Seguro

**Desvantagens:**

- ❌ Requer mudança no frontend
- ❌ Mais complexo

### Opção 2: Aceitar user_id NULL para mudanças de stage

Manter trigger mas aceitar que mudanças de stage não terão usuário.

**Vantagens:**

- ✅ Não requer mudança no frontend
- ✅ Simples

**Desvantagens:**

- ❌ Perde rastreabilidade de quem moveu cards
- ❌ Falha de segurança/auditoria

### Opção 3: Desabilitar trigger de stage, manter apenas contact/deal created

Triggers de INSERT funcionam melhor que UPDATE.

**Vantagens:**

- ✅ Mantém logs de criação com usuário
- ✅ Simples

**Desvantagens:**

- ❌ Não rastreia mudanças de stage

## Recomendação

**Opção 1** é a mais correta, mas requer refatoração do frontend.

Para implementação imediata, sugiro **Opção 3**: manter apenas logs de criação (que funcionam) e implementar Opção 1 posteriormente quando houver tempo.

## Implementação da Opção 1 (Futura)

```typescript
// Frontend: useKanban.ts
const updateDealStageMutation = useMutation({
  mutationFn: async ({
    dealId,
    stageId,
  }: {
    dealId: string;
    stageId: string;
  }) => {
    const { error } = await supabase.rpc("update_deal_stage", {
      p_deal_id: dealId,
      p_stage_id: stageId,
    });
    if (error) throw error;
  },
});
```

```sql
-- Backend: Função RPC
CREATE OR REPLACE FUNCTION update_deal_stage(
  p_deal_id UUID,
  p_stage_id UUID
)
RETURNS void AS $$
DECLARE
  v_old_stage_id UUID;
  v_old_stage_name TEXT;
  v_new_stage_name TEXT;
  v_pipeline_name TEXT;
  v_deal_title TEXT;
BEGIN
  -- Buscar dados atuais
  SELECT stage_id, title INTO v_old_stage_id, v_deal_title
  FROM crm_deals WHERE id = p_deal_id;

  -- Fazer UPDATE
  UPDATE crm_deals SET stage_id = p_stage_id WHERE id = p_deal_id;

  -- Buscar nomes
  SELECT name INTO v_old_stage_name FROM crm_stages WHERE id = v_old_stage_id;
  SELECT name INTO v_new_stage_name FROM crm_stages WHERE id = p_stage_id;
  SELECT p.name INTO v_pipeline_name
  FROM crm_stages s JOIN crm_pipelines p ON s.pipeline_id = p.id
  WHERE s.id = p_stage_id;

  -- Inserir log (auth.uid() funciona aqui!)
  INSERT INTO crm_activity_log (
    activity_type, entity_type, entity_id,
    user_id, user_email, metadata
  ) VALUES (
    'deal_stage_changed', 'deal', p_deal_id,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    jsonb_build_object(
      'deal_title', v_deal_title,
      'pipeline_name', v_pipeline_name,
      'old_stage_name', v_old_stage_name,
      'new_stage_name', v_new_stage_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Decisão Necessária

Qual opção você prefere implementar agora?
