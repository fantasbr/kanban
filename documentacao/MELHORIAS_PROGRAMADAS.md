# 🚀 Melhorias Programadas - Sistema Kanban ERP

> **Documento de Planejamento de Features Avançadas**  
> Data: 03/01/2026  
> Status: Planejamento

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Integrações Pendentes](#integrações-pendentes)
3. [Features Avançadas](#features-avançadas)
4. [Priorização](#priorização)
5. [Estimativas](#estimativas)

---

## 🎯 Visão Geral

Este documento descreve as melhorias planejadas para o sistema Kanban ERP, focando em features avançadas que irão complementar a funcionalidade já implementada do sistema de agendamento de aulas.

### Status Atual do Sistema

**Progresso Essencial: 90%**

| Módulo                    | Status      | Progresso |
| ------------------------- | ----------- | --------- |
| Database Layer            | ✅ Completo | 100%      |
| TypeScript Types          | ✅ Completo | 100%      |
| Custom Hooks              | ✅ Completo | 100%      |
| UI Core                   | ✅ Completo | 100%      |
| Melhorias UI/UX           | ✅ Completo | 100%      |
| Calendário Visual         | ✅ Completo | 100%      |
| Timeline Disponibilidade  | ✅ Completo | 100%      |
| Dashboard KPIs            | ✅ Completo | 100%      |
| Integrações               | 🔄 40%      | 40%       |
| Features Avançadas Extras | 🔮 Opcional | 0%        |

---

## 🔄 Integrações Pendentes

### 9.2 Integração com Contratos (EM ANDAMENTO - 90%)

> [!IMPORTANT]
> Esta integração está quase completa, faltando apenas testes finais.

**Componentes Implementados:**

- ✅ `ContractLessonsTab.tsx` - Tab de aulas no modal de contratos
- ✅ Exibição de progresso (X/Y aulas) por item do contrato
- ✅ Botão "Agendar Aula" por item
- ✅ Lista de aulas vinculadas ao contrato

**Pendente:**

- [ ] Testes de funcionalidade completa
- [ ] Validação de edge cases
- [ ] Testes de performance com muitas aulas

**Arquivos Relacionados:**

- [ContractLessonsTab.tsx](file:///c:/Projetos/kanban/src/components/contracts/ContractLessonsTab.tsx)
- [ContractDetailsModal.tsx](file:///c:/Projetos/kanban/src/components/modals/ContractDetailsModal.tsx)

---

### 9.3 Integração com Clientes

> [!NOTE]
> Esta feature permitirá visualizar todo o histórico de aulas de um cliente específico.

**Objetivos:**

- Adicionar tab "Aulas" no modal de detalhes do cliente
- Exibir histórico completo de aulas do cliente
- Mostrar estatísticas (taxa de presença, faltas, aulas concluídas)
- Botão "Agendar Nova Aula" para agendamento rápido

**Implementação Sugerida:**

```typescript
// src/components/clients/ClientLessonsTab.tsx
interface ClientLessonsTabProps {
  clientId: string;
}

export function ClientLessonsTab({ clientId }: ClientLessonsTabProps) {
  // Buscar todas as aulas do cliente
  // Calcular estatísticas
  // Exibir timeline de aulas
  // Botão para agendar nova aula
}
```

**Estatísticas a Exibir:**

- Total de aulas agendadas
- Aulas concluídas
- Taxa de presença (%)
- Faltas registradas
- Aulas canceladas
- Próximas aulas agendadas

**Arquivos a Criar:**

- `src/components/clients/ClientLessonsTab.tsx`
- Modificar: `src/components/modals/ClientDetailsModal.tsx`

**Estimativa:** 4-6 horas

---

### 9.4 Notificações no Header

> [!TIP]
> Esta feature melhorará a visibilidade das aulas do dia para os usuários.

**Objetivos:**

- Badge com contador de aulas do dia atual
- Dropdown com lista das próximas aulas
- Link direto para a página de Lessons
- Notificação visual para aulas próximas (< 1 hora)

**Implementação Sugerida:**

```typescript
// src/components/layout/LessonsNotificationBadge.tsx
export function LessonsNotificationBadge() {
  const { lessons } = useTodayLessons();
  const upcomingCount = lessons.filter(
    (l) => l.status === "scheduled" && isToday(new Date(l.scheduled_at))
  ).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Bell className="h-5 w-5" />
        {upcomingCount > 0 && (
          <Badge variant="destructive">{upcomingCount}</Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent>{/* Lista de aulas do dia */}</DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Features:**

- Atualização em tempo real
- Destaque para aulas nas próximas 2 horas
- Click no item abre modal de detalhes
- Link "Ver todas as aulas" no footer do dropdown

**Arquivos a Criar:**

- `src/components/layout/LessonsNotificationBadge.tsx`
- `src/hooks/useTodayLessons.ts`
- Modificar: `src/components/layout/Header.tsx`

**Estimativa:** 3-4 horas

---

## 🎨 Features Avançadas

### 10.3 Relatórios Detalhados

> [!NOTE]
> Sistema completo de relatórios com exportação e análises avançadas.

**Objetivos:**

- Página dedicada de relatórios (`/erp/reports`)
- Gráficos interativos com Recharts
- Exportação para Excel e PDF
- Filtros avançados (período, instrutor, veículo, cliente, status)

**Tipos de Relatórios:**

#### 1. Relatório de Produtividade

- Aulas por instrutor (período selecionado)
- Taxa de ocupação por instrutor
- Horas trabalhadas vs. disponíveis
- Gráfico de tendência mensal

#### 2. Relatório de Utilização de Veículos

- Aulas por veículo
- Taxa de ocupação por veículo
- Manutenções e indisponibilidades
- Custo por hora de uso

#### 3. Relatório Financeiro

- Receita por aulas concluídas
- Receita por instrutor
- Receita por tipo de veículo
- Comparativo mensal/anual

#### 4. Relatório de Clientes

- Clientes mais ativos
- Taxa de presença por cliente
- Clientes com faltas recorrentes
- Progressão de aprendizado

**Implementação Sugerida:**

```typescript
// src/pages/erp/Reports.tsx
export function Reports() {
  const [reportType, setReportType] = useState<ReportType>("productivity");
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    instructorId: null,
    vehicleId: null,
  });

  return (
    <div className="space-y-6">
      <ReportFilters filters={filters} onChange={setFilters} />
      <ReportTypeSelector value={reportType} onChange={setReportType} />
      <ReportChart type={reportType} filters={filters} />
      <ExportButtons type={reportType} filters={filters} />
    </div>
  );
}
```

**Bibliotecas Necessárias:**

- `recharts` - Gráficos interativos
- `xlsx` - Exportação para Excel
- `jspdf` + `jspdf-autotable` - Exportação para PDF
- `date-fns` - Manipulação de datas

**Arquivos a Criar:**

- `src/pages/erp/Reports.tsx`
- `src/components/reports/ReportFilters.tsx`
- `src/components/reports/ReportTypeSelector.tsx`
- `src/components/reports/ReportChart.tsx`
- `src/components/reports/ExportButtons.tsx`
- `src/hooks/useReportData.ts`
- `src/lib/reportExport.ts`

**Estimativa:** 12-16 horas

---

### 10.4 Configurações de Instrutor

> [!NOTE]
> Gerenciamento avançado de disponibilidade e preferências dos instrutores.

**Objetivos:**

- Modal para editar horário semanal padrão
- Gerenciar bloqueios (férias, folgas, manutenção)
- Configurar duração padrão de aula por instrutor
- Histórico de alterações de disponibilidade

**Features:**

#### 1. Horário Semanal Padrão

```typescript
interface WeeklySchedule {
  instructor_id: string;
  day_of_week: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Domingo
  start_time: string; // "08:00"
  end_time: string; // "18:00"
  is_active: boolean;
}
```

#### 2. Bloqueios Temporários

```typescript
interface InstructorBlock {
  instructor_id: string;
  start_date: string;
  end_date: string;
  reason: "vacation" | "sick_leave" | "training" | "other";
  notes?: string;
}
```

#### 3. Preferências

```typescript
interface InstructorPreferences {
  instructor_id: string;
  default_lesson_duration: number; // minutos
  max_lessons_per_day: number;
  preferred_vehicles: string[]; // IDs dos veículos
  break_duration: number; // minutos entre aulas
}
```

**Implementação Sugerida:**

```typescript
// src/components/instructors/InstructorSettingsModal.tsx
export function InstructorSettingsModal({ instructorId }: Props) {
  return (
    <Tabs defaultValue="schedule">
      <TabsList>
        <TabsTrigger value="schedule">Horário Semanal</TabsTrigger>
        <TabsTrigger value="blocks">Bloqueios</TabsTrigger>
        <TabsTrigger value="preferences">Preferências</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule">
        <WeeklyScheduleEditor instructorId={instructorId} />
      </TabsContent>

      <TabsContent value="blocks">
        <BlocksManager instructorId={instructorId} />
      </TabsContent>

      <TabsContent value="preferences">
        <PreferencesEditor instructorId={instructorId} />
      </TabsContent>

      <TabsContent value="history">
        <ChangeHistory instructorId={instructorId} />
      </TabsContent>
    </Tabs>
  );
}
```

**Database Schema:**

```sql
-- Tabela de horários semanais
CREATE TABLE instructor_weekly_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES erp_instructors(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(instructor_id, day_of_week)
);

-- Tabela de bloqueios
CREATE TABLE instructor_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES erp_instructors(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT CHECK (reason IN ('vacation', 'sick_leave', 'training', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de preferências
CREATE TABLE instructor_preferences (
  instructor_id UUID PRIMARY KEY REFERENCES erp_instructors(id) ON DELETE CASCADE,
  default_lesson_duration INTEGER DEFAULT 60,
  max_lessons_per_day INTEGER DEFAULT 8,
  preferred_vehicles UUID[],
  break_duration INTEGER DEFAULT 15,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Arquivos a Criar:**

- `src/components/instructors/InstructorSettingsModal.tsx`
- `src/components/instructors/WeeklyScheduleEditor.tsx`
- `src/components/instructors/BlocksManager.tsx`
- `src/components/instructors/PreferencesEditor.tsx`
- `src/components/instructors/ChangeHistory.tsx`
- `src/hooks/useInstructorSettings.ts`
- Migration SQL para novas tabelas

**Estimativa:** 10-14 horas

---

### 10.5 Job de Lembretes Automáticos

> [!WARNING]
> Esta feature requer configuração de Edge Functions ou Cron Jobs no Supabase.

**Objetivos:**

- Edge Function ou Cron Job executado 2x/dia (08:00 e 20:00)
- Buscar aulas do dia seguinte
- Enviar webhook de lembrete para cada aula
- Marcar campo `reminder_sent_at` na tabela

**Implementação Sugerida:**

```typescript
// supabase/functions/send-lesson-reminders/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Buscar aulas do dia seguinte que ainda não tiveram lembrete enviado
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  const { data: lessons, error } = await supabase
    .from("erp_lessons")
    .select(
      `
      *,
      contract:erp_contracts(
        client:erp_clients(
          contact:crm_contacts(*)
        )
      ),
      instructor:erp_instructors(*),
      vehicle:erp_vehicles(*)
    `
    )
    .eq("status", "scheduled")
    .gte("scheduled_at", tomorrow.toISOString())
    .lte("scheduled_at", tomorrowEnd.toISOString())
    .is("reminder_sent_at", null);

  if (error) throw error;

  // Enviar webhook para cada aula
  const results = await Promise.allSettled(
    lessons.map(async (lesson) => {
      // Enviar webhook
      const webhookUrl = Deno.env.get("LESSON_REMINDER_WEBHOOK_URL")!;
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lesson_reminder",
          lesson_id: lesson.id,
          client_name: lesson.contract.client.contact.name,
          client_phone: lesson.contract.client.contact.phone,
          scheduled_at: lesson.scheduled_at,
          instructor_name: lesson.instructor.name,
          vehicle_plate: lesson.vehicle.plate,
        }),
      });

      // Marcar como enviado
      await supabase
        .from("erp_lessons")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", lesson.id);

      return { lesson_id: lesson.id, status: "sent" };
    })
  );

  return new Response(
    JSON.stringify({
      success: true,
      total: lessons.length,
      results: results.map((r) =>
        r.status === "fulfilled" ? r.value : { error: r.reason }
      ),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

**Configuração do Cron:**

```sql
-- Criar cron job no Supabase (requer extensão pg_cron)
SELECT cron.schedule(
  'send-lesson-reminders-morning',
  '0 8 * * *', -- Todo dia às 08:00
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/send-lesson-reminders',
    headers := '{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'send-lesson-reminders-evening',
  '0 20 * * *', -- Todo dia às 20:00
  $$
  SELECT net.http_post(
    url := 'https://[PROJECT_REF].supabase.co/functions/v1/send-lesson-reminders',
    headers := '{"Authorization": "Bearer [ANON_KEY]"}'::jsonb
  );
  $$
);
```

**Migration SQL:**

```sql
-- Adicionar campo reminder_sent_at
ALTER TABLE erp_lessons
ADD COLUMN reminder_sent_at TIMESTAMPTZ;

-- Índice para performance
CREATE INDEX idx_lessons_reminder_pending
ON erp_lessons(scheduled_at, reminder_sent_at)
WHERE status = 'scheduled' AND reminder_sent_at IS NULL;
```

**Arquivos a Criar:**

- `supabase/functions/send-lesson-reminders/index.ts`
- Migration SQL para adicionar campo `reminder_sent_at`
- Documentação de configuração do cron

**Estimativa:** 6-8 horas

---

### 10.6 Portal do Aluno

> [!CAUTION]
> Esta é a feature mais complexa e requer arquitetura separada com autenticação própria.

**Objetivos:**

- Portal self-service para alunos
- Autenticação separada (não usar sistema principal)
- Visualizar aulas agendadas
- Agendar novas aulas (self-service)
- Cancelar aulas (com regra de antecedência mínima)
- Ver histórico completo de aulas

**Arquitetura Sugerida:**

```
/student-portal
  /components
    - LoginForm.tsx
    - LessonsList.tsx
    - ScheduleLesson.tsx
    - LessonHistory.tsx
  /pages
    - Login.tsx
    - Dashboard.tsx
    - Schedule.tsx
    - History.tsx
  /hooks
    - useStudentAuth.ts
    - useStudentLessons.ts
  /lib
    - studentApi.ts
```

**Database Schema:**

```sql
-- Tabela de credenciais de alunos
CREATE TABLE student_portal_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES erp_clients(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tokens de sessão
CREATE TABLE student_portal_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES student_portal_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configurações do portal
CREATE TABLE student_portal_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_hours_to_cancel INTEGER DEFAULT 24, -- Horas mínimas para cancelar
  max_lessons_per_week INTEGER DEFAULT 5,  -- Limite de agendamentos por semana
  allow_self_scheduling BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints (Separados):**

```typescript
// src/lib/studentApi.ts

// Autenticação
POST /api/student/login
POST /api/student/logout
POST /api/student/refresh-token

// Aulas
GET  /api/student/lessons/upcoming
GET  /api/student/lessons/history
POST /api/student/lessons/schedule
POST /api/student/lessons/:id/cancel

// Disponibilidade
GET  /api/student/availability
```

**Regras de Negócio:**

1. **Agendamento:**

   - Aluno só pode agendar se tiver créditos disponíveis
   - Respeitar horários disponíveis de instrutores
   - Respeitar limite de aulas por semana
   - Validar conflitos de horário

2. **Cancelamento:**

   - Só permitir cancelamento com X horas de antecedência (configurável)
   - Devolver crédito ao cancelar
   - Notificar instrutor sobre cancelamento
   - Registrar motivo do cancelamento

3. **Segurança:**
   - Aluno só vê suas próprias aulas
   - Rate limiting em endpoints
   - Validação de tokens
   - Logs de auditoria

**Implementação Sugerida:**

```typescript
// src/pages/student-portal/Dashboard.tsx
export function StudentDashboard() {
  const { student } = useStudentAuth();
  const { upcomingLessons } = useStudentLessons();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <StudentHeader student={student} />

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card de Créditos */}
          <Card>
            <CardHeader>
              <CardTitle>Créditos Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {student.available_credits}
              </div>
              <p className="text-sm text-muted-foreground">aulas restantes</p>
            </CardContent>
          </Card>

          {/* Card de Próxima Aula */}
          <Card>
            <CardHeader>
              <CardTitle>Próxima Aula</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingLessons[0] ? (
                <NextLessonCard lesson={upcomingLessons[0]} />
              ) : (
                <p>Nenhuma aula agendada</p>
              )}
            </CardContent>
          </Card>

          {/* Card de Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => navigate("/schedule")}>
                Agendar Aula
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/history")}
              >
                Ver Histórico
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Próximas Aulas */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Próximas Aulas</CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingLessonsList lessons={upcomingLessons} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

**Arquivos a Criar:**

- Estrutura completa do `/student-portal`
- Migrations SQL para novas tabelas
- API endpoints separados
- Documentação de uso para alunos
- Guia de configuração

**Estimativa:** 24-32 horas

---

## 📊 Priorização

### Alta Prioridade (Implementar Primeiro)

1. **✅ Integração com Contratos** (90% completo)

   - Apenas testes finais pendentes
   - Impacto: Alto
   - Esforço: 2 horas

2. **🔄 Integração com Clientes**

   - Complementa funcionalidade de contratos
   - Impacto: Alto
   - Esforço: 4-6 horas

3. **🔔 Notificações no Header**
   - Melhora UX significativamente
   - Impacto: Médio-Alto
   - Esforço: 3-4 horas

### Média Prioridade (Implementar em Seguida)

4. **📊 Relatórios Detalhados**

   - Valor para gestão e tomada de decisão
   - Impacto: Alto
   - Esforço: 12-16 horas

5. **⚙️ Configurações de Instrutor**
   - Melhora gestão de disponibilidade
   - Impacto: Médio
   - Esforço: 10-14 horas

### Baixa Prioridade (Opcional)

6. **🤖 Job de Lembretes**

   - Automação útil mas não crítica
   - Impacto: Médio
   - Esforço: 6-8 horas

7. **👨‍🎓 Portal do Aluno**
   - Feature complexa, alto valor mas não essencial
   - Impacto: Alto (longo prazo)
   - Esforço: 24-32 horas

---

## ⏱️ Estimativas

### Resumo de Esforço

| Feature                          | Esforço (horas) | Prioridade |
| -------------------------------- | --------------- | ---------- |
| Integração com Contratos (final) | 2               | Alta       |
| Integração com Clientes          | 4-6             | Alta       |
| Notificações no Header           | 3-4             | Alta       |
| **Subtotal Alta Prioridade**     | **9-12**        | -          |
| Relatórios Detalhados            | 12-16           | Média      |
| Configurações de Instrutor       | 10-14           | Média      |
| **Subtotal Média Prioridade**    | **22-30**       | -          |
| Job de Lembretes                 | 6-8             | Baixa      |
| Portal do Aluno                  | 24-32           | Baixa      |
| **Subtotal Baixa Prioridade**    | **30-40**       | -          |
| **TOTAL GERAL**                  | **61-82**       | -          |

### Roadmap Sugerido

#### Sprint 1 (1 semana) - Completar Integrações

- ✅ Finalizar testes de Integração com Contratos
- 🔄 Implementar Integração com Clientes
- 🔔 Implementar Notificações no Header

**Entrega:** Sistema 100% integrado com módulos existentes

#### Sprint 2 (2 semanas) - Relatórios e Gestão

- 📊 Implementar Relatórios Detalhados
- ⚙️ Implementar Configurações de Instrutor

**Entrega:** Sistema com capacidades avançadas de gestão e análise

#### Sprint 3 (1-2 semanas) - Automação e Portal (Opcional)

- 🤖 Implementar Job de Lembretes
- 👨‍🎓 Implementar Portal do Aluno (se aprovado)

**Entrega:** Sistema completo com automação e self-service

---

## 📝 Notas Técnicas

### Dependências Externas

```json
{
  "dependencies": {
    "recharts": "^2.10.0",
    "xlsx": "^0.18.5",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.0"
  }
}
```

### Configurações Necessárias

1. **Supabase Edge Functions:**

   - Habilitar Edge Functions no projeto
   - Configurar variáveis de ambiente
   - Deploy de functions

2. **Cron Jobs:**

   - Habilitar extensão `pg_cron`
   - Configurar net.http_post
   - Testar execução manual

3. **Webhooks:**
   - Configurar endpoints N8N
   - Validar payloads
   - Implementar retry logic

### Considerações de Performance

- Implementar cache para relatórios pesados
- Usar índices apropriados em queries
- Paginar resultados de histórico
- Otimizar queries com muitos JOINs

### Segurança

- Validar permissões em todas as APIs
- Implementar rate limiting
- Sanitizar inputs de usuário
- Logs de auditoria para ações sensíveis

---

## 🎯 Conclusão

Este documento serve como guia para as próximas etapas de desenvolvimento do sistema. As features foram priorizadas com base em:

1. **Impacto no usuário**
2. **Esforço de implementação**
3. **Dependências técnicas**
4. **Valor de negócio**

> [!TIP]
> Recomenda-se começar pelas features de **Alta Prioridade** para completar as integrações essenciais antes de avançar para features mais complexas.

---

**Última Atualização:** 03/01/2026  
**Próxima Revisão:** Após conclusão do Sprint 1
