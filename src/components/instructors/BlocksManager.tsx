
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { Badge } from '@/components/ui/badge'
import { useInstructorSettings } from '@/hooks/useInstructorSettings'
import { toast } from 'sonner'

interface BlocksManagerProps {
  instructorId: number
}

const BLOCK_REASONS = {
  vacation: { label: 'Férias', color: 'bg-blue-100 text-blue-700' },
  sick_leave: { label: 'Licença Médica', color: 'bg-red-100 text-red-700' },
  training: { label: 'Treinamento', color: 'bg-yellow-100 text-yellow-700' },
  other: { label: 'Outro', color: 'bg-gray-100 text-gray-700' },
}

export function BlocksManager({ instructorId }: BlocksManagerProps) {
  const { blocks, isLoading, addBlock, deleteBlock } = useInstructorSettings(instructorId)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newBlock, setNewBlock] = useState<{
    start_date: string
    end_date: string
    reason: 'vacation' | 'sick_leave' | 'training' | 'other'
    notes: string
  }>({
    start_date: '',
    end_date: '',
    reason: 'vacation',
    notes: '',
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addBlock.mutateAsync({
        instructor_id: instructorId,
        start_date: newBlock.start_date,
        end_date: newBlock.end_date,
        reason: newBlock.reason,
        notes: newBlock.notes || null,
        created_by: null
      })
      toast.success('Bloqueio adicionado com sucesso')
      setIsDialogOpen(false)
      setNewBlock({
        start_date: '',
        end_date: '',
        reason: 'vacation',
        notes: '',
      })
    } catch (error) {
      console.error('Error adding block:', error)
      toast.error('Erro ao adicionar bloqueio')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja remover este bloqueio?')) {
      try {
        await deleteBlock.mutateAsync(id)
        toast.success('Bloqueio removido')
      } catch {
        toast.error('Erro ao remover bloqueio')
      }
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Carregando bloqueios...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Bloqueios de Agenda</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie férias, folgas e outros períodos de indisponibilidade
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Bloqueio
        </Button>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 border border-dashed rounded-lg bg-muted/30 text-muted-foreground space-y-3">
            <div className="p-3 bg-muted/50 rounded-full">
              <Plus className="h-6 w-6 text-muted-foreground/50 rotate-45" />
            </div>
            <div className="text-center">
              <p className="font-medium">Nenhum bloqueio registrado</p>
              <p className="text-sm">O instrutor está disponível normalmente.</p>
            </div>
          </div>
        ) : (
          blocks.map((block) => (
            <div 
              key={block.id} 
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={BLOCK_REASONS[block.reason as keyof typeof BLOCK_REASONS]?.color}>
                    {BLOCK_REASONS[block.reason as keyof typeof BLOCK_REASONS]?.label || block.reason}
                  </Badge>
                  <span className="text-sm font-medium">
                    {format(new Date(block.start_date), "dd 'de' MMM", { locale: ptBR })} 
                    {' → '}
                    {format(new Date(block.end_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
                {block.notes && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                     <span className="w-1 h-1 rounded-full bg-muted-foreground/50 inline-block"/> 
                     {block.notes}
                  </p>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-destructive transition-colors h-8 w-8"
                onClick={() => handleDelete(block.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Novo Bloqueio</DialogTitle>
              <DialogDescription>
                Registre um período de indisponibilidade para o instrutor
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Início</Label>
                  <Input
                    id="start_date"
                    type="date"
                    required
                    value={newBlock.start_date}
                    onChange={(e) => setNewBlock({ ...newBlock, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Fim</Label>
                  <Input
                    id="end_date"
                    type="date"
                    required
                    value={newBlock.end_date}
                    onChange={(e) => setNewBlock({ ...newBlock, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Select
                  value={newBlock.reason}
                  onValueChange={(value: 'vacation' | 'sick_leave' | 'training' | 'other') => setNewBlock({ ...newBlock, reason: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Férias</SelectItem>
                    <SelectItem value="sick_leave">Licença Médica</SelectItem>
                    <SelectItem value="training">Treinamento</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={newBlock.notes}
                  onChange={(e) => setNewBlock({ ...newBlock, notes: e.target.value })}
                  placeholder="Detalhes opcionais..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Adicionar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
