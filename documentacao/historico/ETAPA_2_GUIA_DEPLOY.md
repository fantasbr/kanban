# Etapa 2: Edge Functions - Guia de Deploy

## ✅ Arquivos Criados

### Arquivos Compartilhados (\_shared/)

- ✅ `types.ts` - Tipos TypeScript
- ✅ `cors.ts` - Utilitários CORS
- ✅ `auth.ts` - Autenticação via API Keys
- ✅ `logger.ts` - Logger de requisições

### Edge Functions

- ✅ `api-crm/index.ts` - API REST para CRM
- ✅ `api-erp/index.ts` - API REST para ERP

---

## 🚀 Como Fazer Deploy

### Pré-requisitos

1. **Instalar Supabase CLI** (se ainda não tiver):

```bash
npm install -g supabase
```

2. **Login no Supabase**:

```bash
supabase login
```

3. **Link ao projeto**:

```bash
cd c:\Projetos\kanban
supabase link --project-ref SEU_PROJECT_REF
```

> **Onde encontrar o PROJECT_REF**: No Supabase Dashboard → Settings → General → Reference ID

---

### Deploy das Functions

```bash
# Deploy da API CRM
supabase functions deploy api-crm

# Deploy da API ERP
supabase functions deploy api-erp
```

Aguarde a mensagem de sucesso para cada function.

---

## 📋 Endpoints Disponíveis

Após o deploy, suas APIs estarão disponíveis em:

```
https://SEU_PROJECT_REF.supabase.co/functions/v1/api-crm/...
https://SEU_PROJECT_REF.supabase.co/functions/v1/api-erp/...
```

### API CRM

| Método | Endpoint                 | Permissão   | Descrição        |
| ------ | ------------------------ | ----------- | ---------------- |
| GET    | `/api-crm/deals`         | `crm:read`  | Listar deals     |
| GET    | `/api-crm/deals/:id`     | `crm:read`  | Buscar deal      |
| POST   | `/api-crm/deals`         | `crm:write` | Criar deal       |
| PUT    | `/api-crm/deals/:id`     | `crm:write` | Atualizar deal   |
| GET    | `/api-crm/contacts`      | `crm:read`  | Listar contatos  |
| GET    | `/api-crm/contacts/:id`  | `crm:read`  | Buscar contato   |
| POST   | `/api-crm/contacts`      | `crm:write` | Criar contato    |
| GET    | `/api-crm/pipelines`     | `crm:read`  | Listar pipelines |
| GET    | `/api-crm/pipelines/:id` | `crm:read`  | Buscar pipeline  |

### API ERP

| Método | Endpoint                   | Permissão   | Descrição        |
| ------ | -------------------------- | ----------- | ---------------- |
| GET    | `/api-erp/clients`         | `erp:read`  | Listar clientes  |
| GET    | `/api-erp/clients/:id`     | `erp:read`  | Buscar cliente   |
| POST   | `/api-erp/clients`         | `erp:write` | Criar cliente    |
| GET    | `/api-erp/contracts`       | `erp:read`  | Listar contratos |
| GET    | `/api-erp/contracts/:id`   | `erp:read`  | Buscar contrato  |
| GET    | `/api-erp/receivables`     | `erp:read`  | Listar parcelas  |
| GET    | `/api-erp/receivables/:id` | `erp:read`  | Buscar parcela   |

---

## ✅ Testar as APIs

### 1. Sem Autenticação (deve retornar 401)

```bash
curl https://SEU_PROJECT_REF.supabase.co/functions/v1/api-crm/deals
```

**Resposta esperada**:

```json
{ "error": "Unauthorized" }
```

### 2. Com API Key Inválida (deve retornar 401)

```bash
curl -H "Authorization: Bearer invalid-key" \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/api-crm/deals
```

**Resposta esperada**:

```json
{ "error": "Unauthorized" }
```

### 3. Com API Key Válida (após criar na Etapa 4)

```bash
curl -H "Authorization: Bearer SUA_API_KEY_AQUI" \
  https://SEU_PROJECT_REF.supabase.co/functions/v1/api-crm/deals?limit=5
```

**Resposta esperada**:

```json
{
  "data": [...],
  "total": 5
}
```

---

## 🔍 Verificar Logs

### Via Supabase Dashboard

1. Vá em **Edge Functions** → Selecione a function
2. Clique em **Logs**
3. Veja requisições em tempo real

### Via CLI

```bash
# Logs da API CRM
supabase functions logs api-crm

# Logs da API ERP
supabase functions logs api-erp
```

---

## ⚠️ Troubleshooting

### Erro: "Function not found"

- Verifique se o deploy foi concluído com sucesso
- Confirme o nome da function (deve ser exatamente `api-crm` ou `api-erp`)

### Erro: "Missing env vars"

As Edge Functions precisam das variáveis de ambiente do Supabase (são configuradas automaticamente):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Essas variáveis são injetadas automaticamente pelo Supabase.

### Erro: "CORS"

Se estiver testando do navegador, certifique-se de que o CORS está configurado corretamente. As functions já incluem headers CORS para `*` (qualquer origem).

---

## 📊 Próximos Passos

Após deploy bem-sucedido:

1. ✅ **Etapa 2 concluída**
2. ➡️ **Iniciar Etapa 3**: Sistema de Webhooks
3. ➡️ **Iniciar Etapa 4**: Interface Frontend (para criar API Keys)

---

**Status**: ✅ Pronto para deploy
**Tempo estimado**: 5-10 minutos
