import { useEffect, useState, useCallback } from 'react'
import { History, Calendar, User, Car, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import type { Lesson } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface LessonHistoryProps {
  clientId: number
}

const statusIcons = {
  scheduled: Clock,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: XCircle,
}

const statusColors = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
  no_show: 'bg-red-100 text-red-700',
}

const statusLabels = {
  scheduled: 'Agendada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  no_show: 'Falta',
}

export function LessonHistory({ clientId }: LessonHistoryProps) {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchLessonHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      // First, get all contract IDs for this client
      const { data: contracts } = await supabase
        .from('erp_contracts')
        .select('id')
        .eq('client_id', clientId)

      const contractIds = (contracts || [] as any[]).map((c) => c.id)

      if (contractIds.length === 0) {
        setLessons([])
        return
      }

      // Get contract items for these contracts
      const { data: items } = await supabase
        .from('erp_contract_items')
        .select('id')
        .in('contract_id', contractIds)

      const itemIds = (items || [] as any[]).map((i) => i.id)

      if (itemIds.length === 0) {
        setLessons([])
        return
      }

      // Get lessons for these contract items
      const { data: lessonsData, error } = await supabase
        .from('erp_lessons')
        .select(`
          *,
          instructors:erp_instructors(full_name),
          vehicles:erp_vehicles(model, plate)
        `)
        .in('contract_item_id', itemIds)
        .order('lesson_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50)

      if (error) throw error

      setLessons(lessonsData || [])
    } catch (error) {
      console.error('Error fetching lesson history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      fetchLessonHistory()
    }
  }, [clientId, fetchLessonHistory])

  const completedCount = lessons.filter((l) => l.status === 'completed').length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Histórico
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{completedCount}</span> aulas realizadas
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {lessons.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Nenhuma aula encontrada
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
            {lessons.map((lesson, index) => {
              const StatusIcon = statusIcons[lesson.status]
              const formattedDate = format(new Date(lesson.lesson_date), "dd/MM/yy", { locale: ptBR })
              
              return (
                <div
                  key={lesson.id}
                  className="rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-2">
                    {/* Number and Date */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">{formattedDate}</span>
                            <span className="text-xs text-muted-foreground">
                              {lesson.start_time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusColors[lesson.status]} variant="secondary">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusLabels[lesson.status]}
                      </Badge>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{(lesson.instructors as any)?.full_name || 'Sem instrutor'}</span>
                    </div>

                    {/* Vehicle */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Car className="h-3 w-3" />
                      <span>
                        {(lesson.vehicles as any)?.model || 'Sem veículo'} 
                        {(lesson.vehicles as any)?.plate && ` • ${(lesson.vehicles as any).plate}`}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
