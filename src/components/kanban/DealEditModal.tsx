import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Progress } from '@/components/ui/progress'
import type { Deal, Priority, Stage } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { ExternalLink, Calendar } from 'lucide-react'
import { useDealTitles } from '@/hooks/useDealTitles'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'

interface DealEditModalProps {
  deal: Deal | null
  stages: Stage[]
  open: boolean
  onClose: () => void
  onSave: (dealId: string, updates: Partial<Deal>) => void
}

const priorityOptions: { value: Priority; label: string; variant: 'default' | 'secondary' | 'destructive' }[] = [
  { value: 'low', label: 'Baixa', variant: 'secondary' },
  { value: 'medium', label: 'Média', variant: 'default' },
  { value: 'high', label: 'Alta', variant: 'destructive' },
]

export function DealEditModal({ deal, stages, open, onClose, onSave }: DealEditModalProps) {
  const { chatwootUrl } = useChatwootUrl()
  const { data: dealTitles, isLoading: isLoadingTitles } = useDealTitles()
  const [title, setTitle] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')

  useEffect(() => {
    if (deal) {
      setTitle(deal.title)
      setDealValue(deal.deal_value_negotiated.toString())
      setPriority(deal.priority)
    }
  }, [deal])

  const handleSave = () => {
    if (!deal) return

    onSave(deal.id, {
      title,
      deal_value_negotiated: parseFloat(dealValue),
      priority,
    })
    onClose()
  }

  if (!deal) return null
  
  // Find the selected title's default value
  const selectedDealTitle = dealTitles?.find(dt => dt.title === title)
  const defaultValue = selectedDealTitle?.value_default
  
  // Calculate progress based on current stage position
  const currentStageIndex = stages.findIndex((s) => s.id === deal.stage_id)
  const progressPercentage = stages.length > 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0
  const currentStage = stages.find((s) => s.id === deal.stage_id)

  // Format creation date
  const createdDate = new Date(deal.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  // Format updated date
  const updatedDate = new Date(deal.updated_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">Editar Negócio</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Atualize as informações do negócio</p>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Progress Bar */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">Progresso no Pipeline</Label>
              <span className="text-sm font-medium text-blue-600">
                {currentStageIndex + 1} de {stages.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{stages[0]?.name || 'Início'}</span>
              <span className="font-semibold text-slate-700">{currentStage?.name}</span>
              <span>{stages[stages.length - 1]?.name || 'Fim'}</span>
            </div>
          </div>

          {/* Contact Info */}
          {deal.contacts && (
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              {deal.contacts.profile_url ? (
                <img
                  src={deal.contacts.profile_url}
                  alt={deal.contacts.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                  {deal.contacts.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{deal.contacts.name}</p>
                {deal.contacts.phone && (
                  <p className="text-sm text-slate-500">{deal.contacts.phone}</p>
                )}
              </div>
              {deal.chatwoot_conversation_id && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    window.open(
                      `${chatwootUrl}/app/accounts/1/conversations/${deal.chatwoot_conversation_id}`,
                      '_blank'
                    )
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Chatwoot
                </Button>
              )}
            </div>
          )}

          {/* Created and Updated Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <Calendar className="h-4 w-4 text-slate-400" />
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Criado em</span>
                <span className="font-medium">{createdDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs text-blue-600">Última alteração</span>
                <span className="font-medium text-blue-700">{updatedDate}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
                Título do Negócio <span className="text-red-500">*</span>
              </Label>
              <Select value={title} onValueChange={setTitle}>
                <SelectTrigger id="title" className="h-11 border-slate-300">
                  <SelectValue placeholder="Selecione o título do negócio" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="bg-white border-slate-200">
                  {isLoadingTitles ? (
                    <div className="p-2 text-sm text-slate-500">Carregando...</div>
                  ) : dealTitles && dealTitles.length > 0 ? (
                    dealTitles.map((dealTitle) => (
                      <SelectItem key={dealTitle.id} value={dealTitle.title}>
                        {dealTitle.title}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-slate-500">
                      Nenhum título cadastrado. Configure em Configurações.
                    </div>
                  )}
                </SelectContent>
              </Select>
              {defaultValue && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-blue-700">
                    Valor padrão deste título: <strong>{formatCurrency(defaultValue)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Deal Value */}
            <div className="space-y-2">
              <Label htmlFor="deal-value" className="text-sm font-semibold text-slate-700">
                Valor Negociado <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deal-value"
                type="number"
                step="0.01"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="0.00"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-sm text-slate-500">
                Valor atual: <span className="font-semibold text-blue-600">{formatCurrency(deal.deal_value_negotiated)}</span>
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold text-slate-700">
                Prioridade
              </Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger id="priority" className="h-11 border-slate-300">
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="bg-white border-slate-200">
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Summary */}
            {deal.ai_summary && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Resumo da IA</Label>
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-slate-700">
                  {deal.ai_summary}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!title.trim() || !dealValue}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
