# Etapa 1: Database Schema - Guia de Execução

## ✅ Arquivo Criado

📄 `supabase_migrations/migration_api_system.sql`

---

## 🚀 Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie todo o conteúdo de `migration_api_system.sql`
6. Cole no editor
7. Clique em **Run** (ou pressione `Ctrl+Enter`)

### Opção 2: Via Supabase CLI

```bash
# Navegar até a pasta do projeto
cd c:\Projetos\kanban

# Executar migration
supabase db push
```

---

## 📋 O Que Foi Criado

### Tabelas

| Tabela                  | Descrição                  | Registros                 |
| ----------------------- | -------------------------- | ------------------------- |
| `api_keys`              | API Keys para autenticação | Gerenciamento de chaves   |
| `api_logs`              | Logs de requisições à API  | Auditoria e monitoramento |
| `webhook_subscriptions` | Configurações de webhooks  | URLs e eventos            |
| `webhook_logs`          | Logs de envios de webhooks | Histórico de tentativas   |
| `webhook_queue`         | Fila de webhooks pendentes | Processamento assíncrono  |

### Funções

- **`has_api_permission(permissions, required)`**: Valida se uma permissão existe
- **`trigger_webhook(event_type, payload)`**: Adiciona webhook à fila
- **`update_updated_at_column()`**: Atualiza campo `updated_at` automaticamente

### Índices

Todos os índices necessários para performance foram criados:

- Busca por hash de API key
- Filtros por status
- Ordenação por data
- Busca por eventos (GIN index)

### Segurança

- ✅ **RLS (Row Level Security)** habilitado em todas as tabelas
- ✅ Políticas criadas para service role (Edge Functions)
- ✅ API Keys armazenadas como hash SHA-256 (nunca em texto puro)
- ✅ Secrets de webhook para validação HMAC

---

## ✅ Verificação

Após executar a migration, você verá mensagens de sucesso:

```
✅ Todas as 5 tabelas foram criadas com sucesso!
✅ Teste 1 passou: Permissão específica encontrada
✅ Teste 2 passou: Permissão não encontrada corretamente
✅ Teste 3 passou: Wildcard funciona
🎉 Migration API System executada com sucesso!
```

### Verificar Manualmente

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('api_keys', 'api_logs', 'webhook_subscriptions', 'webhook_logs', 'webhook_queue');

-- Deve retornar 5 linhas

-- Testar função has_api_permission
SELECT has_api_permission(ARRAY['crm:read', 'crm:write'], 'crm:read'); -- true
SELECT has_api_permission(ARRAY['crm:read'], 'erp:write'); -- false
SELECT has_api_permission(ARRAY['*'], 'qualquer:coisa'); -- true

-- Verificar índices
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%api%' OR tablename LIKE '%webhook%'
ORDER BY tablename, indexname;
```

---

## 🎯 Próximos Passos

Após confirmar que a migration foi executada com sucesso:

1. ✅ **Etapa 1 concluída**
2. ➡️ **Iniciar Etapa 2**: Criar Edge Functions

---

## 📊 Estrutura de Dados

### Permissões Disponíveis

- `crm:read` - Leitura de dados CRM (deals, contacts, pipelines)
- `crm:write` - Escrita de dados CRM
- `erp:read` - Leitura de dados ERP (clients, contracts, receivables)
- `erp:write` - Escrita de dados ERP
- `*` - Acesso total (wildcard)

### Eventos de Webhook

- `deal.created` - Disparado quando um deal é criado
- `contract.signed` - Disparado quando um contrato é assinado (status = 'active')
- `payment.received` - Disparado quando um pagamento é recebido (receivable status = 'paid')

---

## ⚠️ Troubleshooting

### Erro: "relation already exists"

Se alguma tabela já existir, você pode:

```sql
-- Deletar tabelas existentes (CUIDADO: perde dados)
DROP TABLE IF EXISTS webhook_queue CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS webhook_subscriptions CASCADE;
DROP TABLE IF EXISTS api_logs CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;

-- Depois executar a migration novamente
```

### Erro: "permission denied"

Certifique-se de estar usando uma conta com permissões de administrador no Supabase.

---

**Status**: ✅ Pronto para executar
**Tempo estimado**: 2-3 minutos
