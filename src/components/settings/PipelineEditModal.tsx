import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStages } from '@/hooks/useStages'
import { StageEditModal } from './StageEditModal'
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react'
import type { Pipeline, Stage } from '@/types/database'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface PipelineEditModalProps {
  pipeline: Pipeline | null
  open: boolean
  onClose: () => void
  onSave: (id: string | null, data: { name: string; chatwoot_inbox_id: string }) => void
}

function SortableStageItem({
  stage,
  index,
  onEdit,
  onDelete,
}: {
  stage: Stage
  index: number
  onEdit: (stage: Stage) => void
  onDelete: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border border-slate-200 rounded-lg p-3 hover:bg-slate-50 bg-white"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">
            {index + 1}. {stage.name}
          </span>
          {stage.is_default && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Padrão</span>
          )}
          {stage.is_won && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Ganho</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(stage)}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(stage.id)}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function PipelineEditModal({ pipeline, open, onClose, onSave }: PipelineEditModalProps) {
  const [name, setName] = useState(pipeline?.name || '')
  const [inboxId, setInboxId] = useState(pipeline?.chatwoot_inbox_id || '')
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
  const [isStageModalOpen, setIsStageModalOpen] = useState(false)

  const { stages, createStage, updateStage, deleteStage, reorderStages } = useStages(
    pipeline?.id || ''
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Update state when pipeline changes
  if (pipeline && (name !== pipeline.name || inboxId !== pipeline.chatwoot_inbox_id)) {
    setName(pipeline.name)
    setInboxId(pipeline.chatwoot_inbox_id)
  }

  const handleSave = () => {
    onSave(pipeline?.id || null, { name, chatwoot_inbox_id: inboxId })
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setInboxId('')
    setEditingStage(null)
    setIsStageModalOpen(false)
    onClose()
  }

  const handleAddStage = () => {
    setEditingStage(null)
    setIsStageModalOpen(true)
  }

  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage)
    setIsStageModalOpen(true)
  }

  const handleSaveStage = (id: string | null, data: { pipeline_id: string; name: string; is_default?: boolean; is_won?: boolean }) => {
    if (id) {
      updateStage({
        id,
        updates: data,
      })
    } else {
      createStage(data)
    }
    setIsStageModalOpen(false)
    setEditingStage(null)
  }

  const handleDeleteStage = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta etapa? Todos os deals nesta etapa podem ser afetados.')) {
      deleteStage(id)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id)
      const newIndex = stages.findIndex((s) => s.id === over.id)

      const newStages = arrayMove(stages, oldIndex, newIndex)

      // Update positions
      const updates = newStages.map((stage, index) => ({
        id: stage.id,
        position: index + 1,
      }))

      reorderStages(updates)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {pipeline ? 'Editar Pipeline' : 'Novo Pipeline'}
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {pipeline
              ? 'Atualize as informações do pipeline e gerencie suas etapas'
              : 'Crie um novo pipeline de vendas'}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Pipeline Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">Informações do Pipeline</h3>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
                Nome do Pipeline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Vendas Autoescola"
                className="h-11 border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inbox-id" className="text-sm font-semibold text-slate-700">
                Chatwoot Inbox ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="inbox-id"
                value={inboxId}
                onChange={(e) => setInboxId(e.target.value)}
                placeholder="Ex: inbox-1"
                className="h-11 border-slate-300"
              />
              <p className="text-sm text-slate-500">
                ID da caixa de entrada no Chatwoot associada a este pipeline
              </p>
            </div>
          </div>

          {/* Stages Management */}
          {pipeline && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">Etapas do Pipeline</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Arraste para reordenar as etapas
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddStage}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Etapa
                </Button>
              </div>

              {/* Stages List with Drag & Drop */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {stages.map((stage, index) => (
                      <SortableStageItem
                        key={stage.id}
                        stage={stage}
                        index={index}
                        onEdit={handleEditStage}
                        onDelete={handleDeleteStage}
                      />
                    ))}
                    {stages.length === 0 && (
                      <p className="text-center text-slate-500 py-4 text-sm">
                        Nenhuma etapa criada. Clique em "Nova Etapa" para começar.
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} className="px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || !inboxId.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {pipeline ? 'Salvar Alterações' : 'Criar Pipeline'}
          </Button>
        </div>

        {/* Stage Edit Modal */}
        {pipeline && (
          <StageEditModal
            stage={editingStage}
            pipelineId={pipeline.id}
            open={isStageModalOpen}
            onClose={() => {
              setIsStageModalOpen(false)
              setEditingStage(null)
            }}
            onSave={handleSaveStage}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
