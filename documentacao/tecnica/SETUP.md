# Guia de Configuracao e Instalacao (Setup)

Este guia descreve como preparar o ambiente de desenvolvimento para o **Vibe CRM Kanban**.

## Pre-requisitos

- Node.js 18+
- NPM ou Yarn
- Acesso ao projeto Supabase correspondente

## 1. Configuracao do ambiente web

1. Clone o repositorio.
2. Instale as dependencias:
   ```bash
   npm install
   ```
3. Configure as variaveis de ambiente do frontend (`.env`):
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```

## 2. Segredo interno das Edge Functions (Sprint 0)

Para proteger rotas internas (`webhook-processor` e chamadas internas do `sync-chatwoot-contact`), configure o segredo abaixo no ambiente das Edge Functions:

```bash
INTERNAL_FUNCTION_TOKEN=<token-longo-aleatorio>
```

No Supabase Cloud, defina em **Project Settings > Edge Functions > Secrets**.

Depois de aplicar a migration de seguranca, siga o runbook:
- [Sprint 0 - Proximos passos](./SPRINT0_POS_MIGRACAO.md)

## 3. Executando localmente

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173` no navegador.

## 4. Configuracao do banco de dados (Supabase)

O banco de dados utiliza PostgreSQL hospedado no Supabase. As migracoes e estrutura de tabelas estao versionadas na pasta `supabase_migrations`.

### Estrutura principal

- **Auth**: gerenciamento de usuarios via Supabase Auth.
- **CRM**: tabelas `crm_pipelines`, `crm_stages`, `crm_deals`.
- **ERP**: tabelas `erp_clients`, `erp_vehicles`, `erp_instructors`.
- **Financeiro**: tabelas `fin_contracts`, `fin_payments`.

## 5. Scripts uteis

- `npm run build`: gera a versao de producao.
- `npm run preview`: visualiza o build de producao localmente.
- `npm run lint`: verifica problemas de codigo.

## Solucao de problemas comuns

- **Erro de tipagem (TS)**: se encontrar erros de tipo em queries complexas, verifique se `src/types/database.ts` esta atualizado.
- **Permissoes (RLS)**: se nao conseguir ver dados, verifique as politicas RLS e as permissoes de usuario (`system_users`/`system_roles`).
