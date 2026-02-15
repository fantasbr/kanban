# Migrações de Banco de Dados - Integração CRM-ERP

## Ordem de Execução

Execute as migrações na ordem numérica:

### ✅ Migração 1: `01_add_contract_template_to_deals.sql`

**Status**: Pronta para executar  
**Descrição**: Adiciona coluna `contract_template_id` em `crm_deals`  
**Impacto**: Baixo - apenas adiciona coluna (não quebra nada)  
**Rollback**: `ALTER TABLE crm_deals DROP COLUMN contract_template_id;`

### ✅ Migração 2: `02_add_deal_to_contracts.sql`

**Status**: Pronta para executar  
**Descrição**: Adiciona coluna `deal_id` em `erp_contracts`  
**Impacto**: Baixo - apenas adiciona coluna (não quebra nada)  
**Rollback**: `ALTER TABLE erp_contracts DROP COLUMN deal_id;`

### ⚠️ Migração 3: `03_remove_deal_titles.sql`

**Status**: NÃO executar ainda  
**Descrição**: Remove tabela `crm_deal_titles` e coluna `title_id`  
**Impacto**: ALTO - quebra código que usa deal_titles  
**Pré-requisitos**:

- ✅ Migrações 1 e 2 executadas
- ✅ UI atualizada para usar `contract_template_id`
- ✅ Todos os componentes testados
- ✅ Nenhum código referenciando `title_id` ou `crm_deal_titles`

**Rollback**: Recriar tabela e coluna (complexo)

## Como Executar

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Copie e cole o conteúdo de cada arquivo `.sql`
5. Execute na ordem (1 → 2 → 3)

### Opção 2: Via CLI do Supabase

```bash
# Migração 1
supabase db execute -f supabase_migrations/01_add_contract_template_to_deals.sql

# Migração 2
supabase db execute -f supabase_migrations/02_add_deal_to_contracts.sql

# Migração 3 (APENAS DEPOIS DE ATUALIZAR UI)
# supabase db execute -f supabase_migrations/03_remove_deal_titles.sql
```

## Verificação Pós-Migração

### Após Migração 1:

```sql
-- Verificar se coluna foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'crm_deals' AND column_name = 'contract_template_id';

-- Verificar se índice foi criado
SELECT indexname FROM pg_indexes
WHERE tablename = 'crm_deals' AND indexname = 'idx_deals_contract_template';
```

### Após Migração 2:

```sql
-- Verificar se coluna foi criada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'erp_contracts' AND column_name = 'deal_id';

-- Verificar se índice foi criado
SELECT indexname FROM pg_indexes
WHERE tablename = 'erp_contracts' AND indexname = 'idx_contracts_deal';
```

### Após Migração 3:

```sql
-- Verificar se tabela foi removida
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'crm_deal_titles';
-- Deve retornar 0 linhas

-- Verificar se coluna foi removida
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'crm_deals' AND column_name = 'title_id';
-- Deve retornar 0 linhas
```

## Notas Importantes

- ✅ Migrações 1 e 2 são **seguras** e podem ser executadas imediatamente
- ⚠️ Migração 3 é **destrutiva** - execute apenas após UI atualizada
- 📊 Ambiente de teste - dados podem ser recriados se necessário
- 🔄 Mantenha backup antes de executar Migração 3
