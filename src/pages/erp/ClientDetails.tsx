import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, Calendar, DollarSign, Edit, MessageCircle, FilePlus, Eye } from 'lucide-react'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'
import { ContractDetailsModal } from '@/components/modals/ContractDetailsModal'
import { ClientLessonsTab } from '@/components/clients/ClientLessonsTab'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { useClients } from '@/hooks/useClients'
import { useContracts } from '@/hooks/useContracts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { validateCPF } from '@/lib/validators'
import type { Client, Contract } from '@/types/database'

export function ClientDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { chatwootUrl } = useChatwootUrl()
  const { clients, updateClient, isLoading: loadingClient, isUpdating } = useClients()
  const { contracts, isLoading: loadingContracts } = useContracts()
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isContractDetailsOpen, setIsContractDetailsOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [cpfError, setCpfError] = useState('')
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    rg_number: '',
    rg_issuer_state: '',
    rg_issue_date: '',
    birth_date: '',
    gender: null as 'M' | 'F' | 'Outro' | null,
    father_name: '',
    mother_name: '',
    birth_country: 'Brasil',
    birth_state: '',
    birth_city: '',
    address: '',
    address_number: '',
    address_complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    cnh_number: '',
    cnh_expiration_date: '',
    notes: '',
  })

  const client = clients.find((c: Client) => c.id === parseInt(id || '0'))
  const clientContracts = contracts.filter((c: Contract) => c.client_id === parseInt(id || '0'))

  const handleOpenEdit = () => {
    if (client) {
      setFormData({
        full_name: client.full_name,
        cpf: client.cpf,
        rg_number: client.rg_number || '',
        rg_issuer_state: client.rg_issuer_state || '',
        rg_issue_date: client.rg_issue_date || '',
        birth_date: client.birth_date || '',
        gender: client.gender || null,
        father_name: client.father_name || '',
        mother_name: client.mother_name || '',
        birth_country: client.birth_country,
        birth_state: client.birth_state || '',
        birth_city: client.birth_city || '',
        address: client.address || '',
        address_number: client.address_number || '',
        address_complement: client.address_complement || '',
        neighborhood: client.neighborhood || '',
        city: client.city || '',
        state: client.state || '',
        zip_code: client.zip_code || '',
        cnh_number: client.cnh_number || '',
        cnh_expiration_date: client.cnh_expiration_date || '',
        notes: client.notes || '',
      })
      setIsEditDialogOpen(true)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate CPF
    if (!validateCPF(formData.cpf)) {
      setCpfError('CPF inválido')
      return
    }
    setCpfError('')

    // Sanitize form data - convert empty strings to null
    const sanitizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    ) as typeof formData

    if (client) {
      updateClient(
        {
          id: client.id,
          updates: sanitizedData,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false)
          },
        }
      )
    }
  }

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract)
    setIsContractDetailsOpen(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (loadingClient || loadingContracts) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando...</div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-slate-500 mb-4">Cliente não encontrado</p>
        <Button onClick={() => navigate('/erp/clients')}>Voltar para Clientes</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/erp/clients')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
              <User className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{client.full_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={client.source === 'crm' ? 'default' : 'secondary'}>
                  {client.source === 'crm' ? 'CRM' : 'Balcão'}
                </Badge>
                <Badge variant={client.is_active ? 'default' : 'secondary'}>
                  {client.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {client.contact_id && client.contacts && client.contacts.chatwoot_id && client.contacts.chatwoot_id > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                window.open(
                  `${chatwootUrl}/app/accounts/1/contacts/${client.contacts!.chatwoot_id}`,
                  '_blank'
                )
              }}
            >
              <MessageCircle className="h-4 w-4" />
              Chatwoot
            </Button>
          )}
          <Button
            variant="default"
            className="gap-2 bg-green-600 hover:bg-green-700"
            onClick={() => navigate(`/erp/contracts?clientId=${client.id}`)}
          >
            <FilePlus className="h-4 w-4" />
            Novo Contrato
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleOpenEdit}>
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="aulas">Aulas</TabsTrigger>
        </TabsList>

        {/* Dados Tab */}
        <TabsContent value="dados" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Client Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Dados Pessoais
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">CPF:</span>
                <p className="font-medium">{client.cpf}</p>
              </div>
              {client.rg_number && (
                <div>
                  <span className="text-slate-500">RG:</span>
                  <p className="font-medium">
                    {client.rg_number}
                    {client.rg_issuer_state && ` - ${client.rg_issuer_state}`}
                  </p>
                </div>
              )}
              {client.rg_issue_date && (
                <div>
                  <span className="text-slate-500">Data Emissão RG:</span>
                  <p className="font-medium">
                    {format(new Date(client.rg_issue_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
              {client.birth_date && (
                <div>
                  <span className="text-slate-500">Data de Nascimento:</span>
                  <p className="font-medium">
                    {format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              )}
              {client.gender && (
                <div>
                  <span className="text-slate-500">Gênero:</span>
                  <p className="font-medium">
                    {client.gender === 'M' ? 'Masculino' : client.gender === 'F' ? 'Feminino' : 'Outro'}
                  </p>
                </div>
              )}
              {client.father_name && (
                <div>
                  <span className="text-slate-500">Nome do Pai:</span>
                  <p className="font-medium">{client.father_name}</p>
                </div>
              )}
              {client.mother_name && (
                <div>
                  <span className="text-slate-500">Nome da Mãe:</span>
                  <p className="font-medium">{client.mother_name}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Naturalidade */}
          {(client.birth_city || client.birth_state) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                Naturalidade
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {client.birth_city && (
                  <div>
                    <span className="text-slate-500">Cidade:</span>
                    <p className="font-medium">{client.birth_city}</p>
                  </div>
                )}
                {client.birth_state && (
                  <div>
                    <span className="text-slate-500">Estado:</span>
                    <p className="font-medium">{client.birth_state}</p>
                  </div>
                )}
                <div>
                  <span className="text-slate-500">País:</span>
                  <p className="font-medium">{client.birth_country}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Endereço */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-purple-600" />
              Endereço
            </h2>
            <div className="space-y-3 text-sm">
              {client.address && (
                <div>
                  <span className="text-slate-500">Logradouro:</span>
                  <p className="font-medium">
                    {client.address}
                    {client.address_number && `, ${client.address_number}`}
                    {client.address_complement && ` - ${client.address_complement}`}
                  </p>
                </div>
              )}
              {client.neighborhood && (
                <div>
                  <span className="text-slate-500">Bairro:</span>
                  <p className="font-medium">{client.neighborhood}</p>
                </div>
              )}
              {(client.city || client.state) && (
                <div>
                  <span className="text-slate-500">Cidade/UF:</span>
                  <p className="font-medium">
                    {client.city}
                    {client.state && ` - ${client.state}`}
                  </p>
                </div>
              )}
              {client.zip_code && (
                <div>
                  <span className="text-slate-500">CEP:</span>
                  <p className="font-medium">{client.zip_code}</p>
                </div>
              )}
            </div>
          </Card>

          {/* CNH */}
          {(client.cnh_number || client.cnh_expiration_date) && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                CNH
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {client.cnh_number && (
                  <div>
                    <span className="text-slate-500">Número:</span>
                    <p className="font-medium">{client.cnh_number}</p>
                  </div>
                )}
                {client.cnh_expiration_date && (
                  <div>
                    <span className="text-slate-500">Vencimento:</span>
                    <p className="font-medium">
                      {format(new Date(client.cnh_expiration_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Observações */}
          {client.notes && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Observações</h2>
              <p className="text-sm text-slate-600">{client.notes}</p>
            </Card>
          )}
        </div>

        {/* Right Column - Contact & Timeline */}
        <div className="space-y-6">
          {/* Contato */}
          {client.contacts && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Contato</h2>
              <div className="space-y-3">
                {client.contacts.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{client.contacts.phone}</span>
                  </div>
                )}
                {client.contacts.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{client.contacts.email}</span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Resumo Financeiro */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Total de Contratos:</span>
                <span className="font-semibold">{clientContracts.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Contratos Ativos:</span>
                <span className="font-semibold">
                  {clientContracts.filter((c) => c.status === 'active').length}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-3 border-t">
                <span className="text-slate-500">Valor Total:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(clientContracts.reduce((sum, c) => sum + c.final_value, 0))}
                </span>
              </div>
            </div>
          </Card>

          {/* Timeline de Contratos */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Timeline de Contratos
            </h2>
            {clientContracts.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Nenhum contrato registrado</p>
            ) : (
              <div className="space-y-4">
                {clientContracts
                  .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
                  .map((contract) => {
                    const statusColors = {
                      active: 'bg-green-100 text-green-700',
                      completed: 'bg-blue-100 text-blue-700',
                      inactive: 'bg-gray-100 text-gray-700',
                    }

                    const statusLabels = {
                      active: 'Ativo',
                      completed: 'Concluído',
                      inactive: 'Inativo',
                    }

                    return (
                      <div
                        key={contract.id}
                        className="border-l-2 border-purple-200 pl-4 pb-4 last:pb-0 relative cursor-pointer hover:bg-slate-50 rounded-lg transition-colors p-2 -ml-2"
                        onClick={() => handleViewContract(contract)}
                      >
                        <div className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-purple-500 border-2 border-white" />
                        <div className="space-y-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{contract.contract_number}</p>
                              <Eye className="h-3 w-3 text-slate-400" />
                            </div>
                            <Badge className={`${statusColors[contract.status]} text-xs`}>
                              {statusLabels[contract.status]}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            {contract.contract_types?.name || 'N/A'}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(contract.final_value)}
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {contract.installments}x de{' '}
                            {formatCurrency(contract.final_value / contract.installments)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </TabsContent>

    {/* Aulas Tab */}
    <TabsContent value="aulas">
      <ClientLessonsTab clientId={client.id} />
    </TabsContent>
  </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>
                Atualize os dados do cliente
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Dados Pessoais Básicos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-700 border-b pb-2">
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      required
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      required
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => {
                        setFormData({ ...formData, cpf: e.target.value })
                        setCpfError('')
                      }}
                      className={cpfError ? 'border-red-500' : ''}
                    />
                    {cpfError && (
                      <p className="text-xs text-red-600">{cpfError}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* RG */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rg_number">RG</Label>
                    <Input
                      id="rg_number"
                      value={formData.rg_number}
                      onChange={(e) => setFormData({ ...formData, rg_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg_issuer_state">UF Emissor</Label>
                    <Input
                      id="rg_issuer_state"
                      maxLength={2}
                      placeholder="SP"
                      value={formData.rg_issuer_state}
                      onChange={(e) => setFormData({ ...formData, rg_issuer_state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rg_issue_date">Data Emissão</Label>
                    <Input
                      id="rg_issue_date"
                      type="date"
                      value={formData.rg_issue_date}
                      onChange={(e) => setFormData({ ...formData, rg_issue_date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Gênero */}
                <div className="space-y-2">
                  <Label htmlFor="gender">Gênero</Label>
                  <Select
                    value={formData.gender || undefined}
                    onValueChange={(value: 'M' | 'F' | 'Outro') => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-700 border-b pb-2">
                  Endereço
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="address">Logradouro</Label>
                    <Input
                      id="address"
                      placeholder="Rua, Avenida..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_number">Número</Label>
                    <Input
                      id="address_number"
                      value={formData.address_number}
                      onChange={(e) => setFormData({ ...formData, address_number: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">UF</Label>
                    <Input
                      id="state"
                      maxLength={2}
                      placeholder="SP"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip_code">CEP</Label>
                    <Input
                      id="zip_code"
                      placeholder="00000-000"
                      value={formData.zip_code}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* CNH */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-slate-700 border-b pb-2">
                  CNH (Autoescola)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnh_number">Número da CNH</Label>
                    <Input
                      id="cnh_number"
                      value={formData.cnh_number}
                      onChange={(e) => setFormData({ ...formData, cnh_number: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnh_expiration_date">Data de Vencimento</Label>
                    <Input
                      id="cnh_expiration_date"
                      type="date"
                      value={formData.cnh_expiration_date}
                      onChange={(e) => setFormData({ ...formData, cnh_expiration_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Atualizando...' : 'Atualizar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contract Details Modal */}
      {selectedContract && (
        <ContractDetailsModal
          contract={selectedContract}
          open={isContractDetailsOpen}
          onOpenChange={setIsContractDetailsOpen}
        />
      )}
    </div>
  )
}
