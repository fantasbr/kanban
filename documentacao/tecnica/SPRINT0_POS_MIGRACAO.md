# Sprint 0 - Proximos Passos (Pos-Migracao)

Este guia assume que a migration `08_sprint0_harden_integrations.sql` ja foi aplicada com sucesso.

## Objetivo

Concluir o rollout do Sprint 0 em producao sem interromper integracoes.

## Passo 2 - Configurar segredo interno

Defina o segredo `INTERNAL_FUNCTION_TOKEN` nas Edge Functions do Supabase.

Opcao CLI:

```bash
supabase secrets set INTERNAL_FUNCTION_TOKEN="gere-um-token-forte-aqui"
```

Opcao painel:

- Supabase Dashboard
- `Project Settings > Edge Functions > Secrets`
- Criar `INTERNAL_FUNCTION_TOKEN`

## Passo 3 - Deploy das Edge Functions alteradas

Deploy minimo necessario:

```bash
supabase functions deploy sync-chatwoot-contact
supabase functions deploy webhook-processor
```

Se usar pipeline CI/CD, garanta que o secret esteja presente no ambiente antes do deploy.

## Passo 4 - Atualizar chamadores internos

### 4.1 webhook-processor

Todas as chamadas para `POST /functions/v1/webhook-processor` devem enviar:

```http
x-internal-token: <INTERNAL_FUNCTION_TOKEN>
```

Exemplo `curl`:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/webhook-processor" \
  -H "x-internal-token: <INTERNAL_FUNCTION_TOKEN>"
```

Exemplo `pg_cron` + `pg_net` (job `process-webhooks`):

```sql
-- Remove job antigo (se existir)
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'process-webhooks';

-- Cria job novo com x-internal-token
SELECT cron.schedule(
  'process-webhooks',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/webhook-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-token', '<INTERNAL_FUNCTION_TOKEN>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Se possivel, evite token em texto puro no SQL e use `vault` para resolver o valor do header.

### 4.2 sync-chatwoot-contact

Agora aceita:

- `x-internal-token`, ou
- JWT de usuario autenticado com perfil admin.

Se houver automacao backend chamando esta rota, prefira usar `x-internal-token`.

## Passo 5 - Checklist de validacao (obrigatorio)

1. `webhook-processor` sem header interno retorna `401`.
2. `webhook-processor` com header interno retorna `200`.
3. `sync-chatwoot-contact` com usuario admin retorna `200`.
4. `sync-chatwoot-contact` com usuario autenticado nao-admin retorna `403`.
5. Usuario nao-admin nao consegue ler `chatwoot_access_token` em `app_settings`.
6. Webhook com destino `4xx/5xx` nao fica como `sent`; deve registrar erro e retry/failed.

## Passo 6 - Observabilidade inicial (primeiras 24h)

Monitorar:

- `webhook_logs` (aumento de `error_message`, `status_code >= 400`)
- `webhook_queue` (acumulo anormal em `pending`/`failed`)
- erros `401/403` inesperados nas funcoes internas

## Rollback rapido (se necessario)

1. Pausar jobs/chamadas de `webhook-processor`.
2. Reverter deploy das funcoes para versao anterior.
3. Aplicar migration de rollback de politicas (se existir) ou reabrir politicas temporariamente sob janela controlada.
4. Registrar incidente e causa raiz antes de reabrir acesso.
