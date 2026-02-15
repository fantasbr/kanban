import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useKanban } from '@/hooks/useKanban'
import { useClientVerification } from '@/hooks/useClientVerification'
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
import { setPendingDealWon } from '@/lib/sessionHelpers'
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
  


  const navigate = useNavigate()

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
  
  const { findClientById, findClientByContact } = useClientVerification()

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
    let newStageId = over.id as string

    // Se soltou sobre outro card, pegar o stage_id desse card
    const overDeal = deals.find((d) => d.id === over.id)
    if (overDeal) {
      newStageId = overDeal.stage_id
    }

    const deal = deals.find((d) => d.id === dealId)
    if (deal && deal.stage_id !== newStageId) {
      handleStageChange(dealId, newStageId)
    }
  }
  
  const handleStageChange = (dealId: string, newStageId: string) => {
    const deal = deals.find((d) => d.id === dealId)
    const newStage = stages.find((s) => s.id === newStageId)
    
    // Verificar se é estágio ganho
    if (newStage?.is_won && deal) {
      // Verificar se deal tem cliente vinculado
      if (!deal.existing_client_id) {
        // Verificar se o contato já tem um cliente cadastrado
        const client = findClientByContact(deal.contact_id)
        
        if (client) {
          // Cliente já existe, apenas vincular ao deal
          updateDeal({ 
            dealId: deal.id, 
            updates: { existing_client_id: client.id } 
          })
          updateDealStage({ dealId, stageId: newStageId })
          navigate(`/erp/contracts?clientId=${client.id}&dealId=${dealId}`)
          return
        } else {
          // Redirecionar para página de clientes para cadastrar
          // Salvar dealId e stageId no sessionStorage para retomar depois
          const saved = setPendingDealWon({ dealId, stageId: newStageId })
          if (!saved) {
            console.error('Failed to save pending deal data')
          }
          navigate(`/erp/clients?contactId=${deal.contact_id}&fromDeal=${dealId}`)
          return
        }
      } else {
        // Cliente já vinculado, navegar direto para contratos
        const client = findClientById(deal.existing_client_id)
        if (client) {
          // Completar mudança de estágio
          updateDealStage({ dealId, stageId: newStageId })
          // Navegar para contratos com dealId
          navigate(`/erp/contracts?clientId=${client.id}&dealId=${dealId}`)
          return
        }
      }
    }
    
    // Mudança normal de estágio - usar RPC para garantir log
    updateDealStage({ dealId, stageId: newStageId })
    
    // Se for stage ganho ou perdendo status ganho, atualizar won_at separadamente
    if (newStage?.is_won || (!newStage?.is_won && deal?.won_at)) {
      const wonUpdate: Partial<Deal> = {
        won_at: newStage?.is_won ? new Date().toISOString() : null,
        stage_changed_at: new Date().toISOString()
      }
      updateDeal({ dealId, updates: wonUpdate })
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
        key={isCreateModalOpen ? 'open' : 'closed'}
        pipelineId={selectedPipelineId}
        stages={stages}
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createDeal}
      />

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Negócio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar o negócio "{deletingDeal?.contacts?.name}"?
              O negócio será ocultado do quadro mas poderá ser recuperado posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDeal}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
