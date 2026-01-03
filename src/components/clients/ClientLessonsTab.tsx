import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Calendar, TrendingUp, XCircle, Clock, Plus, Gift } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { LessonStatusBadge } from '@/components/lessons/LessonStatusBadge'
import { LessonCreateModal } from '@/components/lessons/LessonCreateModal'
import { LessonDetailsModal } from '@/components/lessons/LessonDetailsModal'
import { AddExtraCreditsModal } from '@/components/contracts/AddExtraCreditsModal'
import type { Lesson } from '@/types/database'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientLessonsTabProps {
  clientId: number
}

export function ClientLessonsTab({ clientId }: ClientLessonsTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isExtraCreditsModalOpen, setIsExtraCreditsModalOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  // Fetch all lessons for this client across all contracts
  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['client-lessons', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_lessons')
        .select(`
          *,
          contract_items:erp_contract_items(
            id,
            description,
            contracts:erp_contracts(
              id,
              contract_number,
              status,
              client_id
            )
          ),
          instructors:erp_instructors(full_name),
          vehicles:erp_vehicles(model, plate)
        `)
        .eq('contract_items.contracts.client_id', clientId)
        .order('lesson_date', { ascending: false })
        .order('start_time', { ascending: false })

      if (error) throw error
      return (data || []) as Lesson[]
    },
  })

  // Fetch active contracts for this client
  const { data: activeContracts = [] } = useQuery({
    queryKey: ['client-active-contracts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contracts')
        .select('id, contract_number, status')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  // Calculate statistics
  const stats = {
    total: lessons.length,
    completed: lessons.filter((l) => l.status === 'completed').length,
    noShow: lessons.filter((l) => l.status === 'no_show').length,
    scheduled: lessons.filter((l) => l.status === 'scheduled').length,
    attendanceRate:
      lessons.filter((l) => l.status === 'completed' || l.status === 'no_show').length > 0
        ? Math.round(
            (lessons.filter((l) => l.status === 'completed').length /
              lessons.filter((l) => l.status === 'completed' || l.status === 'no_show').length) *
              100
          )
        : 0,
  }

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setIsDetailsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Carregando aulas...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total de Aulas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total de Aulas</p>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Presença */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Taxa de Presença</p>
                <p className="text-2xl font-bold text-green-600">{stats.attendanceRate}%</p>
                <p className="text-xs text-slate-400 mt-1">
                  {stats.completed} de {stats.completed + stats.noShow} aulas
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Faltas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Faltas</p>
                <p className="text-2xl font-bold text-red-600">{stats.noShow}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Aulas Agendadas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Agendadas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Agendar Nova Aula
        </Button>
      </div>

      {/* Active Contracts - Extra Credits */}
      {activeContracts.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contratos Ativos</h3>
            <div className="space-y-3">
              {activeContracts.map((contract: any) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{contract.contract_number}</p>
                    <p className="text-sm text-slate-500">Status: Ativo</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedContractId(contract.id)
                      setIsExtraCreditsModalOpen(true)
                    }}
                    variant="outline"
                    className="gap-2 border-green-600 text-green-600 hover:bg-green-50"
                  >
                    <Gift className="h-4 w-4" />
                    Comprar Aulas Extras
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lesson History Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Histórico de Aulas</h3>
          {lessons.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma aula registrada</p>
              <p className="text-sm text-slate-400 mt-1">
                Clique em "Agendar Nova Aula" para começar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Data/Hora</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Contrato</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Item</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Instrutor</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Veículo</th>
                    <th className="text-left p-3 text-sm font-medium text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="border-b hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => handleLessonClick(lesson)}
                    >
                      <td className="p-3">
                        <div className="text-sm font-medium">
                          {format(new Date(lesson.lesson_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {lesson.start_time} - {lesson.end_time}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {(lesson.contract_items as any)?.contracts?.contract_number || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-slate-600">
                          {(lesson.contract_items as any)?.description || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{(lesson.instructors as any)?.full_name || '-'}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {(lesson.vehicles as any)?.model || '-'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {(lesson.vehicles as any)?.plate || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <LessonStatusBadge status={lesson.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <LessonCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        prefilledClientId={clientId}
      />

      {selectedLesson && (
        <LessonDetailsModal
          lesson={selectedLesson}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
          contractStatus={(selectedLesson.contract_items as any)?.contracts?.status}
        />
      )}

      {selectedContractId && (
        <AddExtraCreditsModal
          open={isExtraCreditsModalOpen}
          onOpenChange={setIsExtraCreditsModalOpen}
          contractId={selectedContractId}
        />
      )}
    </div>
  )
}
