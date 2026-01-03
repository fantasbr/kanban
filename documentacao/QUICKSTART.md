# Branca SGI - Sistema de Gestão Integrada - Configuração Completa ✅

## 🎯 Status: Pronto para Uso!

O projeto está **100% configurado** e pronto para ser executado.

---

## 🔑 Credenciais do Supabase

**Projeto:** vibe-kanban  
**URL:** `https://SEU-PROJETO.supabase.co`  
**Anon Key:** Já configurada no arquivo `.env`

---

## 📊 Banco de Dados

### Tabelas Criadas ✅

1. **crm_pipelines** (2 registros)

   - Vendas Autoescola
   - Despachante

2. **crm_stages** (9 registros)

   - Pipeline "Vendas Autoescola": 5 etapas
   - Pipeline "Despachante": 4 etapas

3. **crm_deals** (5 registros)
   - Deals de exemplo com diferentes prioridades
   - Incluem resumos de IA e links do Chatwoot

### Índices Criados ✅

- `idx_crm_stages_pipeline_id`
- `idx_crm_deals_pipeline_id`
- `idx_crm_deals_stage_id`
- `idx_crm_deals_created_at`

---

## 🚀 Como Executar

### 1. Iniciar o Servidor de Desenvolvimento

```bash
cd c:\Projetos\kanban
npm run dev
```

### 2. Acessar a Aplicação

Abra o navegador em: `http://localhost:5173`

### 3. Fazer Login

Você precisa criar um usuário no Supabase:

**Opção A: Via Painel do Supabase**

1. Acesse: https://supabase.com/dashboard/project/SEU-PROJETO-ID
2. Vá em **Authentication** → **Users**
3. Clique em **Add User**
4. Crie um usuário com email/senha
5. Use essas credenciais no login

**Opção B: Via SQL**

```sql
-- Execute no SQL Editor do Supabase
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@vibecrm.com',
  crypt('senha123', gen_salt('bf')),
  NOW()
);
```

---

## 📋 Dados de Exemplo Disponíveis

### Pipeline: Vendas Autoescola

**Etapas:**

1. Novo Lead (2 deals)
2. Contato Inicial (1 deal)
3. Proposta Enviada (1 deal)
4. Negociação (1 deal)
5. Fechado (0 deals)

**Deals:**

- João Silva - CNH Categoria B (R$ 1.500,00) - Prioridade Alta
- Maria Santos - Renovação CNH (R$ 350,00) - Prioridade Baixa
- Pedro Costa - CNH Categoria A (R$ 2.000,00) - Prioridade Média
- Ana Oliveira - CNH AB (R$ 2.500,00) - Prioridade Alta
- Carlos Mendes - Reciclagem (R$ 800,00) - Prioridade Média

### Pipeline: Despachante

**Etapas:**

1. Novo Cliente
2. Documentação
3. Em Processamento
4. Concluído

_(Sem deals no momento - você pode criar novos!)_

---

## ✨ Funcionalidades Testáveis

1. **Login/Logout**

   - Autenticação com Supabase
   - Redirecionamento automático

2. **Seletor de Pipeline**

   - Trocar entre "Vendas Autoescola" e "Despachante"
   - Visualizar etapas diferentes

3. **Drag & Drop**

   - Arrastar cards entre colunas
   - Atualização automática no banco

4. **Edição de Deals**

   - Clicar em um card
   - Editar valor e prioridade
   - Ver resumo da IA

5. **Link para Chatwoot**
   - Botão de link externo nos cards
   - Abre conversa no Chatwoot (se configurado)

---

## 🎨 Interface

- **Sidebar escura** com navegação
- **Kanban board** com scroll horizontal
- **Cards brancos** com sombra
- **Badges coloridas** de prioridade:
  - 🟢 Baixa (verde)
  - 🟡 Média (amarelo)
  - 🔴 Alta (vermelho)

---

## 📝 Próximos Passos Sugeridos

1. **Criar seu primeiro usuário** no Supabase Auth
2. **Executar `npm run dev`** e fazer login
3. **Testar o drag & drop** movendo cards entre colunas
4. **Editar um deal** clicando em um card
5. **Trocar de pipeline** usando o seletor no topo

---

## 🔧 Comandos Úteis

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

---

## 📞 Suporte

**Documentação completa:** `c:\Projetos\kanban\documentacao\README.md`

**Problemas comuns:**

- **Erro de autenticação:** Verifique se criou um usuário no Supabase
- **Dados não aparecem:** Confirme que as credenciais no `.env` estão corretas
- **Build com warnings:** Normal, são avisos de tipos do Supabase (não afetam funcionamento)

---

**🎉 Projeto 100% funcional e pronto para uso!**
