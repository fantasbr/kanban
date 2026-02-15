# 🗺️ Roadmap de Melhorias - Resumo Executivo

> **Documento de Planejamento Rápido**  
> Data: 03/01/2026

---

## 📊 Status Atual

**Progresso do Sistema: 90%**

O sistema de agendamento de aulas está praticamente completo, com todas as funcionalidades core implementadas e testadas. Faltam apenas integrações finais e features avançadas opcionais.

---

## 🎯 Próximos Passos

### ✅ Sprint 1 - Completar Integrações (1 semana)

**Objetivo:** Finalizar integração com módulos existentes

| Item                                 | Status | Esforço | Prioridade |
| ------------------------------------ | ------ | ------- | ---------- |
| Testes finais - Integração Contratos | 🔄 90% | 2h      | 🔴 Alta    |
| Integração com Clientes              | ⏳ 0%  | 4-6h    | 🔴 Alta    |
| Notificações no Header               | ⏳ 0%  | 3-4h    | 🔴 Alta    |

**Total:** 9-12 horas

**Entregáveis:**

- ✅ Tab "Aulas" no modal de clientes
- ✅ Estatísticas de presença por cliente
- ✅ Badge de notificações no header
- ✅ Dropdown com aulas do dia

---

### 📊 Sprint 2 - Relatórios e Gestão (2 semanas)

**Objetivo:** Adicionar capacidades avançadas de análise e gestão

| Item                       | Esforço | Prioridade |
| -------------------------- | ------- | ---------- |
| Relatórios Detalhados      | 12-16h  | 🟡 Média   |
| Configurações de Instrutor | 10-14h  | 🟡 Média   |

**Total:** 22-30 horas

**Entregáveis:**

- 📊 Página de relatórios com gráficos
- 📥 Exportação Excel/PDF
- ⚙️ Gestão de horários semanais
- 🚫 Gestão de bloqueios (férias, folgas)
- 📋 Preferências de instrutor

---

### 🚀 Sprint 3 - Automação e Portal (1-2 semanas) - OPCIONAL

**Objetivo:** Automação e self-service

| Item             | Esforço | Prioridade |
| ---------------- | ------- | ---------- |
| Job de Lembretes | 6-8h    | 🟢 Baixa   |
| Portal do Aluno  | 24-32h  | 🟢 Baixa   |

**Total:** 30-40 horas

**Entregáveis:**

- 🤖 Lembretes automáticos 2x/dia
- 👨‍🎓 Portal self-service para alunos
- 📱 Agendamento pelo aluno
- ❌ Cancelamento com regras

---

## 📈 Impacto Esperado

### Alta Prioridade (Sprint 1)

- ✅ **Integração completa** entre todos os módulos
- ✅ **Melhor visibilidade** das aulas do dia
- ✅ **Histórico completo** por cliente
- ✅ **UX aprimorada** com notificações

### Média Prioridade (Sprint 2)

- 📊 **Análises avançadas** para tomada de decisão
- 📈 **Relatórios gerenciais** exportáveis
- ⚙️ **Gestão otimizada** de disponibilidade
- 📋 **Configurações personalizadas** por instrutor

### Baixa Prioridade (Sprint 3)

- 🤖 **Automação** de lembretes
- 👨‍🎓 **Self-service** para alunos
- ⏰ **Redução de no-shows**
- 📱 **Experiência mobile** para alunos

---

## 💰 Estimativa Total

| Categoria        | Horas      | Semanas |
| ---------------- | ---------- | ------- |
| Alta Prioridade  | 9-12h      | 1       |
| Média Prioridade | 22-30h     | 2       |
| Baixa Prioridade | 30-40h     | 1-2     |
| **TOTAL**        | **61-82h** | **4-5** |

---

## 🔑 Features Principais

### 1️⃣ Integração com Clientes

```
✓ Tab "Aulas" no modal de cliente
✓ Estatísticas (presença, faltas, concluídas)
✓ Histórico completo de aulas
✓ Botão "Agendar Nova Aula"
```

### 2️⃣ Notificações no Header

```
✓ Badge com contador de aulas hoje
✓ Dropdown com próximas aulas
✓ Destaque para aulas próximas (< 2h)
✓ Link direto para página de aulas
```

### 3️⃣ Relatórios Detalhados

```
✓ Produtividade por instrutor
✓ Utilização de veículos
✓ Relatório financeiro
✓ Análise de clientes
✓ Exportação Excel/PDF
```

### 4️⃣ Configurações de Instrutor

```
✓ Horário semanal padrão
✓ Bloqueios (férias, folgas)
✓ Preferências (duração, veículos)
✓ Histórico de alterações
```

### 5️⃣ Job de Lembretes

```
✓ Execução automática 2x/dia
✓ Lembretes para aulas do dia seguinte
✓ Webhook para WhatsApp
✓ Registro de envio
```

### 6️⃣ Portal do Aluno

```
✓ Autenticação separada
✓ Visualizar aulas agendadas
✓ Agendar novas aulas
✓ Cancelar aulas (com regras)
✓ Histórico completo
```

---

## 🛠️ Tecnologias Necessárias

### Bibliotecas Adicionais

```json
{
  "recharts": "^2.10.0", // Gráficos
  "xlsx": "^0.18.5", // Export Excel
  "jspdf": "^2.5.1", // Export PDF
  "jspdf-autotable": "^3.8.0" // Tabelas PDF
}
```

### Infraestrutura

- ✅ Supabase Edge Functions (lembretes)
- ✅ Cron Jobs (pg_cron)
- ✅ Webhooks N8N (notificações)

---

## 📋 Checklist de Implementação

### Sprint 1 - Integrações

- [ ] Finalizar testes de integração com contratos
- [ ] Criar `ClientLessonsTab.tsx`
- [ ] Adicionar tab no `ClientDetailsModal.tsx`
- [ ] Criar `LessonsNotificationBadge.tsx`
- [ ] Criar hook `useTodayLessons.ts`
- [ ] Integrar badge no `Header.tsx`
- [ ] Testes de integração completos

### Sprint 2 - Relatórios e Gestão

- [ ] Criar página `Reports.tsx`
- [ ] Implementar componentes de relatórios
- [ ] Adicionar exportação Excel/PDF
- [ ] Criar tabelas de configuração de instrutor
- [ ] Implementar `InstructorSettingsModal.tsx`
- [ ] Criar componentes de gestão de horários
- [ ] Testes de performance

### Sprint 3 - Automação (Opcional)

- [ ] Criar Edge Function de lembretes
- [ ] Configurar Cron Jobs
- [ ] Adicionar campo `reminder_sent_at`
- [ ] Criar estrutura do portal do aluno
- [ ] Implementar autenticação separada
- [ ] Criar APIs do portal
- [ ] Testes end-to-end

---

## 📞 Próximas Ações

1. **Revisar e aprovar** este roadmap
2. **Priorizar** features conforme necessidade do negócio
3. **Iniciar Sprint 1** com integrações de alta prioridade
4. **Avaliar** necessidade de Sprints 2 e 3 após Sprint 1

---

## 📚 Documentação Relacionada

- [MELHORIAS_PROGRAMADAS.md](file:///c:/Projetos/kanban/documentacao/MELHORIAS_PROGRAMADAS.md) - Documentação detalhada
- [task.md](file:///c:/Users/Angelo-PC/.gemini/antigravity/brain/2efe8cf4-9782-41ab-82bb-9da087e09cd5/task.md.resolved) - Task original

---

**Última Atualização:** 03/01/2026  
**Status:** Aguardando aprovação para iniciar Sprint 1
