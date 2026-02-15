# Instruções para Ativar Auditoria de Clientes

## ⚠️ IMPORTANTE

A funcionalidade de auditoria está **DESATIVADA TEMPORARIAMENTE** até que a migração SQL seja executada.

## Passo a Passo para Ativar

### 1. Executar Migração SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Copie e execute o conteúdo do arquivo: `documentacao/migrations/add_audit_fields_to_clients.sql`

### 2. Descomentar Código em Clients.tsx

Após executar a migração com sucesso, edite o arquivo `src/pages/erp/Clients.tsx`:

**Linha ~467 (criação de cliente):**

```typescript
// ANTES (descomente estas linhas):
const clientData = {
  ...sanitizedData,
  contact_id: createdContactId,
  source: "balcao" as const,
  is_active: true,
  // Audit fields - temporarily null until migration is executed
  created_by: null, // ← REMOVER esta linha
  updated_by: null, // ← REMOVER esta linha
};

// DEPOIS:
const clientData = {
  ...sanitizedData,
  contact_id: createdContactId,
  source: "balcao" as const,
  is_active: true,
  created_by: user?.id || null, // ← ADICIONAR
  updated_by: user?.id || null, // ← ADICIONAR
};
```

**Linha ~485 (atualização de cliente):**

```typescript
// ANTES:
updates: {
  ...sanitizedData,
  // Audit field - will be added after migration is executed
  // updated_by: user?.id || null,  // ← DESCOMENTAR
}

// DEPOIS:
updates: {
  ...sanitizedData,
  updated_by: user?.id || null,  // ← DESCOMENTADO
}
```

### 3. Verificar Funcionamento

1. Criar novo cliente
2. Verificar no Supabase que `created_by` está preenchido
3. Editar cliente
4. Verificar que `updated_by` foi atualizado
5. Visualizar página de detalhes do cliente
6. Confirmar que card "Auditoria" aparece

## Status Atual

- ✅ Migração SQL criada
- ✅ Tipos TypeScript atualizados
- ✅ Interface de exibição implementada
- ⏸️ **Captura de auditoria DESATIVADA** (aguardando migração)

## Arquivos Relacionados

- Migração: `documentacao/migrations/add_audit_fields_to_clients.sql`
- Código principal: `src/pages/erp/Clients.tsx` (linhas 467 e 485)
- Exibição: `src/pages/erp/ClientDetails.tsx` (componente AuditUserInfo)
