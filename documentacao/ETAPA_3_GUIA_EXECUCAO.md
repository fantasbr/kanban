# Etapa 3: Sistema de Webhooks - Guia de Execução

## ✅ Arquivos Criados

### Migration SQL

- ✅ `supabase_migrations/migration_webhook_triggers.sql`

### Edge Function

- ✅ `supabase/functions/webhook-processor/index.ts`

---

## 🚀 Passo 1: Executar Migration

### Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Copie o conteúdo de `migration_webhook_triggers.sql`
4. Execute (Run)

### Verificação

Você deve ver:

```
✅ Todos os 3 triggers foram criados com sucesso!
✅ View webhook_stats criada com sucesso!
🎉 Migration Webhook Triggers executada com sucesso!
```

---

## 🚀 Passo 2: Deploy da Edge Function

```bash
# Deploy do webhook processor
supabase functions deploy webhook-processor
```

---

## 🚀 Passo 3: Configurar Cron Job

Para processar webhooks automaticamente a cada minuto:

### Via Supabase Dashboard

1. Vá em **Database** → **Extensions**
2. Habilite a extensão **pg_cron**
3. Vá em **SQL Editor** e execute:

```sql
-- Criar cron job para processar webhooks a cada minuto
SELECT cron.schedule(
  'process-webhooks',
  '* * * * *', -- A cada minuto
  $$
  SELECT
    net.http_post(
      url := 'https://SEU_PROJECT_REF.supabase.co/functions/v1/webhook-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      )
    );
  $$
);
```

> **Importante**: Substitua `SEU_PROJECT_REF` pelo ID do seu projeto.

### Alternativa: Trigger Manual

Se preferir processar webhooks manualmente ou via outro sistema:

```bash
# Processar webhooks via curl
curl -X POST \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/webhook-processor
```

---

## 📋 O Que Foi Criado

### Triggers Automáticos

| Evento             | Trigger                    | Quando Dispara                           |
| ------------------ | -------------------------- | ---------------------------------------- |
| `deal.created`     | `trigger_deal_created`     | Após INSERT em `crm_deals`               |
| `contract.signed`  | `trigger_contract_signed`  | Quando `erp_contracts.status` = 'active' |
| `payment.received` | `trigger_payment_received` | Quando `erp_receivables.status` = 'paid' |

### Funções Auxiliares

- **`cleanup_old_webhook_logs(days)`**: Remove logs antigos
- **`cleanup_webhook_queue()`**: Limpa fila de webhooks processados

### View de Estatísticas

```sql
-- Ver estatísticas de webhooks
SELECT * FROM webhook_stats;
```

Retorna:

- Total de tentativas
- Tentativas bem-sucedidas
- Tentativas falhadas
- Duração média
- Última tentativa

---

## ✅ Testar o Sistema

### 1. Criar um Deal (deve disparar webhook)

```sql
-- Criar deal de teste
INSERT INTO crm_deals (pipeline_id, stage_id, title, deal_value_negotiated, priority)
VALUES (
  'seu-pipeline-id',
  'seu-stage-id',
  'Deal de Teste',
  5000,
  'medium'
);
```

### 2. Verificar Fila de Webhooks

```sql
-- Ver webhooks na fila
SELECT * FROM webhook_queue
ORDER BY created_at DESC
LIMIT 5;
```

Deve mostrar um webhook com `event_type = 'deal.created'` e `status = 'pending'`.

### 3. Processar Webhooks Manualmente

```bash
curl -X POST \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/webhook-processor
```

### 4. Verificar Logs

```sql
-- Ver logs de webhooks
SELECT
  wl.*,
  ws.name AS subscription_name,
  ws.url
FROM webhook_logs wl
JOIN webhook_subscriptions ws ON wl.subscription_id = ws.id
ORDER BY wl.created_at DESC
LIMIT 10;
```

---

## 🔧 Configurar Webhook no N8N

### 1. Criar Webhook no N8N

1. No N8N, adicione node **Webhook**
2. Configure:
   - **HTTP Method**: POST
   - **Path**: `/kanban-webhook`
3. Copie a URL gerada (ex: `https://n8n.example.com/webhook/kanban-webhook`)

### 2. Criar Subscription no Banco

```sql
-- Criar webhook subscription
INSERT INTO webhook_subscriptions (
  api_key_id,
  name,
  url,
  events,
  secret,
  is_active,
  retry_count,
  timeout_seconds
) VALUES (
  NULL, -- Ou ID de uma API key
  'N8N Webhook',
  'https://n8n.example.com/webhook/kanban-webhook',
  ARRAY['deal.created', 'contract.signed', 'payment.received'],
  'seu-secret-aleatorio-aqui', -- Gerar um secret seguro
  true,
  3,
  30
);
```

### 3. Validar Assinatura HMAC no N8N

Adicione node **Function** após o Webhook:

```javascript
const crypto = require("crypto");

// Pegar assinatura do header
const signature = $node["Webhook"].json["headers"]["x-webhook-signature"];
const secret = "seu-secret-aleatorio-aqui"; // Mesmo secret da subscription
const payload = JSON.stringify($node["Webhook"].json["body"]);

// Calcular assinatura esperada
const expectedSignature = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

// Validar
if (signature !== expectedSignature) {
  throw new Error("Invalid webhook signature");
}

// Retornar payload se válido
return $node["Webhook"].json["body"];
```

---

## 📊 Monitoramento

### Ver Estatísticas

```sql
SELECT * FROM webhook_stats;
```

### Ver Webhooks Falhados

```sql
SELECT * FROM webhook_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Reprocessar Webhooks Falhados

```sql
-- Marcar webhooks falhados como pendentes novamente
UPDATE webhook_queue
SET status = 'pending', attempts = 0
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '1 day';
```

---

## 🧹 Manutenção

### Limpar Logs Antigos

```sql
-- Remover logs com mais de 30 dias
SELECT cleanup_old_webhook_logs(30);

-- Limpar fila de webhooks processados
SELECT cleanup_webhook_queue();
```

### Agendar Limpeza Automática

```sql
-- Limpar logs todo domingo às 3h
SELECT cron.schedule(
  'cleanup-webhook-logs',
  '0 3 * * 0',
  $$ SELECT cleanup_old_webhook_logs(30); $$
);

-- Limpar fila todo dia às 4h
SELECT cron.schedule(
  'cleanup-webhook-queue',
  '0 4 * * *',
  $$ SELECT cleanup_webhook_queue(); $$
);
```

---

## ⚠️ Troubleshooting

### Webhooks não estão sendo processados

1. Verificar se o cron job está ativo:

```sql
SELECT * FROM cron.job WHERE jobname = 'process-webhooks';
```

2. Verificar logs da Edge Function:

```bash
supabase functions logs webhook-processor
```

### Webhooks falhando sempre

1. Verificar URL do webhook (deve ser acessível)
2. Verificar timeout (aumentar se necessário)
3. Ver erro específico nos logs:

```sql
SELECT error_message, response_body
FROM webhook_logs
WHERE status_code >= 400 OR error_message IS NOT NULL
ORDER BY created_at DESC;
```

---

## 🎯 Próximos Passos

Após confirmar que os webhooks estão funcionando:

1. ✅ **Etapa 3 concluída**
2. ➡️ **Iniciar Etapa 4**: Interface Frontend (criar API Keys e Webhooks via UI)

---

**Status**: ✅ Pronto para executar
**Tempo estimado**: 10-15 minutos
