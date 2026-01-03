import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, Plus, TrendingUp, AlertCircle, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { LessonStatusBadge } from '@/components/lessons/LessonStatusBadge'
import { LessonCreateModal } from '@/components/lessons/LessonCreateModal'
import { LessonDetailsModal } from '@/components/lessons/LessonDetailsModal'
import { AddExtraCreditsModal } from '@/components/contracts/AddExtraCreditsModal'
import type { Contract, ContractItem, Lesson } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContractLessonsTabProps {
  contract: Contract
  items: ContractItem[]
}

export function ContractLessonsTab({ contract, items }: ContractLessonsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isExtraCreditsModalOpen, setIsExtraCreditsModalOpen] = useState(false)
  const [selectedContractItemId, setSelectedContractItemId] = useState<number | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Check if contract is active
  const isContractActive = contract.status === 'active'

  // Load contract items with catalog information
  const { data: contractItemsWithCatalog = [] } = useQuery({
    queryKey: ['contract-items-with-catalog', contract.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_items')
        .select(`
          *,
          catalog_items:erp_contract_items_catalog(
            is_lesson,
            vehicle_category
          )
        `)
        .eq('contract_id', contract.id)

      if (error) throw error
      return data || []
    },
  })

  // Filter only lesson items using catalog info
  const lessonItems = contractItemsWithCatalog.filter((item: any) => 
    item.catalog_items?.is_lesson === true
  )

  // Fetch all lessons for this contract's lesson items
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['contract-lessons', contract.id, lessonItems.length],
    queryFn: async () => {
      // Double-check lessonItems is not empty
      if (!lessonItems || lessonItems.length === 0) {
        return []
      }

      const itemIds = lessonItems.map((i: any) => i.id)

      if (itemIds.length === 0) return []

      const { data, error } = await supabase
        .from('erp_lessons')
        .select(`
          *,
          instructors(full_name),
          vehicles(model, plate)
        `)
        .in('contract_item_id', itemIds)
        .order('lesson_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: lessonItems.length > 0,
  })

  // Calculate progress for each item
  const getItemProgress = (itemId: number, totalQuantity: number) => {
    const completedLessons = lessons.filter(
      (l) => l.contract_item_id === itemId && l.status === 'completed'
    ).length

    return {
      completed: completedLessons,
      total: totalQuantity,
      percentage: totalQuantity > 0 ? (completedLessons / totalQuantity) * 100 : 0,
    }
  }

  const handleScheduleLesson = (itemId: number) => {
    setSelectedContractItemId(itemId)
    setIsCreateModalOpen(true)
  }

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setIsDetailsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Non-Active Contract Alert */}
      {!isContractActive && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100">
                Contrato {contract.status === 'completed' ? 'Concluído' : 'Inativo'}
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Este contrato está em modo somente leitura. Não é possível agendar novas aulas ou alterar o status de aulas existentes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress by Item */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresso por Item de Aula
          </h3>
          {isContractActive && (
            <Button
              onClick={() => setIsExtraCreditsModalOpen(true)}
              variant="outline"
              className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
            >
              <Gift className="h-4 w-4" />
              Comprar Aulas Extras
            </Button>
          )}
        </div>
        {lessonItems.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Este contrato não possui itens de aula configurados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Initial Items */}
            {lessonItems.filter((item: any) => !item.is_extra).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Pacote Inicial
                </h4>
                {lessonItems.filter((item: any) => !item.is_extra).map((item: any) => {
                  const progress = getItemProgress(item.id, item.quantity)
                  const isCompleted = progress.completed >= progress.total

                  return (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {/* Item Info */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{item.description}</h4>
                              <p className="text-sm text-muted-foreground">
                                {progress.completed} de {progress.total} aulas (
                                {Math.round(progress.percentage)}%)
                              </p>
                            </div>
                            {isCompleted ? (
                              <span className="text-sm text-green-600 font-medium">✓ Concluído</span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleScheduleLesson(item.id)}
                                disabled={!isContractActive}
                                className="shrink-0"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Agendar Aula
                              </Button>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <Progress value={progress.percentage} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Extra Items */}
            {lessonItems.filter((item: any) => item.is_extra).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wide flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Aulas Extras
                </h4>
                {lessonItems.filter((item: any) => item.is_extra).map((item: any) => {
                  const progress = getItemProgress(item.id, item.quantity)
                  const isCompleted = progress.completed >= progress.total

                  return (
                    <Card key={item.id} className="border-green-200 bg-green-50/30">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          {/* Item Info */}
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.description}</h4>
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                  EXTRA
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {progress.completed} de {progress.total} aulas (
                                {Math.round(progress.percentage)}%)
                              </p>
                            </div>
                            {isCompleted ? (
                              <span className="text-sm text-green-600 font-medium">✓ Concluído</span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleScheduleLesson(item.id)}
                                disabled={!isContractActive}
                                className="shrink-0"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Agendar Aula
                              </Button>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <Progress value={progress.percentage} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lessons List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Histórico de Aulas
        </h3>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Carregando aulas...
            </CardContent>
          </Card>
        ) : lessons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma aula agendada para este contrato
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Data</th>
                      <th className="text-left p-3 text-sm font-medium">Hora</th>
                      <th className="text-left p-3 text-sm font-medium">Instrutor</th>
                      <th className="text-left p-3 text-sm font-medium">Veículo</th>
                      <th className="text-left p-3 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((lesson) => (
                      <tr
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="p-3 text-sm">
                          {format(new Date(lesson.lesson_date), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </td>
                        <td className="p-3 text-sm">{lesson.start_time}</td>
                        <td className="p-3 text-sm">
                          {(lesson.instructors as any)?.full_name || '-'}
                        </td>
                        <td className="p-3 text-sm">
                          {(lesson.vehicles as any)?.model || '-'}
                        </td>
                        <td className="p-3">
                          <LessonStatusBadge status={lesson.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <LessonCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        prefilledClientId={contract.client_id}
        prefilledContractId={contract.id}
        prefilledContractItemId={selectedContractItemId ?? undefined}
      />

      <LessonDetailsModal
        lesson={selectedLesson}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        contractStatus={contract.status}
      />

      <AddExtraCreditsModal
        open={isExtraCreditsModalOpen}
        onOpenChange={setIsExtraCreditsModalOpen}
        contractId={contract.id}
      />
    </div>
  )
}
