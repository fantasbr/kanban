import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import type { Stage } from '@/types/database'

interface StageEditModalProps {
  stage: Stage | null
  pipelineId: string
  open: boolean
  onClose: () => void
  onSave: (id: string | null, data: { pipeline_id: string; name: string; is_default?: boolean; is_won?: boolean }) => void
}

export function StageEditModal({ stage, pipelineId, open, onClose, onSave }: StageEditModalProps) {
  const [name, setName] = useState(stage?.name || '')
  const [isDefault, setIsDefault] = useState(stage?.is_default || false)
  const [isWon, setIsWon] = useState(stage?.is_won || false)

  // Update state when stage changes
  useEffect(() => {
    if (stage) {
      setName(stage.name)
      setIsDefault(stage.is_default)
      setIsWon(stage.is_won)
    }
  }, [stage])

  const handleSave = () => {
    onSave(stage?.id || null, {
      pipeline_id: pipelineId,
      name,
      is_default: isDefault,
      is_won: isWon,
    })
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setIsDefault(false)
    setIsWon(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {stage ? 'Editar Etapa' : 'Nova Etapa'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            {stage ? 'Atualize as informações da etapa' : 'Adicione uma nova etapa ao pipeline'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label htmlFor="stage-name" className="text-sm font-semibold text-slate-700">
              Nome da Etapa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="stage-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Novo Lead"
              className="h-11 border-slate-300"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-default"
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked as boolean)}
            />
            <Label
              htmlFor="is-default"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Etapa padrão para novos negócios
            </Label>
          </div>
          <p className="text-sm text-slate-500">
            Apenas uma etapa pode ser marcada como padrão por pipeline
          </p>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="is-won"
              checked={isWon}
              onCheckedChange={(checked) => setIsWon(checked as boolean)}
            />
            <Label
              htmlFor="is-won"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Etapa de negócio ganho/fechado
            </Label>
          </div>
          <p className="text-sm text-slate-500">
            Marque se esta etapa representa um negócio fechado com sucesso. Apenas uma etapa pode ser marcada como ganho por pipeline.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} className="px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {stage ? 'Salvar Alterações' : 'Criar Etapa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
