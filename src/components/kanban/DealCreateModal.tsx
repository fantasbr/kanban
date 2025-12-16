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
import type { Priority, Stage, Contact } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { useDealTitles } from '@/hooks/useDealTitles'
import { useContacts } from '@/hooks/useContacts'
import { Search, X } from 'lucide-react'

interface DealCreateModalProps {
  pipelineId: string
  stages: Stage[]
  open: boolean
  onClose: () => void
  onCreate: (data: {
    pipeline_id: string
    stage_id: string
    title: string
    deal_value_negotiated: number
    priority: Priority
    contact_id?: number | null
  }) => void
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
]

export function DealCreateModal({
  pipelineId,
  stages,
  open,
  onClose,
  onCreate,
}: DealCreateModalProps) {
  const { data: dealTitles, isLoading: isLoadingTitles } = useDealTitles()
  const { contacts, searchQuery, setSearchQuery } = useContacts()
  const [title, setTitle] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [stageId, setStageId] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactDropdown, setShowContactDropdown] = useState(false)

  // Set default stage when stages load or modal opens
  useEffect(() => {
    if (open && stages.length > 0 && !stageId) {
      const defaultStage = stages.find((s) => s.is_default) || stages[0]
      setStageId(defaultStage.id)
    }
  }, [open, stages, stageId])

  // Handle title change and update deal value
  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    const selectedDealTitle = dealTitles?.find((dt) => dt.title === newTitle)
    if (selectedDealTitle?.value_default && !dealValue) {
      setDealValue(selectedDealTitle.value_default.toString())
    }
  }

  const handleCreate = () => {
    if (!title.trim() || !dealValue || !stageId) return

    onCreate({
      pipeline_id: pipelineId,
      stage_id: stageId,
      title,
      deal_value_negotiated: parseFloat(dealValue),
      priority,
      contact_id: selectedContact?.id || null,
    })

    // Reset form
    setTitle('')
    setDealValue('')
    setPriority('medium')
    setStageId(stages.find((s) => s.is_default)?.id || stages[0]?.id || '')
    setSelectedContact(null)
    setSearchQuery('')
    onClose()
  }

  const selectedDealTitle = dealTitles?.find((dt) => dt.title === title)
  const defaultValue = selectedDealTitle?.value_default

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Novo Negócio
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre um novo negócio no pipeline
          </p>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Título do Negócio <span className="text-red-500">*</span>
            </Label>
            <Select value={title} onValueChange={handleTitleChange}>
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
                  Valor padrão: <strong>{formatCurrency(defaultValue)}</strong>
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

          {/* Stage */}
          <div className="space-y-2">
            <Label htmlFor="stage" className="text-sm font-semibold text-slate-700">
              Estágio Inicial <span className="text-red-500">*</span>
            </Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger id="stage" className="h-11 border-slate-300">
                <SelectValue placeholder="Selecione o estágio inicial" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5} className="bg-white border-slate-200">
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                    {stage.is_default && (
                      <span className="ml-2 text-xs text-blue-600">(Padrão)</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contact Search */}
          <div className="space-y-2">
            <Label htmlFor="contact-search" className="text-sm font-semibold text-slate-700">
              Contato (Opcional)
            </Label>
            {selectedContact ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                {selectedContact.profile_url ? (
                  <img
                    src={selectedContact.profile_url}
                    alt={selectedContact.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{selectedContact.name}</p>
                  {selectedContact.phone && (
                    <p className="text-xs text-slate-500 truncate">{selectedContact.phone}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    setSelectedContact(null)
                    setSearchQuery('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="contact-search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowContactDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowContactDropdown(searchQuery.length > 0)}
                  placeholder="Buscar contato por nome, telefone ou email..."
                  className="h-11 pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                />
                {showContactDropdown && contacts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {contacts.slice(0, 5).map((contact) => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => {
                          setSelectedContact(contact)
                          setSearchQuery('')
                          setShowContactDropdown(false)
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        {contact.profile_url ? (
                          <img
                            src={contact.profile_url}
                            alt={contact.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{contact.name}</p>
                          {contact.phone && (
                            <p className="text-xs text-slate-500 truncate">{contact.phone}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
            onClick={handleCreate}
            disabled={!title.trim() || !dealValue || !stageId}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Criar Negócio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
