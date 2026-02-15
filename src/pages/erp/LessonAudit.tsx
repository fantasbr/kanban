import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, RefreshCw, Filter, X, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { useLessonAudit, type LessonAuditEntry } from '@/hooks/useLessonAudit'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Input } from '@/components/ui/input'

const ACTION_LABELS: Record<string, string> = {
  created: 'Aula Criada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  no_show: 'Falta',
  scheduled: 'Reagendada',
}

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  no_show: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

export function LessonAudit() {
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  
  const { auditEntries, isLoading, refetch } = useLessonAudit({
    limit: 200,
    actions: selectedActions.length > 0 ? selectedActions : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  })

  const toggleFilter = (action: string) => {
    setSelectedActions(prev =>
      prev.includes(action)
        ? prev.filter(a => a !== action)
        : [...prev, action]
    )
  }

  const clearFilters = () => {
    setSelectedActions([])
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = selectedActions.length > 0 || startDate || endDate

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando auditoria...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoria de Aulas</h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de criação e alterações de aulas
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-lg">Filtros</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button onClick={clearFilters} variant="ghost" size="sm" className="gap-1">
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Type Filters */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Tipo de Ação
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                action="created"
                selected={selectedActions.includes('created')}
                onClick={() => toggleFilter('created')}
              />
              <FilterButton
                action="completed"
                selected={selectedActions.includes('completed')}
                onClick={() => toggleFilter('completed')}
              />
              <FilterButton
                action="cancelled"
                selected={selectedActions.includes('cancelled')}
                onClick={() => toggleFilter('cancelled')}
              />
              <FilterButton
                action="no_show"
                selected={selectedActions.includes('no_show')}
                onClick={() => toggleFilter('no_show')}
              />
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data Inicial
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data Final
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-slate-600 pt-2 border-t">
            Mostrando <span className="font-semibold">{auditEntries.length}</span> registros
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Auditoria</CardTitle>
          <CardDescription>
            Histórico completo de ações realizadas nas aulas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditEntries.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'Nenhum registro encontrado com os filtros aplicados'
                    : 'Nenhum registro de auditoria encontrado'}
                </p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="link" size="sm" className="mt-2">
                    Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {auditEntries.map((entry) => (
                <AuditEntryItem key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FilterButton({
  action,
  selected,
  onClick,
}: {
  action: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      variant={selected ? 'default' : 'outline'}
      size="sm"
      className="gap-2"
    >
      <ActionIcon action={action} size="sm" />
      {ACTION_LABELS[action]}
    </Button>
  )
}

function AuditEntryItem({ entry }: { entry: LessonAuditEntry }) {
  return (
    <div className="flex gap-4 pb-6 border-l-2 border-slate-200 pl-6 relative last:pb-0">
      {/* Icon */}
      <div className="absolute -left-3 top-0 bg-white">
        <ActionIcon action={entry.action} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={ACTION_COLORS[entry.action]}>
              {ACTION_LABELS[entry.action]}
            </Badge>
            {(entry.user_name || entry.user_email) && (
              <Badge variant="outline" className="text-xs">
                {entry.user_name || entry.user_email}
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(entry.performed_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {getAuditDescription(entry)}
          </p>
          <div className="text-sm text-slate-600 space-y-1">
            {getAuditDetails(entry)}
          </div>
        </div>

        {/* Reason/Notes */}
        {entry.reason && (
          <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-md">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {entry.action === 'cancelled' ? 'Motivo do Cancelamento' : 'Observações'}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{entry.reason}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionIcon({ action, size = 'default' }: { action: string; size?: 'sm' | 'default' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const containerClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'

  const icons: Record<string, React.ReactElement> = {
    created: <FileText className={`${sizeClass} text-blue-600`} />,
    completed: <CheckCircle2 className={`${sizeClass} text-green-600`} />,
    cancelled: <XCircle className={`${sizeClass} text-red-600`} />,
    no_show: <AlertCircle className={`${sizeClass} text-orange-600`} />,
    scheduled: <Calendar className={`${sizeClass} text-purple-600`} />,
  }

  return (
    <div className={`${containerClass} rounded-full bg-slate-50 border-2 border-white flex items-center justify-center`}>
      {icons[action] || <FileText className={`${sizeClass} text-slate-600`} />}
    </div>
  )
}

function getAuditDescription(entry: LessonAuditEntry): string {
  const lessonDate = format(new Date(entry.metadata.lesson_date), "dd/MM/yyyy")
  const lessonTime = entry.metadata.start_time

  switch (entry.action) {
    case 'created':
      return `Aula criada para ${lessonDate} às ${lessonTime}`
    case 'completed':
      return `Aula de ${lessonDate} às ${lessonTime} marcada como concluída`
    case 'cancelled':
      return `Aula de ${lessonDate} às ${lessonTime} cancelada`
    case 'no_show':
      return `Falta registrada na aula de ${lessonDate} às ${lessonTime}`
    default:
      return `Aula de ${lessonDate} às ${lessonTime} atualizada`
  }
}

function getAuditDetails(entry: LessonAuditEntry): React.ReactNode {
  const details = []

  if (entry.metadata.duration_minutes) {
    details.push(
      <div key="duration" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Duração: {entry.metadata.duration_minutes} minutos
      </div>
    )
  }

  if (entry.previous_status && entry.new_status) {
    details.push(
      <div key="status" className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{entry.previous_status}</Badge>
        →
        <Badge variant="outline" className="text-xs">{entry.new_status}</Badge>
      </div>
    )
  }

  details.push(
    <div key="id" className="text-xs text-slate-500">
      Aula ID: #{entry.lesson_id}
    </div>
  )

  return <>{details}</>
}
