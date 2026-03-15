# Documentacao da API - Sistema Kanban

> Ultima auditoria tecnica: 14/03/2026
> Ultima revisao de seguranca (Sprint 0): 14/03/2026
> Fontes auditadas: `supabase/functions/api-crm/index.ts`, `supabase/functions/api-erp/index.ts`, `supabase/functions/sync-chatwoot-contact/index.ts`, `supabase/functions/webhook-processor/index.ts`

## 1. Escopo

Esta documentacao cobre as Edge Functions que expoem API no projeto:

- API externa com API Key:
  - `api-crm`
  - `api-erp`
- Funcoes auxiliares/internas:
  - `sync-chatwoot-contact`
  - `webhook-processor`

## 2. Autenticacao e permissao

### 2.1 API externa (`/api-crm/*` e `/api-erp/*`)

Envie a API key no header:

```http
Authorization: Bearer sk_live_xxxxxxxxxxxxxxxxx
```

Permissoes reconhecidas no backend:

| Permissao | Uso |
| --- | --- |
| `crm:read` | leitura de deals, contatos e pipelines |
| `crm:write` | escrita em deals e contatos |
| `erp:read` | leitura de clientes, contratos e parcelas |
| `erp:write` | escrita em clientes |
| `*` | acesso total |

### 2.2 Funcoes auxiliares

As funcoes auxiliares nao usam API key de integracao (`sk_live_...`):

- `sync-chatwoot-contact`:
  - aceita `x-internal-token` **ou** usuario autenticado com perfil admin.
- `webhook-processor`:
  - exige `x-internal-token`.

Header interno esperado:

```http
x-internal-token: <INTERNAL_FUNCTION_TOKEN>
```

## 3. Convencoes de resposta

Formato base retornado pelas APIs `api-crm` e `api-erp`:

```json
{
  "data": {},
  "message": "...",
  "total": 0,
  "error": "..."
}
```

Regras observadas no codigo atual:

- `POST` de criacao retorna `200` (nao `201`).
- `total` em listagens representa a quantidade retornada na pagina atual (`data.length`), nao o total absoluto no banco.
- Recursos nao encontrados via `.single()` retornam `404`.
- Metodo nao suportado em rota valida retorna `405`.
- Erros de banco/supabase nao mapeados propagam como `500`.
- CORS habilitado para `GET, POST, PUT, DELETE, OPTIONS`.

## 4. Endpoints publicados

Base URL (Supabase Functions):

- Producao: `https://<project-ref>.supabase.co/functions/v1`
- Local: `http://localhost:54321/functions/v1`

### 4.1 CRM (`api-crm`)

| Metodo | Rota | Permissao | Observacao |
| --- | --- | --- | --- |
| `GET` | `/api-crm/deals` | `crm:read` | lista deals nao arquivados |
| `POST` | `/api-crm/deals` | `crm:write` | cria deal |
| `GET` | `/api-crm/deals/{id}` | `crm:read` | busca deal por UUID |
| `PUT` | `/api-crm/deals/{id}` | `crm:write` | atualiza deal por UUID |
| `GET` | `/api-crm/contacts` | `crm:read` | lista contatos |
| `POST` | `/api-crm/contacts` | `crm:write` | cria contato |
| `GET` | `/api-crm/contacts/{id}` | `crm:read` | busca contato por ID numerico |
| `GET` | `/api-crm/pipelines` | `crm:read` | lista pipelines |
| `GET` | `/api-crm/pipelines/{id}` | `crm:read` | busca pipeline por UUID |

Parametros de consulta:

- `/api-crm/deals`
  - `pipeline_id` (opcional)
  - `limit` (opcional, default `100`)
  - `offset` (opcional, default `0`)
- `/api-crm/contacts`
  - `search` (opcional, busca em `name`, `phone`, `email`)
  - `limit` (opcional, default `100`)
  - `offset` (opcional, default `0`)

### 4.2 ERP (`api-erp`)

| Metodo | Rota | Permissao | Observacao |
| --- | --- | --- | --- |
| `GET` | `/api-erp/clients` | `erp:read` | lista apenas clientes `is_active = true` |
| `POST` | `/api-erp/clients` | `erp:write` | cria cliente |
| `GET` | `/api-erp/clients/{id}` | `erp:read` | busca cliente por ID numerico |
| `GET` | `/api-erp/contracts` | `erp:read` | lista contratos |
| `GET` | `/api-erp/contracts/{id}` | `erp:read` | busca contrato por ID numerico |
| `GET` | `/api-erp/receivables` | `erp:read` | lista parcelas |
| `GET` | `/api-erp/receivables/{id}` | `erp:read` | busca parcela por ID numerico |

Parametros de consulta:

- `/api-erp/clients`
  - `search` (opcional, busca em `full_name` e `cpf`)
  - `limit` (opcional, default `100`)
  - `offset` (opcional, default `0`)
- `/api-erp/contracts`
  - `client_id` (opcional)
  - `status` (opcional)
  - `limit` (opcional, default `100`)
  - `offset` (opcional, default `0`)
- `/api-erp/receivables`
  - `status` (opcional)
  - `client_id` (opcional)
  - `contract_id` (opcional)
  - `limit` (opcional, default `100`)
  - `offset` (opcional, default `0`)

## 5. Funcoes auxiliares (nao cobertas por API key)

### 5.1 `POST /sync-chatwoot-contact`

Objetivo: sincronizar um contato do CRM com Chatwoot e salvar `chatwoot_id` em `crm_contacts`.

Autorizacao:

- `x-internal-token` valido, **ou**
- usuario admin autenticado (JWT do Supabase Auth).

Request:

```json
{
  "contact_id": 123
}
```

Resposta de sucesso (`200`):

```json
{
  "success": true,
  "chatwoot_id": 9876,
  "message": "Contact synced successfully"
}
```

Erros comuns:

- `400` (payload/configuracao invalida)
- `401` (nao autenticado)
- `403` (sem privilegio admin)
- `404` (contato nao encontrado)

### 5.2 `POST /webhook-processor`

Objetivo: processar ate 10 itens pendentes de `webhook_queue`.

Autorizacao:

- exige `x-internal-token` valido.

Resposta de sucesso (`200`):

```json
{
  "processed": 10,
  "results": [
    {
      "id": 1,
      "status": "sent"
    }
  ]
}
```

Erros comuns:

- `401` (token interno ausente/invalido)
- `500` (erro interno)

## 6. Ajustes aplicados em 14/03/2026

1. Normalizacao de erro para `404` (registro inexistente) e `405` (metodo nao suportado).
2. Protecao de funcoes internas com token interno/admin.
3. `webhook-processor` passou a tratar `HTTP 4xx/5xx` como falha com retry.
4. Registro em `api_logs` mantido para respostas de sucesso e erro.

## 7. Referencia OpenAPI

Especificacao machine-readable: `documentacao/tecnica/openapi.yaml`.
