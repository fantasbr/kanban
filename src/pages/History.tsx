import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserPlus, FileText, ArrowRight, RefreshCw, Filter, TestTube, Calendar, X } from 'lucide-react'
import { useActivityHistory } from '@/hooks/useActivityHistory'
import type { Activity, ActivityType } from '@/types/activity'
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPE_COLORS } from '@/types/activity'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useKanban } from '@/hooks/useKanban'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export function History() {
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  
  const { pipelines } = useKanban('')
  
  const { activities, isLoading, refetch } = useActivityHistory({
    limit: 100,
    activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
  })

  const testAuthContext = async () => {
    try {
      const { data, error } = await supabase.rpc('test_auth_context')
      
      if (error) {
        toast.error(`Erro: ${error.message}`)
        console.error('Auth test error:', error)
        return
      }
      
      if (data && data.length > 0) {
        const authData = data[0]
        toast.success(`✅ Auth OK: ${authData.user_email || authData.user_id || 'Sem dados'}`)
        console.log('Auth context:', authData)
      } else {
        toast.warning('⚠️ Auth retornou vazio')
        console.log('Auth context:', data)
      }
    } catch (err) {
      toast.error(`Exceção: ${err}`)
      console.error('Auth test exception:', err)
    }
  }

  const toggleFilter = (type: ActivityType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const clearFilters = () => {
    setSelectedTypes([])
    setSelectedPipeline('all')
    setStartDate('')
    setEndDate('')
  }

  // Aplicar filtros de pipeline e data
  const filteredActivities = activities.filter(activity => {
    // Filtro de pipeline
    if (selectedPipeline !== 'all') {
      const pipelineName = activity.metadata?.pipeline_name
      if (!pipelineName || pipelineName !== selectedPipeline) {
        return false
      }
    }

    // Filtro de data
    const activityDate = new Date(activity.created_at)
    
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      if (activityDate < start) return false
    }
    
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      if (activityDate > end) return false
    }

    return true
  })

  const hasActiveFilters = selectedTypes.length > 0 || selectedPipeline !== 'all' || startDate || endDate

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando histórico...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Atividades</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as ações realizadas no sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={testAuthContext} variant="outline" className="gap-2">
            <TestTube className="h-4 w-4" />
            Testar Auth
          </Button>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
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
          {/* Activity Type Filters */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Tipo de Atividade
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                type="contact_created"
                selected={selectedTypes.includes('contact_created')}
                onClick={() => toggleFilter('contact_created')}
              />
              <FilterButton
                type="deal_created"
                selected={selectedTypes.includes('deal_created')}
                onClick={() => toggleFilter('deal_created')}
              />
              <FilterButton
                type="deal_stage_changed"
                selected={selectedTypes.includes('deal_stage_changed')}
                onClick={() => toggleFilter('deal_stage_changed')}
              />
            </div>
          </div>

          {/* Pipeline Filter */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Pipeline
            </label>
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos os pipelines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os pipelines</SelectItem>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.name}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            Mostrando <span className="font-semibold">{filteredActivities.length}</span> de{' '}
            <span className="font-semibold">{activities.length}</span> atividades
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline de Atividades</CardTitle>
          <CardDescription>
            Histórico completo de ações no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? 'Nenhuma atividade encontrada com os filtros aplicados'
                    : 'Nenhuma atividade encontrada'}
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
              {filteredActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function FilterButton({
  type,
  selected,
  onClick,
}: {
  type: ActivityType
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
      <ActivityIcon type={type} size="sm" />
      {ACTIVITY_TYPE_LABELS[type]}
    </Button>
  )
}

function ActivityItem({ activity }: { activity: Activity }) {
  return (
    <div className="flex gap-4 pb-6 border-l-2 border-slate-200 pl-6 relative last:pb-0">
      {/* Icon */}
      <div className="absolute -left-3 top-0 bg-white">
        <ActivityIcon type={activity.activity_type} />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={ACTIVITY_TYPE_COLORS[activity.activity_type]}>
              {ACTIVITY_TYPE_LABELS[activity.activity_type]}
            </Badge>
            {activity.user_email && (
              <Badge variant="outline" className="text-xs">
                {activity.user_email}
              </Badge>
            )}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {getActivityDescription(activity)}
          </p>
          <div className="text-sm text-slate-600">
            {getActivityDetails(activity)}
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityIcon({ type, size = 'default' }: { type: ActivityType; size?: 'sm' | 'default' }) {
  const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
  const containerClass = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'

  const icons = {
    contact_created: <UserPlus className={`${sizeClass} text-green-600`} />,
    deal_created: <FileText className={`${sizeClass} text-blue-600`} />,
    deal_stage_changed: <ArrowRight className={`${sizeClass} text-orange-600`} />,
    deal_updated: <FileText className={`${sizeClass} text-purple-600`} />,
  }

  return (
    <div className={`${containerClass} rounded-full bg-slate-50 border-2 border-white flex items-center justify-center`}>
      {icons[type]}
    </div>
  )
}

function getActivityDescription(activity: Activity): string {
  const { activity_type, metadata } = activity

  switch (activity_type) {
    case 'contact_created':
      return `Novo contato criado: ${metadata.contact_name || 'Sem nome'}`
    
    case 'deal_created':
      return `Novo deal criado: ${metadata.deal_title || 'Sem título'}`
    
    case 'deal_stage_changed':
      return `Deal "${metadata.deal_title}" mudou de stage`
    
    case 'deal_updated':
      return `Deal "${metadata.deal_title}" foi atualizado`
    
    default:
      return 'Atividade registrada'
  }
}

function getActivityDetails(activity: Activity): React.ReactNode {
  const { activity_type, metadata } = activity

  switch (activity_type) {
    case 'contact_created':
      return (
        <div className="space-y-1">
          {metadata.phone && <div>📱 {metadata.phone}</div>}
          {metadata.email && <div>📧 {metadata.email}</div>}
        </div>
      )
    
    case 'deal_created':
      return (
        <div className="space-y-1">
          {metadata.pipeline_name && <div>📊 Pipeline: {metadata.pipeline_name}</div>}
          {metadata.stage_name && <div>📍 Stage: {metadata.stage_name}</div>}
          {metadata.contact_name && <div>👤 Contato: {metadata.contact_name}</div>}
          {metadata.deal_value && (
            <div>💰 Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(metadata.deal_value)}</div>
          )}
        </div>
      )
    
    case 'deal_stage_changed':
      return (
        <div className="space-y-1">
          {metadata.contact_name && <div>👤 Contato: {metadata.contact_name}</div>}
          {metadata.pipeline_name && <div>📊 Pipeline: {metadata.pipeline_name}</div>}
          {metadata.old_stage_name && metadata.new_stage_name && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{metadata.old_stage_name}</Badge>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <Badge variant="outline" className="text-xs">{metadata.new_stage_name}</Badge>
            </div>
          )}
        </div>
      )
    
    default:
      return null
  }
}
