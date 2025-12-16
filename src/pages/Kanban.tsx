import { useState } from 'react'
import { useKanban } from '@/hooks/useKanban'
import { cn } from '@/lib/utils'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { StageColumn } from '@/components/kanban/StageColumn'
import { DealCard } from '@/components/kanban/DealCard'
import { DealEditModal } from '@/components/kanban/DealEditModal'
import { DealCreateModal } from '@/components/kanban/DealCreateModal'
import type { Deal } from '@/types/database'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function Kanban() {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('')
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingDeal, setDeletingDeal] = useState<Deal | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const {
    pipelines,
    pipelinesLoading,
    stages,
    stagesLoading,
    deals,
    dealsLoading,
    updateDealStage,
    updateDeal,
    createDeal,
    deleteDeal,
  } = useKanban(selectedPipelineId)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Set default pipeline when pipelines load
  if (pipelines.length > 0 && !selectedPipelineId) {
    setSelectedPipelineId(pipelines[0].id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id)
    setActiveDeal(deal || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const dealId = active.id as string
    const newStageId = over.id as string

    const deal = deals.find((d) => d.id === dealId)
    if (deal && deal.stage_id !== newStageId) {
      updateDealStage({ dealId, stageId: newStageId })
    }
  }

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setIsEditModalOpen(true)
  }

  const handleSaveDeal = (dealId: string, updates: Partial<Deal>) => {
    updateDeal({ dealId, updates })
  }

  const handleDeleteDeal = (deal: Deal) => {
    setDeletingDeal(deal)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteDeal = () => {
    if (deletingDeal) {
      deleteDeal({ dealId: deletingDeal.id })
      setDeletingDeal(null)
      setIsDeleteDialogOpen(false)
    }
  }

  if (pipelinesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-slate-500">Carregando pipelines...</p>
        </div>
      </div>
    )
  }

  if (pipelines.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium">Nenhum pipeline disponível</p>
          <p className="text-sm text-slate-500 mt-1">
            Você não tem acesso a nenhum pipeline no momento.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Kanban</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie seus leads e oportunidades</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!selectedPipelineId || stages.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Negócio
        </Button>
      </div>

      {/* Pipeline Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-1">
        <div className="flex gap-1">
          {pipelines.map((pipeline) => (
            <button
              key={pipeline.id}
              onClick={() => setSelectedPipelineId(pipeline.id)}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200',
                selectedPipelineId === pipeline.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              {pipeline.name}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      {stagesLoading || dealsLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
            <p className="mt-2 text-sm text-slate-500">Carregando quadro...</p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                deals={deals}
                onEditDeal={handleEditDeal}
                onDeleteDeal={handleDeleteDeal}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? (
              <DealCard deal={activeDeal} onEdit={() => {}} onDelete={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Edit Modal */}
      <DealEditModal
        deal={editingDeal}
        stages={stages}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveDeal}
      />

      {/* Create Modal */}
      <DealCreateModal
        pipelineId={selectedPipelineId}
        stages={stages}
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createDeal}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o negócio "{deletingDeal?.title}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDeal}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
