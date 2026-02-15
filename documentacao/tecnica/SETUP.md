# Guia de Configuração e Instalação (Setup)

Este guia descreve como preparar o ambiente de desenvolvimento para o **Vibe CRM Kanban**.

## Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Acesso ao projeto Supabase correspondente

## 1. Configuração do Ambiente

1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
    ```env
    VITE_SUPABASE_URL=https://seu-projeto.supabase.co
    VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
    ```

## 2. Executando Localmente

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173` no seu navegador.

## 3. Configuração do Banco de Dados (Supabase)

O banco de dados utiliza PostgreSQL hospedado no Supabase. As migrações e estrutura de tabelas estão versionadas na pasta `supabase_migrations`.

### Estrutura Principal

- **Auth**: Gerenciamento de usuários via Supabase Auth.
- **CRM**: Tabelas `crm_pipelines`, `crm_stages`, `crm_deals`.
- **ERP**: Tabelas `erp_clients`, `erp_vehicles`, `erp_instructors`.
- **Financeiro**: Tabelas `fin_contracts`, `fin_payments`.

## 4. Scripts Úteis

- `npm run build`: Gera a versão de produção.
- `npm run preview`: Visualiza o build de produção localmente.
- `npm run lint`: Verifica problemas de código.

## Solução de Problemas Comuns

- **Erro de Tipagem (TS)**: O projeto utiliza tipos gerados do Supabase. Se encontrar erros de tipo em queries complexas, verifique se os tipos em `src/types/database.ts` estão atualizados.
- **Permissões (RLS)**: Se você não consegue ver dados, verifique se seu usuário tem as permissões corretas na tabela `admin_users` ou se as políticas RLS (Row Level Security) estão ativas corretamente.
