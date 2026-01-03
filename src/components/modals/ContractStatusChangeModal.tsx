import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CONTRACT_STATUS_LABELS, type ContractStatus } from '@/types/contract'
import { toast } from 'sonner'

interface ContractStatusChangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus: ContractStatus
  contractId: number
  onStatusChange: (newStatus: ContractStatus, reason: string) => void
  isUpdating?: boolean
}

export function ContractStatusChangeModal({
  open,
  onOpenChange,
  currentStatus,
  contractId,
  onStatusChange,
  isUpdating = false,
}: ContractStatusChangeModalProps) {
  const [newStatus, setNewStatus] = useState<ContractStatus>(currentStatus)
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validations
    if (newStatus === currentStatus) {
      toast.error('Selecione um status diferente do atual')
      return
    }

    if (!reason.trim()) {
      toast.error('Justificativa é obrigatória')
      return
    }

    if (reason.trim().length < 10) {
      toast.error('Justificativa deve ter no mínimo 10 caracteres')
      return
    }

    onStatusChange(newStatus, reason.trim())
  }

  const handleClose = () => {
    setNewStatus(currentStatus)
    setReason('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Alterar Status do Contrato</DialogTitle>
            <DialogDescription>
              Informe o novo status e a justificativa para a mudança
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Status */}
            <div className="space-y-2">
              <Label>Status Atual</Label>
              <div className="p-2 bg-slate-100 rounded-md text-sm font-medium">
                {CONTRACT_STATUS_LABELS[currentStatus]}
              </div>
            </div>

            {/* New Status */}
            <div className="space-y-2">
              <Label htmlFor="newStatus">Novo Status *</Label>
              <Select
                value={newStatus}
                onValueChange={(value: ContractStatus) => setNewStatus(value)}
              >
                <SelectTrigger id="newStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Justificativa *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Descreva o motivo da mudança de status..."
                rows={4}
                required
                minLength={10}
              />
              <p className="text-xs text-slate-500">
                Mínimo 10 caracteres ({reason.length}/10)
              </p>
            </div>

            {/* Warning */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Atenção:</strong> Esta mudança será registrada no histórico de auditoria
                com seu nome, data/hora e justificativa.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Atualizando...' : 'Confirmar Mudança'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
