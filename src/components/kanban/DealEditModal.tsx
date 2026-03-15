import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Deal, Priority, Stage, TipoServico, Urgencia } from '@/types/database'
import { 
  ExternalLink, 
  Calendar, 
  Building2, 
  User, 
  FileText, 
  Mail, 
  Phone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Edit2,
  Trash2,
  Plus
} from 'lucide-react'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'
import { useDealItems } from '@/hooks/useDealItems'
import { useTemplates } from '@/hooks/useTemplates'
import { useCatalogItems } from '@/hooks/useCatalogItems'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface ContractTemplateItemWithCatalogType {
  description: string | null
  quantity: number
  catalog_item_id: number | null
  catalog_item?: {
    name: string
    default_unit_price: number
  } | null
}

interface DealEditModalProps {
  deal: Deal | null
  stages: Stage[]
  open: boolean
  onClose: () => void
  onSave: (dealId: string, updates: Partial<Deal>) => void
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Baixa', color: 'bg-slate-100 text-slate-700' },
  { value: 'medium', label: 'Média', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-700' },
]

const tipoServicoOptions: { value: TipoServico; label: string }[] = [
  { value: 'Carro', label: 'Carro' },
  { value: 'Moto', label: 'Moto' },
  { value: 'PCD', label: 'PCD' },
  { value: 'Carreta', label: 'Carreta' },
]

const urgenciaOptions: { value: Urgencia; label: string }[] = [
  { value: 'imediata', label: 'Imediata' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
  { value: 'sem_pressa', label: 'Sem pressa' },
]

export function DealEditModal({ deal, stages, open, onClose, onSave }: DealEditModalProps) {
  const { chatwootUrl } = useChatwootUrl()
  const { items: dealItems, isLoading: itemsLoading, updateItem, deleteItem, createItems } = useDealItems(deal?.id)
  const { templates } = useTemplates()
  const { catalogItems } = useCatalogItems()
  
  const [priority, setPriority] = useState<Priority>('medium')
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'negociacao' | 'qualificacao'>('negociacao')
  const [decisorImediato, setDecisorImediato] = useState('')
  const [tipoServico, setTipoServico] = useState<TipoServico | null>(null)
  const [localServico, setLocalServico] = useState('')
  const [experienciaPrevia, setExperienciaPrevia] = useState('')
  const [urgencia, setUrgencia] = useState<Urgencia | null>(null)
  const [formaPagamento, setFormaPagamento] = useState('')
  const [pontoDecisao, setPontoDecisao] = useState('')
  const [objecaoPrincipal, setObjecaoPrincipal] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [editedQuantity, setEditedQuantity] = useState<number>(1)
  const [editedUnitPrice, setEditedUnitPrice] = useState<number>(0)
  
  // States for adding new item
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [newItemDescription, setNewItemDescription] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemUnitPrice, setNewItemUnitPrice] = useState(0)
  const [newItemCatalogId, setNewItemCatalogId] = useState<number | null>(null)

  useEffect(() => {
    if (deal) {
      setPriority(deal.priority)
      setNotes(deal.notes || '')
      setDecisorImediato(deal.decisor_imediato || '')
      setTipoServico(deal.tipo_servico || null)
      setLocalServico(deal.local_servico || '')
      setExperienciaPrevia(deal.experiencia_previa || '')
      setUrgencia(deal.urgencia || null)
      setFormaPagamento(deal.forma_pagamento || '')
      setPontoDecisao(deal.ponto_decisao || '')
      setObjecaoPrincipal(deal.objecao_principal || '')
      setSelectedTemplateId(deal.contract_template_id)
      setActiveTab('negociacao')
    }
  }, [deal])

  // Handle template change
  const handleTemplateChange = async (templateId: string) => {
    if (!deal) return
    
    const newTemplateId = templateId === 'none' ? null : parseInt(templateId)
    setSelectedTemplateId(newTemplateId)

    // If template is selected, load its items
    if (newTemplateId && templates) {
      const selectedTemplate = templates.find(t => t.id === newTemplateId)
      
      if (selectedTemplate && confirm('Trocar o template irá substituir todos os itens atuais. Deseja continuar?')) {
        try {
          // Delete all current items
          if (dealItems && dealItems.length > 0) {
            await Promise.all(dealItems.map(item => deleteItem(item.id)))
          }

          // Load template items from the template
          const { data: templateItems, error } = await supabase
            .from('erp_contract_template_items')
            .select(`
              *,
              catalog_item:erp_contract_items_catalog(*)
            `)
            .eq('template_id', newTemplateId)

          if (error) throw error

          if (templateItems && templateItems.length > 0) {
            // Create new items from template
            const newItems = templateItems.map((item: ContractTemplateItemWithCatalogType) => ({
              description: item.catalog_item?.name || item.description || '',
              quantity: item.quantity,
              unit_price: item.catalog_item?.default_unit_price || 0,
              total_price: item.quantity * (item.catalog_item?.default_unit_price || 0),
              catalog_item_id: item.catalog_item_id,
            }))

            await createItems({ dealId: deal.id, items: newItems })
            toast.success('Template trocado e itens atualizados!')
          }
        } catch (error) {
          console.error('Error changing template:', error)
          toast.error('Erro ao trocar template')
        }
      } else if (!selectedTemplate) {
        // Just update the template ID without changing items
        toast.info('Template removido')
      }
    }
  }

  const handleSave = () => {
    if (!deal) return

    // Calculate total from items
    const calculatedTotal = dealItems?.reduce((sum, item) => sum + item.total_price, 0) || 0

    onSave(deal.id, {
      deal_value_negotiated: calculatedTotal,
      priority,
      notes: notes || null,
      decisor_imediato: decisorImediato.trim() || null,
      tipo_servico: tipoServico,
      local_servico: localServico.trim() || null,
      experiencia_previa: experienciaPrevia.trim() || null,
      urgencia,
      forma_pagamento: formaPagamento.trim() || null,
      ponto_decisao: pontoDecisao.trim() || null,
      objecao_principal: objecaoPrincipal.trim() || null,
      contract_template_id: selectedTemplateId,
    })
    onClose()
  }

  const toggleItemExpanded = (itemId: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const startEditingItem = (itemId: number, quantity: number, unitPrice: number) => {
    setEditingItem(itemId)
    setEditedQuantity(quantity)
    setEditedUnitPrice(unitPrice)
  }

  const saveItemEdit = async (itemId: number) => {
    try {
      await updateItem({
        itemId,
        updates: {
          quantity: editedQuantity,
          unit_price: editedUnitPrice,
          total_price: editedQuantity * editedUnitPrice,
        },
      })
      setEditingItem(null)
      toast.success('Item atualizado')
    } catch {
      toast.error('Erro ao atualizar item')
    }
  }

  const cancelItemEdit = () => {
    setEditingItem(null)
  }

  // Handle adding new item
  const handleAddNewItem = async () => {
    if (!deal || !newItemDescription.trim()) {
      toast.error('Descrição é obrigatória')
      return
    }

    try {
      const newItem = {
        description: newItemDescription.trim(),
        quantity: newItemQuantity,
        unit_price: newItemUnitPrice,
        total_price: newItemQuantity * newItemUnitPrice,
        catalog_item_id: newItemCatalogId,
      }

      await createItems({ dealId: deal.id, items: [newItem] })
      
      // Reset form
      setNewItemDescription('')
      setNewItemQuantity(1)
      setNewItemUnitPrice(0)
      setNewItemCatalogId(null)
      setIsAddingItem(false)
      
      toast.success('Item adicionado com sucesso!')
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Erro ao adicionar item')
    }
  }

  const cancelAddItem = () => {
    setNewItemDescription('')
    setNewItemQuantity(1)
    setNewItemUnitPrice(0)
    setNewItemCatalogId(null)
    setIsAddingItem(false)
  }

  // Handle catalog item selection for new item
  const handleCatalogItemSelect = (catalogItemId: string) => {
    if (catalogItemId === 'none') {
      setNewItemCatalogId(null)
      return
    }

    const catalogItem = catalogItems?.find(item => item.id === parseInt(catalogItemId))
    if (catalogItem) {
      setNewItemCatalogId(catalogItem.id)
      setNewItemDescription(catalogItem.name)
      setNewItemUnitPrice(catalogItem.default_unit_price)
    }
  }

  if (!deal) return null
  
  // Calculate progress
  const currentStageIndex = stages.findIndex((s) => s.id === deal.stage_id)
  const currentStage = stages[currentStageIndex]

  // Format dates
  const createdDate = new Date(deal.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const totalItemsValue = dealItems?.reduce((sum, item) => sum + item.total_price, 0) || 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1100px] max-h-[85vh] p-0 gap-0 bg-white overflow-hidden flex flex-col">
        <DialogTitle className="sr-only">Detalhes do Negócio</DialogTitle>
        <DialogDescription className="sr-only">
          Visualize e edite as informações do negócio, incluindo contato, empresa, itens negociados e observações
        </DialogDescription>
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 shrink-0">
          <h2 className="text-xl font-bold text-white">Detalhes do Negócio</h2>
          <p className="text-blue-100 text-xs mt-0.5">Visualize e edite as informações</p>
        </div>

        {/* Split View Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Contact & Info (40%) */}
          <div className="w-[40%] border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
            {/* Contact Card */}
            {deal.contacts && (
              <Card className="p-4 bg-white">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 ring-4 ring-blue-100">
                    <User className="h-10 w-10 text-white" />
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {deal.contacts.name}
                  </h3>
                  
                  {/* Contact Details */}
                  <div className="space-y-1.5 mt-3 w-full">
                    {deal.contacts.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 justify-center">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{deal.contacts.phone}</span>
                      </div>
                    )}
                    {deal.contacts.email && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 justify-center">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="truncate">{deal.contacts.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Chatwoot Link */}
                  {deal.contacts.chatwoot_id && chatwootUrl && (
                    <a
                      href={`${chatwootUrl}/app/accounts/1/contacts/${deal.contacts.chatwoot_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 mt-3 font-medium"
                    >
                      Ver no Chatwoot
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Company Badge */}
            {deal.companies && (
              <Card className="p-3 bg-white mt-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Empresa</p>
                    <p className="font-semibold text-sm text-slate-900">{deal.companies.name}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Pipeline Stage */}
            <Card className="p-3 bg-white mt-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Pipeline</span>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {currentStageIndex + 1} de {stages.length}
                  </Badge>
                </div>
                
                {/* Stage Indicator */}
                <div className="flex items-center gap-2">
                  {stages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      className={`h-2 flex-1 rounded-full transition-colors ${
                        idx <= currentStageIndex
                          ? 'bg-blue-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-sm font-medium text-slate-900">
                  {currentStage?.name}
                </p>
              </div>
            </Card>

            {/* AI Summary */}
            {deal.ai_summary && (
              <Card className="p-3 bg-purple-50 border-purple-200 mt-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-purple-600 mb-1">Resumo IA</p>
                    <p className="text-xs text-purple-900 leading-relaxed">{deal.ai_summary}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Metadata */}
            <div className="mt-4 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>Criado em {createdDate}</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Items & Edit (60%) */}
          <div className="w-[60%] flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'negociacao' | 'qualificacao')}
              className="flex flex-1 min-h-0 flex-col"
            >
              <div className="border-b border-slate-200 px-4 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="negociacao">Negociação</TabsTrigger>
                  <TabsTrigger value="qualificacao">Qualificação do Lead</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <TabsContent value="negociacao" className="space-y-4 mt-0">
              {/* Template Selector */}
              <div className="space-y-2">
                <Label htmlFor="template-select" className="text-sm font-medium text-slate-700">
                  Template de Contrato
                </Label>
                <Select
                  value={selectedTemplateId?.toString() || 'none'}
                  onValueChange={handleTemplateChange}
                >
                  <SelectTrigger id="template-select" className="h-10">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum template</SelectItem>
                    {templates?.map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">
                  Trocar o template irá substituir todos os itens atuais
                </p>
              </div>

              {/* Negotiated Items */}
              {!itemsLoading && dealItems && dealItems.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-600" />
                    Itens Negociados
                  </h3>
                  
                  <div className="space-y-2">
                    {dealItems.map((item) => {
                      const isExpanded = expandedItems.has(item.id)
                      const isEditing = editingItem === item.id
                      
                      return (
                        <Card
                          key={item.id}
                          className="overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Item Header */}
                          <button
                            onClick={() => toggleItemExpanded(item.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex-1 text-left">
                              <p className="font-medium text-slate-900">{item.description}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                <span>Qtd: {item.quantity}</span>
                                <span>•</span>
                                <span>{formatCurrency(item.unit_price)}/un</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="font-bold text-slate-900">{formatCurrency(item.total_price)}</p>
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-slate-400" />
                              )}
                            </div>
                          </button>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-200">
                              {isEditing ? (
                                /* Edit Mode */
                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Quantidade</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={editedQuantity}
                                        onChange={(e) => setEditedQuantity(parseInt(e.target.value) || 1)}
                                        className="h-9 mt-1"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Valor Unitário</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={editedUnitPrice}
                                        onChange={(e) => setEditedUnitPrice(parseFloat(e.target.value) || 0)}
                                        className="h-9 mt-1"
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-sm font-medium">Total:</span>
                                    <span className="text-lg font-bold text-blue-600">
                                      {formatCurrency(editedQuantity * editedUnitPrice)}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => saveItemEdit(item.id)}
                                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                      <Save className="h-4 w-4 mr-1" />
                                      Salvar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={cancelItemEdit}
                                      className="flex-1"
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                /* View Mode */
                                <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <p className="text-slate-500 text-xs">Quantidade</p>
                                      <p className="font-medium text-slate-900">{item.quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500 text-xs">Valor Unitário</p>
                                      <p className="font-medium text-slate-900">{formatCurrency(item.unit_price)}</p>
                                    </div>
                                    <div>
                                      <p className="text-slate-500 text-xs">Total</p>
                                      <p className="font-medium text-slate-900">{formatCurrency(item.total_price)}</p>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditingItem(item.id, item.quantity, item.unit_price)}
                                      className="flex-1"
                                    >
                                      <Edit2 className="h-4 w-4 mr-1" />
                                      Editar
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        if (confirm('Tem certeza que deseja excluir este item?')) {
                                          deleteItem(item.id)
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      )
                    })}
                  </div>

                  {/* Add Item Form/Button */}
                  {!isAddingItem ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingItem(true)}
                      className="w-full border-dashed border-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  ) : (
                    <Card className="p-4 bg-slate-50 border-2 border-blue-200">
                      <h4 className="font-semibold text-sm text-slate-900 mb-3">Novo Item</h4>
                      <div className="space-y-3">
                        {/* Catalog Item Selector (Optional) */}
                        <div>
                          <Label className="text-xs">Item do Catálogo (Opcional)</Label>
                          <Select
                            value={newItemCatalogId?.toString() || 'none'}
                            onValueChange={handleCatalogItemSelect}
                          >
                            <SelectTrigger className="h-9 mt-1">
                              <SelectValue placeholder="Selecione do catálogo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhum (manual)</SelectItem>
                              {catalogItems?.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name} - {formatCurrency(item.default_unit_price)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Description */}
                        <div>
                          <Label className="text-xs">Descrição *</Label>
                          <Input
                            value={newItemDescription}
                            onChange={(e) => setNewItemDescription(e.target.value)}
                            placeholder="Digite a descrição do item"
                            className="h-9 mt-1"
                          />
                        </div>

                        {/* Quantity and Unit Price */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Quantidade *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={newItemQuantity}
                              onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                              className="h-9 mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Valor Unitário *</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={newItemUnitPrice}
                              onChange={(e) => setNewItemUnitPrice(parseFloat(e.target.value) || 0)}
                              className="h-9 mt-1"
                            />
                          </div>
                        </div>

                        {/* Total Preview */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm font-medium">Total:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(newItemQuantity * newItemUnitPrice)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={handleAddNewItem}
                            disabled={!newItemDescription.trim()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelAddItem}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Total Summary */}
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Total dos Itens</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {formatCurrency(totalItemsValue)}
                      </span>
                    </div>
                  </Card>
                </div>
              )}

              {/* Editable Fields */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-semibold text-slate-900">Editar Informações</h3>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-slate-700">
                    Prioridade
                  </Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger id="priority" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${option.color}`} />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-slate-700">
                    Observações
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre a negociação..."
                    className="min-h-[80px] resize-none text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    Use este campo para anotar detalhes importantes da negociação
                  </p>
                </div>
              </div>
            </TabsContent>

                <TabsContent value="qualificacao" className="mt-0">
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">Qualificação do Lead</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Registre os principais dados para qualificação e avanço da negociação.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="decisor_imediato">Decisor imediato</Label>
                          <Input
                            id="decisor_imediato"
                            value={decisorImediato}
                            onChange={(e) => setDecisorImediato(e.target.value)}
                            placeholder="Ex.: Pai, mãe, próprio aluno"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipo_servico">Tipo de serviço</Label>
                          <Select
                            value={tipoServico ?? 'none'}
                            onValueChange={(value) =>
                              setTipoServico(value === 'none' ? null : (value as TipoServico))
                            }
                          >
                            <SelectTrigger id="tipo_servico">
                              <SelectValue placeholder="Selecione o tipo de serviço" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não informado</SelectItem>
                              {tipoServicoOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="local_servico">Local do serviço</Label>
                          <Input
                            id="local_servico"
                            value={localServico}
                            onChange={(e) => setLocalServico(e.target.value)}
                            placeholder="Ex.: Unidade Centro"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experiencia_previa">Experiência prévia</Label>
                          <Input
                            id="experiencia_previa"
                            value={experienciaPrevia}
                            onChange={(e) => setExperienciaPrevia(e.target.value)}
                            placeholder="Ex.: Já dirigiu, primeira habilitação"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="urgencia">Urgência</Label>
                          <Select
                            value={urgencia ?? 'none'}
                            onValueChange={(value) =>
                              setUrgencia(value === 'none' ? null : (value as Urgencia))
                            }
                          >
                            <SelectTrigger id="urgencia">
                              <SelectValue placeholder="Selecione a urgência" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não informado</SelectItem>
                              {urgenciaOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="forma_pagamento">Forma de pagamento</Label>
                          <Input
                            id="forma_pagamento"
                            value={formaPagamento}
                            onChange={(e) => setFormaPagamento(e.target.value)}
                            placeholder="Ex.: À vista, cartão, parcelado"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="ponto_decisao">Ponto de decisão</Label>
                          <Input
                            id="ponto_decisao"
                            value={pontoDecisao}
                            onChange={(e) => setPontoDecisao(e.target.value)}
                            placeholder="Ex.: Preço, prazo, indicação"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="objecao_principal">Objeção principal</Label>
                          <Textarea
                            id="objecao_principal"
                            value={objecaoPrincipal}
                            onChange={(e) => setObjecaoPrincipal(e.target.value)}
                            placeholder="Descreva a principal objeção do lead"
                            className="min-h-[110px] resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            {/* Fixed Footer Actions */}
            <div className="border-t border-slate-200 p-4 bg-white shrink-0">
              <div className="flex justify-end gap-2.5">
                <Button variant="outline" onClick={onClose} className="px-5 h-9">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  className="px-5 h-9 bg-blue-600 hover:bg-blue-700"
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
