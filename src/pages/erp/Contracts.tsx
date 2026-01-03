import { useState, useEffect, useMemo } from 'react'
import { Plus, FileText, Eye, Calendar, DollarSign, Building, Download, Filter } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useContracts } from '@/hooks/useContracts'
import { useClients } from '@/hooks/useClients'
import { useCompanies, useContractTypes, usePaymentMethods } from '@/hooks/useERPConfig'
import { useContractTemplates } from '@/hooks/useContractTemplates'
import { useContractItemsCatalog } from '@/hooks/useContractItemsCatalog'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Client, Contract, ContractItem } from '@/types/database'
import { formatCurrency, calculateInstallmentValue } from '@/lib/utils/currency'
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS, WIZARD_STEPS, type ContractStatus, type WizardStep } from '@/types/contract'
import { toast } from 'sonner'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ContractPDF } from '@/components/pdf/ContractPDF'
import { ContractDetailsModal } from '@/components/modals/ContractDetailsModal'

export function Contracts() {
  const { contracts, createContract, isLoading, isCreating, generateContractNumber, useContractItems } = useContracts()
  const { activeClients } = useClients()
  const { activeCompanies } = useCompanies()
  const { activeContractTypes } = useContractTypes()
  const { activePaymentMethods } = usePaymentMethods()
  const { useTemplatesByType, useTemplateWithItems } = useContractTemplates()
  const { catalogItems } = useContractItemsCatalog()

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState<WizardStep>(WIZARD_STEPS.BASIC_INFO)
  const [contractForm, setContractForm] = useState({
    client_id: '',
    company_id: '',
    contract_type_id: '',
    payment_method_id: '',
    total_value: '',
    discount: '',
    installments: '1',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [items, setItems] = useState<Array<{ catalog_item_id: string; description: string; quantity: string; unit_price: string }>>([{ catalog_item_id: '', description: '', quantity: '1', unit_price: '0' }])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  
  // Buscar templates por tipo de contrato
  const { data: templates } = useTemplatesByType(
    contractForm.contract_type_id ? parseInt(contractForm.contract_type_id) : undefined
  )
  
  // Buscar template selecionado com itens
  const { data: selectedTemplate } = useTemplateWithItems(
    selectedTemplateId ? parseInt(selectedTemplateId) : undefined
  )
  
  // Details modal state
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('all')

  // Pré-preencher itens quando template for selecionado
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.items.length > 0) {
      const suggestedItems = selectedTemplate.items.map(item => ({
        catalog_item_id: item.catalog_item_id.toString(),
        description: item.catalog_item?.name || '',
        quantity: item.quantity.toString(),
        unit_price: (item.catalog_item?.default_unit_price || 0).toString(),
      }))
      setItems(suggestedItems)
    }
  }, [selectedTemplate])

  // Detectar clientId na URL e abrir modal automaticamente
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const clientId = searchParams.get('clientId')
    if (clientId && !isWizardOpen) {
      // Pré-selecionar o cliente
      setContractForm(prev => ({ ...prev, client_id: clientId }))
      // Abrir o wizard
      setIsWizardOpen(true)
      // Limpar o query parameter da URL
      setSearchParams({})
    }
  }, [searchParams, isWizardOpen, setSearchParams])

  const resetForm = () => {
    setWizardStep(WIZARD_STEPS.BASIC_INFO)
    setContractForm({
      client_id: '',
      company_id: '',
      contract_type_id: '',
      payment_method_id: '',
      total_value: '',
      discount: '',
      installments: '1',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    setItems([{ catalog_item_id: '', description: '', quantity: '1', unit_price: '0' }])
    setSelectedTemplateId('')
  }

  const handleAddItem = () => {
    setItems([...items, { catalog_item_id: '', description: '', quantity: '1', unit_price: '0' }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Se mudou o item do catálogo, atualizar descrição e preço
    if (field === 'catalog_item_id' && value) {
      const catalogItem = catalogItems.find(item => item.id.toString() === value)
      if (catalogItem) {
        newItems[index].description = catalogItem.name
        newItems[index].unit_price = catalogItem.default_unit_price.toString()
      }
    }
    
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0
      const price = parseFloat(item.unit_price) || 0
      return sum + qty * price
    }, 0)
  }

  const calculateFinalValue = () => {
    const total = parseFloat(contractForm.total_value) || calculateTotal()
    const discount = parseFloat(contractForm.discount) || 0
    return total - discount
  }

  const handleNextStep = () => {
    if (wizardStep < WIZARD_STEPS.TOTAL) {
      setWizardStep((wizardStep + 1) as WizardStep)
    }
  }

  const handlePrevStep = () => {
    if (wizardStep > WIZARD_STEPS.BASIC_INFO) {
      setWizardStep((wizardStep - 1) as WizardStep)
    }
  }

  const hasValidItems = () => {
    return items.some((item) => item.description.trim() !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!contractForm.client_id || !contractForm.company_id || !contractForm.contract_type_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (!hasValidItems()) {
      toast.error('Adicione pelo menos um item ao contrato')
      return
    }

    const installmentsNum = parseInt(contractForm.installments)
    if (!contractForm.payment_method_id || installmentsNum < 1) {
      toast.error('Configure a forma de pagamento e número de parcelas')
      return
    }

    // Gerar número de contrato sequencial
    let contractNumber: string
    try {
      // Tentar gerar número via RPC
      contractNumber = await generateContractNumber()
      console.log('✅ Número gerado via RPC:', contractNumber)
    } catch (error) {
      console.error('❌ Erro ao gerar número via RPC:', error)
      // Fallback: usar timestamp para garantir unicidade
      contractNumber = `CONT-${Date.now()}`
      console.log('⚠️ Usando fallback:', contractNumber)
    }

    // Preparar dados do contrato
    const contractData = {
      company_id: parseInt(contractForm.company_id),
      client_id: parseInt(contractForm.client_id),
      contract_type_id: parseInt(contractForm.contract_type_id),
      template_id: null,
      contract_number: contractNumber,
      total_value: parseFloat(contractForm.total_value) || calculateTotal(),
      discount: parseFloat(contractForm.discount) || 0,
      final_value: calculateFinalValue(),
      installments: installmentsNum,
      payment_method_id: parseInt(contractForm.payment_method_id),
      start_date: contractForm.start_date,
      end_date: null,
      status: 'active' as const,
      pdf_url: null,
      notes: contractForm.notes || null,
    }

    // Preparar itens
    const contractItems = items
      .filter((item) => item.catalog_item_id && item.description.trim())
      .map((item) => ({
        catalog_item_id: item.catalog_item_id ? parseInt(item.catalog_item_id) : null,
        description: item.description,
        quantity: parseFloat(item.quantity) || 1,
        unit_price: parseFloat(item.unit_price) || 0,
        total_price: (parseFloat(item.quantity) || 1) * (parseFloat(item.unit_price) || 0),
      }))


    // Criar contrato
    try {
      await createContract({
        contract: contractData,
        items: contractItems,
      })
      
      toast.success('Contrato criado com sucesso!')
      setIsWizardOpen(false)
      resetForm()
    } catch (error: unknown) {
      console.error('Erro ao criar contrato:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`Erro ao criar contrato: ${errorMessage}`)
    }
  }

  // Filtered contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Status filter
      if (statusFilter !== 'all' && contract.status !== statusFilter) {
        return false
      }

      // Client filter
      if (clientFilter && !contract.clients?.full_name?.toLowerCase().includes(clientFilter.toLowerCase())) {
        return false
      }

      // Company filter
      if (companyFilter !== 'all' && contract.company_id?.toString() !== companyFilter) {
        return false
      }

      return true
    })
  }, [contracts, statusFilter, clientFilter, companyFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando contratos...</div>
      </div>
    )
  }

  const activeContracts = filteredContracts.filter((c) => c.status === 'active')
  const draftContracts = contracts.filter((c) => c.status === 'draft')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Contratos</h1>
          <p className="text-slate-500 mt-1">
            {activeContracts.length} contrato(s) ativo(s) • {draftContracts.length} rascunho(s)
          </p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-slate-700">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="statusFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Client Filter */}
          <div className="space-y-2">
            <Label htmlFor="clientFilter">Cliente</Label>
            <Input
              id="clientFilter"
              placeholder="Buscar por nome..."
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            />
          </div>

          {/* Company Filter */}
          <div className="space-y-2">
            <Label htmlFor="companyFilter">Empresa</Label>
            <Select value={companyFilter} onValueChange={setCompanyFilter}>
              <SelectTrigger id="companyFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {activeCompanies.map(company => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      {filteredContracts.length !== contracts.length && (
        <div className="text-sm text-slate-500">
          Mostrando {filteredContracts.length} de {contracts.length} contratos
        </div>
      )}

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContracts.map((contract) => {
          const status = contract.status as ContractStatus

          return (
            <Card key={contract.id} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{contract.contract_number}</h3>
                    <p className="text-sm text-slate-500">
                      {contract.clients?.full_name || 'Cliente não informado'}
                    </p>
                  </div>
                </div>
                <Badge className={CONTRACT_STATUS_COLORS[status]}>
                  {CONTRACT_STATUS_LABELS[status]}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-slate-400" />
                  {contract.companies?.name || 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {contract.contract_types?.name || 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {format(parseISO(contract.start_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="font-semibold">{formatCurrency(contract.final_value)}</span>
                  <span className="text-xs text-slate-500">
                    ({contract.installments}x de {formatCurrency(calculateInstallmentValue(contract.final_value, contract.installments))})
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 gap-2"
                  onClick={() => {
                    setSelectedContract(contract)
                    setIsDetailsModalOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </Button>
                {contract.status !== 'draft' && (
                  <ContractPDFButton contract={contract} useContractItems={useContractItems} />
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {contracts.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum contrato cadastrado</p>
          <Button onClick={() => setIsWizardOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Contrato
          </Button>
        </div>
      )}

      {/* Wizard Dialog */}
      <Dialog open={isWizardOpen} onOpenChange={(open) => {
        setIsWizardOpen(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Novo Contrato - Passo {wizardStep} de {WIZARD_STEPS.TOTAL}</DialogTitle>
            <DialogDescription>
              {wizardStep === WIZARD_STEPS.BASIC_INFO && 'Selecione o cliente, empresa e tipo de contrato'}
              {wizardStep === WIZARD_STEPS.ITEMS && 'Adicione os serviços/itens do contrato'}
              {wizardStep === WIZARD_STEPS.PAYMENT && 'Configure os valores e forma de pagamento'}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Basic Info */}
          {wizardStep === WIZARD_STEPS.BASIC_INFO && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="client_id">Cliente *</Label>
                <Select
                  value={contractForm.client_id}
                  onValueChange={(value) => setContractForm({ ...contractForm, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeClients.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Nenhum cliente encontrado</div>
                    ) : (
                      activeClients.map((client: Client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.full_name} - {client.cpf}
                      </SelectItem>
                    ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_id">Empresa *</Label>
                <Select
                  value={contractForm.company_id}
                  onValueChange={(value) => setContractForm({ ...contractForm, company_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCompanies.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Nenhuma empresa encontrada</div>
                    ) : (
                      activeCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_type_id">Tipo de Contrato *</Label>
                <Select
                  value={contractForm.contract_type_id}
                  onValueChange={(value) => setContractForm({ ...contractForm, contract_type_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeContractTypes.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">Nenhum tipo de contrato encontrado</div>
                    ) : (
                      activeContractTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={contractForm.start_date}
                  onChange={(e) => setContractForm({ ...contractForm, start_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Step 2: Items/Services */}
          {wizardStep === WIZARD_STEPS.ITEMS && (
            <div className="space-y-4 py-4">
              {/* Seleção de Template */}
              {templates && templates.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Template (Opcional)</Label>
                    {selectedTemplateId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplateId('')
                          setItems([{ catalog_item_id: '', description: '', quantity: '1', unit_price: '0' }])
                        }}
                      >
                        Limpar Template
                      </Button>
                    )}
                  </div>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template para pré-preencher" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Indicador de sugestões */}
              {selectedTemplate && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✨ <strong>Template "{selectedTemplate.name}" aplicado</strong>. 
                    Você pode editar, adicionar ou remover itens conforme necessário.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label>Itens/Serviços do Contrato</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>

              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid gap-3">
                    <div>
                      <Label>Item do Catálogo</Label>
                      <Select
                        value={item.catalog_item_id}
                        onValueChange={(value) => handleItemChange(index, 'catalog_item_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogItems
                            .filter(catalogItem => catalogItem.id && catalogItem.is_active)
                            .map((catalogItem) => (
                              <SelectItem key={catalogItem.id} value={catalogItem.id.toString()}>
                                {catalogItem.name} - {formatCurrency(catalogItem.default_unit_price)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Valor Unit.</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Total</Label>
                        <Input
                          disabled
                          value={formatCurrency(
                            (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
                          )}
                        />
                      </div>
                    </div>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </Card>
              ))}

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {wizardStep === WIZARD_STEPS.PAYMENT && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="total_value">Valor Total</Label>
                  <Input
                    id="total_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={contractForm.total_value || calculateTotal()}
                    onChange={(e) => setContractForm({ ...contractForm, total_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={contractForm.discount}
                    onChange={(e) => setContractForm({ ...contractForm, discount: e.target.value })}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Valor Final:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(calculateFinalValue())}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="installments">Número de Parcelas *</Label>
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    value={contractForm.installments}
                    onChange={(e) => setContractForm({ ...contractForm, installments: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method_id">Forma de Pagamento *</Label>
                  <Select
                    value={contractForm.payment_method_id}
                    onValueChange={(value) => setContractForm({ ...contractForm, payment_method_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePaymentMethods.length === 0 ? (
                        <div className="p-2 text-sm text-slate-500">Nenhum método de pagamento encontrado</div>
                      ) : (
                        activePaymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id.toString()}>
                          {method.name}
                        </SelectItem>
                      ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Parcelas:</strong> {contractForm.installments}x de{' '}
                  {formatCurrency(
                    calculateInstallmentValue(calculateFinalValue(), parseInt(contractForm.installments))
                  )}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  As parcelas serão geradas automaticamente após a criação do contrato
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  placeholder="Anotações adicionais..."
                  value={contractForm.notes}
                  onChange={(e) => setContractForm({ ...contractForm, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevStep}
              disabled={wizardStep === WIZARD_STEPS.BASIC_INFO || isCreating}
            >
              Anterior
            </Button>
            {wizardStep < WIZARD_STEPS.TOTAL ? (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={
                  isCreating ||
                  (wizardStep === WIZARD_STEPS.BASIC_INFO &&
                    (!contractForm.client_id ||
                      !contractForm.company_id ||
                      !contractForm.contract_type_id)) ||
                  (wizardStep === WIZARD_STEPS.ITEMS && !hasValidItems())
                }
              >
                Próximo
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={
                  isCreating ||
                  !contractForm.payment_method_id ||
                  parseInt(contractForm.installments) < 1
                }
              >
                {isCreating ? 'Criando...' : 'Criar Contrato'}
              </Button>
            )}
          </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contract Details Modal */}
      {selectedContract && (
        <ContractDetailsModal
          contract={selectedContract}
          open={isDetailsModalOpen}
          onOpenChange={setIsDetailsModalOpen}
        />
      )}
    </div>
  )
}

// Helper component for PDF generation
interface ContractPDFButtonProps {
  contract: Contract
  useContractItems: (contractId: number | undefined) => {
    data: ContractItem[] | undefined
    isLoading: boolean
  }
}

function ContractPDFButton({ contract, useContractItems }: ContractPDFButtonProps) {
  const { data: items, isLoading } = useContractItems(contract.id)

  if (isLoading || !items) {
    return (
      <Button 
        variant="default" 
        size="sm" 
        className="flex-1 gap-2"
        disabled
      >
        <Download className="h-4 w-4" />
        Carregando...
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={<ContractPDF contract={contract} items={items} />}
      fileName={`contrato-${contract.contract_number}.pdf`}
      className="flex-1"
    >
      {({ loading }) => (
        <Button 
          variant="default" 
          size="sm" 
          className="w-full gap-2"
          disabled={loading}
        >
          <Download className="h-4 w-4" />
          {loading ? 'Gerando...' : 'PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
