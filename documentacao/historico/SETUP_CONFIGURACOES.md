# Branca SGI - Guia de Configuração

## 📦 Migrações SQL Pendentes

Para que todas as funcionalidades funcionem corretamente, você precisa executar as seguintes migrações no **SQL Editor do Supabase**:

### 1. Tabela de Configurações

**Arquivo:** `documentacao/migration_app_settings.sql`

Cria a tabela `app_settings` para armazenar configurações da aplicação (como URL do Chatwoot).

### 2. Campo updated_at

**Arquivo:** `documentacao/migration_add_updated_at.sql`

Adiciona o campo `updated_at` à tabela `crm_deals` com trigger automático para rastrear modificações.

### 3. CASCADE Delete (CRÍTICO)

**Arquivo:** `documentacao/migration_cascade_delete_pipeline.sql`

**⚠️ IMPORTANTE:** Esta migração é necessária para permitir a exclusão de pipelines.

Adiciona `ON DELETE CASCADE` às foreign keys de `pipeline_id` nas tabelas:

- `crm_stages` - Stages serão deletadas quando o pipeline for deletado
- `crm_deals` - Deals serão deletados quando o pipeline for deletado

**Sem esta migração, você não conseguirá deletar pipelines que possuem stages ou deals associados.**

---

## 🚀 Como Executar as Migrações

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Crie uma nova query
4. Copie e cole o conteúdo de cada arquivo `.sql`
5. Execute (Run)
6. Verifique se não há erros

**Ordem recomendada:**

1. `migration_app_settings.sql`
2. `migration_add_updated_at.sql`
3. `migration_cascade_delete_pipeline.sql`

---

## ✅ Após Executar as Migrações

Você poderá:

- ✅ Salvar configurações do Chatwoot
- ✅ Ver data de última modificação nos deals
- ✅ Deletar pipelines (com todas as stages e deals associados)

---

## 📝 Resumo das Funcionalidades

### Página de Configurações (`/settings`)

**Aba Pipelines:**

- Criar, editar e deletar pipelines
- Gerenciar stages dentro do modal de edição
- Reordenar stages com drag & drop
- Visualizar todos os pipelines em cards

**Aba Integrações:**

- Configurar URL base do Chatwoot
- Salvar configurações persistentes

---

## 🔧 Tecnologias Utilizadas

- **React Query** - Gerenciamento de estado do servidor
- **Supabase** - Banco de dados e autenticação
- **@dnd-kit** - Drag & drop para reordenar stages
- **Radix UI** - Componentes acessíveis (Tabs, Checkbox, Progress)
- **Tailwind CSS** - Estilização

---

## 📞 Suporte

Se encontrar algum problema após executar as migrações, verifique:

1. Console do navegador para erros JavaScript
2. Network tab para erros de API
3. Logs do Supabase para erros de banco de dados
