# Solução Definitiva para Auditoria

Identificamos que, mesmo enviando os dados do frontend, o banco de dados não estava persistindo os campos de auditoria, provavelmente de regras de segurança (RLS).

Para resolver isso de forma definitiva e automática, criamos um **Trigger no Banco de Dados**.

## Passo Único: Executar SQL

1. Vá ao **Supabase Dashboard > SQL Editor**.
2. Cole e Execute o código do arquivo: `documentacao/migrations/enable_audit_triggers.sql`.

## O que isso faz?

Sempre que um cliente for Criado ou Atualizado, o Banco de Dados vai automaticamente:

1. Pegar seu ID de autenticação.
2. Buscar seu usuário na tabela `system_users`.
3. Preencher `created_by` e `updated_by` automaticamente.

Isso remove a responsabilidade do Frontend e garante que os dados sempre sejam salvos.

## Teste

Após executar o Script SQL:

1. Edite qualquer cliente.
2. Verifique se o card de Auditoria aparece.
