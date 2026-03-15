# Analise Tecnica Codex

Analise tecnica concluida. Estado atual do projeto:

- `npm run lint`: **falha** com `13 errors` e `74 warnings`.
- `npm run build`: **passa**, mas com chunk principal de ~**4.16 MB** minificado.
- `npm audit --production`: **6 vulnerabilidades** (`2 criticas`, `2 altas`, `2 moderadas`).

## Pontos fortes

1. Arquitetura moderna e produtiva: React + TypeScript + React Query + Supabase, com boa separacao por paginas/hooks/componentes.
2. Deploy containerizado com multi-stage e healthcheck no Nginx. Referencias: `Dockerfile:2`, `Dockerfile:31`, `nginx.conf:32`.
3. Ha preocupacao com validacao e auditoria em partes do dominio (contratos/financeiro/aulas). Referencias: `src/hooks/useContracts.ts:140`, `src/hooks/useFinancial.ts:107`, `src/hooks/useLessons.ts:106`.

## Pontos criticos (alta prioridade)

1. **Risco de exposicao de segredos e acesso excessivo para usuarios autenticados**.  
   Referencias: `supabase_migrations/02_auth_rls/migration_api_system_rls_fix.sql:14`, `supabase_migrations/02_auth_rls/migration_api_system_rls_fix.sql:53`, `src/hooks/useAPIKeys.ts:24`, `src/hooks/useWebhooks.ts:27`, `src/hooks/useSettings.ts:16`, `src/components/settings/ChatwootSettings.tsx:31`.
2. **Function com service role sem checagem de auth/permissao** (`sync-chatwoot-contact`).  
   Referencias: `supabase/functions/sync-chatwoot-contact/index.ts:10`, `supabase/functions/sync-chatwoot-contact/index.ts:18`.
3. **Webhook pode ser marcado como enviado mesmo em erro HTTP (4xx/5xx)**, gerando perda silenciosa de eventos.  
   Referencias: `supabase/functions/webhook-processor/index.ts:115`, `supabase/functions/webhook-processor/index.ts:141`.
4. **Scripts SQL perigosos no repositorio** que abrem acesso total ou desativam RLS.  
   Referencias: `supabase_migrations/02_auth_rls/grant_all_permissions.sql:9`, `supabase_migrations/02_auth_rls/temp_disable_rls_deals.sql:9`, `supabase_migrations/05_fixes/nuclear_disable_rls.sql:24`.
5. **Vulnerabilidades de dependencias em producao**, incluindo criticas.  
   Referencias: `package.json:38`, `package.json:45`, `package.json:48`.

## Pontos fracos

1. Bugs de fluxo assincrono: uso de `await` em funcoes que retornam `mutate` (nao Promise).  
   Referencias: `src/hooks/useSettings.ts:54`, `src/components/settings/ChatwootSettings.tsx:29`, `src/hooks/useContacts.ts:112`, `src/components/clients/ClientFormDialog.tsx:304`.
2. Realtime com dependencia instavel (`[auditQuery]`) em multiplos hooks de auditoria, podendo re-subscrever mais do que o necessario.  
   Referencias: `src/hooks/useCrmAudit.ts:76`, `src/hooks/useContractsAudit.ts:111`, `src/hooks/useFinancialAudit.ts:125`, `src/hooks/useLessonsAudit.ts:70`, `src/hooks/useErpAudit.ts:85`.
3. `setState` durante render no Kanban.  
   Referencias: `src/pages/Kanban.tsx:73`.
4. Bundle inicial muito grande e sem code splitting por rota (imports estaticos de muitas paginas).  
   Referencias: `src/App.tsx:7`, `src/App.tsx:32`, `vite.config.ts:6`.
5. Estrategia de env no deploy esta inconsistente com Vite (env e build-time, docs/compose sugerem runtime).  
   Referencias: `Dockerfile:13`, `Dockerfile:16`, `docker-compose.prod.yml:13`, `documentacao/tecnica/DOCKER_DEPLOY.md:29`, `documentacao/tecnica/DOCKER_DEPLOY.md:173`.
6. Documentacao com links quebrados.  
   Referencias: `README.md:45`, `README.md:46`, `README.md:47`.

## Sugestoes de melhoria (prioridade)

1. **P0 Seguranca**: endurecer RLS para `api_keys`, `webhook_*`, `app_settings`; remover `select('*')` de dados sensiveis; mover segredos para backend-only.
2. **P0 Confiabilidade**: corrigir `webhook-processor` para tratar `!response.ok` como falha/retry; exigir autenticacao/autorizacao no `sync-chatwoot-contact`.
3. **P0 Qualidade**: zerar erros de lint e padronizar `mutateAsync` onde ha `await`.
4. **P1 Performance**: lazy loading de rotas e split de modulos pesados (PDF/XLSX), reduzindo bundle inicial.
5. **P1 DevEx/Operacao**: criar CI (`lint + build + audit + testes`) e formalizar politica para scripts SQL perigosos (separar em pasta `unsafe/` com bloqueios).
6. **P1 Dependencias**: atualizar libs vulneraveis (`jspdf`, `react-router-dom`, revisar `xlsx`/alternativa).

## Proximo passo recomendado

Se desejar, posso comecar aplicando um plano **P0** em codigo (seguranca + confiabilidade) no proximo passo.
