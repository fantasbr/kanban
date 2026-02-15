import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import type { Priority, Stage, DealItem } from '@/types/database'
import { useContractTypes } from '@/hooks/useERPConfig'
import { useCompanies } from '@/hooks/useCompanies'
import { useContacts } from '@/hooks/useContacts'
import { ContactCreateModal } from '@/components/contacts/ContactCreateModal'
import { DealTemplateWithItems } from './DealTemplateWithItems'
import { Search, X, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface DealCreateModalProps {
  pipelineId: string
  stages: Stage[]
  open: boolean
  onClose: () => void
  onCreate: (data: {
    pipeline_id: string
    stage_id: string
    deal_value_negotiated: number
    priority: Priority
    contact_id: number
    company_id: number
    contract_type_id?: number | null
    contract_template_id?: number | null
    items?: Omit<DealItem, 'id' | 'deal_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]
  }) => void
  defaultStageId?: string
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
  defaultStageId,
}: DealCreateModalProps) {
  const { activeContractTypes } = useContractTypes()
  const { companies } = useCompanies()
  const { contacts } = useContacts()

  // Form state
  const [selectedContact, setSelectedContact] = useState<{ id: number; name: string } | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [contractTypeId, setContractTypeId] = useState<number | null>(null)
  const [contractTemplateId, setContractTemplateId] = useState<number | null>(null)
  const [items, setItems] = useState<Omit<DealItem, 'id' | 'deal_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]>([])
  const [dealValue, setDealValue] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [stageId, setStageId] = useState(defaultStageId || stages.find((s) => s.is_default)?.id || stages[0]?.id || '')

  // Contact search
  const [searchQuery, setSearchQuery] = useState('')
  const [showContactModal, setShowContactModal] = useState(false)


  // Auto-calculate deal value from items
  const handleTotalChange = (total: number) => {
    setDealValue(total.toString())
  }

  const handleCreate = () => {
    if (!selectedContact || !companyId || !dealValue || !stageId) return

    onCreate({
      pipeline_id: pipelineId,
      stage_id: stageId,
      deal_value_negotiated: parseFloat(dealValue),
      priority,
      contact_id: selectedContact.id,
      company_id: companyId,
      contract_type_id: contractTypeId,
      contract_template_id: contractTemplateId,
      items: items.length > 0 ? items : undefined,
    })

    // Reset form
    setSelectedContact(null)
    setCompanyId(null)
    setContractTypeId(null)
    setContractTemplateId(null)
    setItems([])
    setDealValue('')
    setPriority('medium')
    setStageId(stages.find((s) => s.is_default)?.id || stages[0]?.id || '')
    setSearchQuery('')
    onClose()
  }

  const filteredContacts = contacts?.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader className="border-b border-slate-200 pb-4">
            <DialogTitle className="text-2xl font-bold text-slate-900">Novo Negócio</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              Cadastre um novo negócio no pipeline
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* 1. Contact (FIRST FIELD) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Contato <span className="text-red-500">*</span>
              </Label>
              
              {selectedContact ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{selectedContact.name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedContact(null)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Buscar contato por nome, telefone ou email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 border-slate-300"
                    />
                  </div>

                  {searchQuery && filteredContacts && filteredContacts.length > 0 && (
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                      {filteredContacts.slice(0, 5).map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            setSelectedContact({ id: contact.id, name: contact.name })
                            setSearchQuery('')
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        >
                          <p className="font-medium text-sm">{contact.name}</p>
                          {contact.phone && (
                            <p className="text-xs text-slate-500">{contact.phone}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowContactModal(true)}
                    className="w-full h-11 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar Novo Contato
                  </Button>
                </>
              )}
            </div>

            {/* 2. Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-semibold text-slate-700">
                Empresa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={companyId?.toString() ?? ''}
                onValueChange={(value) => setCompanyId(value ? parseInt(value) : null)}
              >
                <SelectTrigger id="company" className="h-11 border-slate-300">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="bg-white border-slate-200">
                  {companies?.filter(c => c.is_active).map((company) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Contract Type */}
            <div className="space-y-2">
              <Label htmlFor="contract-type" className="text-sm font-semibold text-slate-700">
                Tipo de Contrato
              </Label>
              <Select
                value={contractTypeId?.toString() ?? ''}
                onValueChange={(value) => {
                  setContractTypeId(value ? parseInt(value) : null)
                  setContractTemplateId(null)
                  setItems([])
                }}
              >
                <SelectTrigger id="contract-type" className="h-11 border-slate-300">
                  <SelectValue placeholder="Selecione o tipo (opcional)" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="bg-white border-slate-200">
                  {activeContractTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 4. Template with Items */}
            {contractTypeId && (
              <DealTemplateWithItems
                contractTypeId={contractTypeId}
                templateId={contractTemplateId}
                onTemplateChange={setContractTemplateId}
                items={items}
                onItemsChange={setItems}
                onTotalChange={handleTotalChange}
              />
            )}

            {/* 5. Deal Value */}
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
                disabled={items.length > 0} // Disabled if items are present
              />
              {items.length > 0 && (
                <p className="text-xs text-slate-500">
                  Valor calculado automaticamente dos itens
                </p>
              )}
            </div>

            {/* 6. Priority */}
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

            {/* 7. Initial Stage */}
            <div className="space-y-2">
              <Label htmlFor="stage" className="text-sm font-semibold text-slate-700">
                Estágio Inicial <span className="text-red-500">*</span>
              </Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger id="stage" className="h-11 border-slate-300">
                  <SelectValue placeholder="Selecione o estágio" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="bg-white border-slate-200">
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name} {stage.is_default && '(Padrão)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={onClose} className="px-6">
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedContact || !companyId || !dealValue || !stageId}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              Criar Negócio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Create Modal */}
      <ContactCreateModal
        open={showContactModal}
        onClose={() => setShowContactModal(false)}
        onCreate={async (data) => {
          const { data: contact, error } = await supabase
            .from('crm_contacts')
            .insert([data as never])
            .select()
            .single()
          
          if (error) throw error
          return contact
        }}
        mode="balcao"
        onSuccess={(contactId) => {
          // Fetch contact name
          supabase
            .from('crm_contacts')
            .select('name')
            .eq('id', contactId)
            .single()
            .then(({ data }) => {
              const contactData = data as unknown as { name: string } // Minimal shape needed
              if (contactData) {
                setSelectedContact({ id: contactId, name: contactData.name })
              }
            })
          setShowContactModal(false)
        }}
      />
    </>
  )
}
