import { useState } from 'react'
import { usePipelines } from '@/hooks/usePipelines'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PipelineEditModal } from './PipelineEditModal'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import type { Pipeline } from '@/types/database'

export function PipelineManager() {
  const { pipelines, createPipeline, updatePipeline, deletePipeline } = usePipelines()
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null)
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false)
  const [pipelineToDelete, setPipelineToDelete] = useState<Pipeline | null>(null)

  const handleCreatePipeline = () => {
    setEditingPipeline(null)
    setIsPipelineModalOpen(true)
  }

  const handleEditPipeline = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline)
    setIsPipelineModalOpen(true)
  }

  const handleSavePipeline = (id: string | null, data: { name: string; chatwoot_inbox_id: string }) => {
    if (id) {
      updatePipeline({ id, updates: data })
    } else {
      createPipeline(data)
    }
  }

  const handleDeleteClick = (pipeline: Pipeline) => {
    console.log('handleDeleteClick called with pipeline:', pipeline)
    setPipelineToDelete(pipeline)
  }

  const handleConfirmDelete = () => {
    if (pipelineToDelete) {
      console.log('User confirmed deletion, calling deletePipeline with id:', pipelineToDelete.id)
      deletePipeline(pipelineToDelete.id)
      setPipelineToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    console.log('User cancelled deletion')
    setPipelineToDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Pipelines List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pipelines</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Gerencie seus funis de vendas e suas etapas</p>
          </div>
          <Button onClick={handleCreatePipeline} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pipeline
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-all"
              >
                <h3 className="font-semibold text-slate-900">{pipeline.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Inbox: {pipeline.chatwoot_inbox_id}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditPipeline(pipeline)}
                    className="flex-1"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(pipeline)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {pipelines.length === 0 && (
            <p className="text-center text-slate-500 py-8">
              Nenhum pipeline criado. Clique em "Novo Pipeline" para começar.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Edit Modal */}
      <PipelineEditModal
        pipeline={editingPipeline}
        open={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        onSave={handleSavePipeline}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pipelineToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o pipeline <strong>"{pipelineToDelete?.name}"</strong>?
              <br />
              <br />
              Todos os deals e etapas associados serão permanentemente perdidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deletar Pipeline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
