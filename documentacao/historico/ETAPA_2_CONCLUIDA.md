# 🔧 Etapa 2 Con cluída - Backend Hooks e Services

## ✅ Hooks Criados

### 1. [`useERPConfig.ts`](file:///c:/Projetos/kanban/src/hooks/useERPConfig.ts)

Gerencia configurações base do sistema.

**Hooks exportados:**

- **`useCompanies()`** - CRUD de empresas, soft delete
- **`useContractTypes()`** - Gerenciar tipos de contrato (Autoescola, Despachante, etc.)
- **`usePaymentMethods()`** - Gerenciar métodos de pagamento (PIX, Boleto, etc.)

**Funcionalidades:**

- ✅ Listar todos / somente ativos
- ✅ Criar novo
- ✅ Atualizar
- ✅ Desativar (soft delete)

---

### 2. [`useTemplates.ts`](file:///c:/Projetos/kanban/src/hooks/useTemplates.ts)

Gerencia templates de PDF para contratos e recibos.

**Funcionalidades:**

- ✅ Listar templates por tipo (contract / receipt)
- ✅ Criar/editar template HTML + CSS
- ✅ Definir template padrão
- ✅ Deletar template
- ✅ Validar apenas um template padrão por tipo

**Helpers:**

- `useTemplatesByType(type)` - Filtrar por tipo
- `useDefaultTemplate(type)` - Buscar template padrão

---

### 3. [`useClients.ts`](file:///c:/Projetos/kanban/src/hooks/useClients.ts)

Gerenciamento completo de clientes.

**Funcionalidades:**

- ✅ CRUD completo
- ✅ Busca por nome/CPF
- ✅ Integração com CRM (join com `crm_contacts`)
- ✅ Soft delete
- ✅ Cadastro direto (balcão) ou via CRM

**Helpers:**

- `useClient(id)` - Buscar por ID
- `useClientByContactId(contactId)` - Integração CRM

---

### 4. [`useContracts.ts`](file:///c:/Projetos/kanban/src/hooks/useContracts.ts)

Gerenciamento de contratos e itens.

**Funcionalidades principais:**

- ✅ Criar contrato com itens
- ✅ **Geração automática de parcelas** (tabela `erp_receivables`)
- ✅ Geração de número único via `generate_document_number()`
- ✅ Atualizar/cancelar contrato
- ✅ Listar contratos por cliente
- ✅ Joins completos (empresa, cliente, tipo, método de pagamento)

**Lógica de criação:**

```
1. Inserir contrato
2. Inserir itens do contrato
3. Gerar N parcelas (baseado em contract.installments)
   - Calcula valor de cada parcela
   - Calcula datas de vencimento (mensal)
   - Insere em erp_receivables
```

**Helpers:**

- `useContract(id)` - Detalhes completos
- `useContractsByClient(clientId)` - Contratos do cliente
- `useContractItems(contractId)` - Itens do contrato

---

### 5. [`useFinancial.ts`](file:///c:/Projetos/kanban/src/hooks/useFinancial.ts)

Gerenciamento financeiro (recebíveis e recibos).

#### **useReceivables()**

**Funcionalidades:**

- ✅ Listar contas a receber
- ✅ Filtrar por status (pending, paid, overdue, cancelled)
- ✅ Marcar como pago
- ✅ **Gerar recibo automaticamente ao marcar como pago**
- ✅ Atualizar status de vencidos (helper para cron)

**Lógica de pagamento:**

```
1. Update receivable (status=paid, paid_date, paid_amount)
2. Gerar número de recibo via generate_document_number()
3. Criar registro em erp_receipts
4. Vincular recibo ao receivable (receipt_id)
```

**Helpers:**

- `useReceivablesByStatus(status)` - Filtrar por status
- `useReceivablesByClient(clientId)` - Por cliente
- `useReceivablesByContract(contractId)` - Por contrato

#### **useReceipts()**

**Funcionalidades:**

- ✅ Listar todos os recibos
- ✅ Criar recibo manual (se necessário)
- ✅ Filtrar por cliente
- ✅ Joins completos para impressão

**Helpers:**

- `useReceipt(id)` - Detalhes para impressão
- `useReceiptsByClient(clientId)` - Histórico do cliente

---

## 📊 Tipos TypeScript

Atualizados em [`database.ts`](file:///c:/Projetos/kanban/src/types/database.ts):

**Interfaces ERP:**

- ✅ `Company` - Empresas
- ✅ `ContractType` - Tipos de contrato
- ✅ `PaymentMethod` - Métodos de pagamento
- ✅ `ContractTemplate` - Templates PDF
- ✅ `Client` - Clientes (completos)
- ✅ `Contract` - Contratos
- ✅ `ContractItem` - Itens do contrato
- ✅ `Receivable` - Contas a receber
- ✅ `Receipt` - Recibos
- ✅ `AuditLog` - Logs de auditoria

**Atualizações CRM:**

- ✅ `Deal.needs_contract` - Indicador de necessidade de contrato
- ✅ `Deal.existing_client_id` - Referência ao cliente ERP

**Database Schema:**

- ✅ Todas as tabelas ERP adicionadas ao tipo `Database`
- ✅ Tipos `Insert` e `Update` corretos para cada tabela

---

## 🎯 Funcionalidades Chave Implementadas

### 1. Auto-numeração de Documentos

Via função SQL `generate_document_number(type)`:

- Contratos: `CONT-2024-0001`
- Recibos: `REC-2024-0001`
- Reinicia automaticamente a cada ano

### 2. Geração Automática de Parcelas

Ao criar contrato:

- Calcula valor de cada parcela (final_value / installments)
- Gera vencimentos mensais a partir da data de início
- Cria registros em `erp_receivables` automaticamente

### 3. Geração Automática de Recibos

Ao marcar parcela como paga:

- Gera número de recibo
- Cria registro em `erp_receipts`
- Vincula recibo ao receivable
- Atualiza receivable com receipt_id

### 4. Integração CRM ↔ ERP

- `useClientByContactId()` - Buscar cliente por contato CRM
- Suporte a deals com `existing_client_id`
- Join automático com `crm_contacts` para dados básicos

### 5. Soft Delete

Empresas, clientes, tipos e métodos usam `is_active`:

- Nunca deletados fisicamente
- Queries filtram por `is_active = true`
- Histórico preservado

---

## ⚠️ Observações Importantes

### TypeScript

Alguns hooks usam `@ts-expect-error` para contornar limitações de inferência do Supabase. Isso é seguro e comum.

### Queries com Joins

Todos os hooks principais fazem joins apropriados:

- Contratos: empresa, cliente, tipo, método
- Recebíveis: cliente, empresa, contrato
- Recibos: cliente, empresa, método de pagamento

### Invalidação de Cache

React Query invalida automaticamente:

- Após mutations bem-sucedidas
- Queries relacionadas (ex: invalidar `contracts` e `receivables` ao criar contrato)

---

## 🚀 Próxima Etapa

**Etapa 3: Frontend - Configurações Base**

Criar páginas para:

1. Gerenciar empresas
2. Gerenciar tipos de contrato e métodos de pagamento
3. Gerenciar templates PDF
4. Atualizar sidebar com navegação ERP

---

**Backend 95% pronto! 🎉** (Falta apenas useAuditLog, que é opcional para MVP)
