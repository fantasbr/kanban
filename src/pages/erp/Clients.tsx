import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, UserCircle, Phone, Mail, MapPin, MessageCircle, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClients } from '@/hooks/useClients'
import { useContacts } from '@/hooks/useContacts'
import { validateCPF } from '@/lib/validators'
import { ContactCreateModal } from '@/components/contacts/ContactCreateModal'
import { ContactEditModal } from '@/components/contacts/ContactEditModal'
import type { Client, Contact } from '@/types/database'

export function Clients() {
  const navigate = useNavigate()
  const { chatwootUrl } = useChatwootUrl()
  const { activeClients, createClient, updateClient, isLoading, isCreating } = useClients()
  const { createContact, updateContact } = useContacts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isContactEditModalOpen, setIsContactEditModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [createdContactId, setCreatedContactId] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [cpfError, setCpfError] = useState('')
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone: '',
    email: '',
  })
  const [contactError, setContactError] = useState('')
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

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client)
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
      // Load contact data if exists
      if (client.contacts) {
        setContactFormData({
          name: client.contacts.name || '',
          phone: client.contacts.phone || '',
          email: client.contacts.email || '',
        })
      } else {
        setContactFormData({ name: '', phone: '', email: '' })
      }
    } else {
      setEditingClient(null)
      setFormData({
        full_name: '',
        cpf: '',
        rg_number: '',
        rg_issuer_state: '',
        rg_issue_date: '',
        birth_date: '',
        gender: null,
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
      setContactFormData({ name: '', phone: '', email: '' })
    }
    setContactError('')
    setIsDialogOpen(true)
  }

  const handleCreateContact = async () => {
    // Validate contact data
    if (!contactFormData.name.trim()) {
      setContactError('Nome do contato é obrigatório')
      return
    }
    if (!contactFormData.phone.trim() && !contactFormData.email.trim()) {
      setContactError('Telefone ou email é obrigatório')
      return
    }
    setContactError('')

    try {
      const result = await createContact({
        name: contactFormData.name,
        phone: contactFormData.phone || null,
        email: contactFormData.email || null,
        chatwoot_id: null,
      })

      if (result?.id && editingClient) {
        // Update client with new contact_id
        await updateClient({
          id: editingClient.id,
          updates: { contact_id: result.id },
        })
        setContactError('')
        // Reload to show updated contact
        window.location.reload()
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      setContactError('Erro ao criar contato')
    }
  }

  const handleUpdateContact = async () => {
    if (!editingClient?.contact_id) return

    // Validate contact data
    if (!contactFormData.name.trim()) {
      setContactError('Nome do contato é obrigatório')
      return
    }
    if (!contactFormData.phone.trim() && !contactFormData.email.trim()) {
      setContactError('Telefone ou email é obrigatório')
      return
    }
    setContactError('')

    try {
      await updateContact({
        contactId: editingClient.contact_id,
        updates: {
          name: contactFormData.name,
          phone: contactFormData.phone || null,
          email: contactFormData.email || null,
        },
      })
      setContactError('')
      // Reload to show updated contact
      window.location.reload()
    } catch (error) {
      console.error('Error updating contact:', error)
      setContactError('Erro ao atualizar contato')
    }
  }

  const handleNewClient = () => {
    // Abrir modal de contato primeiro
    setIsContactModalOpen(true)
  }

  const handleContactCreated = async (contactId: number) => {
    // Recebe o ID do contato (novo ou existente)
    if (contactId) {
      setCreatedContactId(contactId)
      setIsContactModalOpen(false)
      
      // Abrir modal de cliente primeiro (reseta formData)
      handleOpenDialog()
      
      // Buscar dados do contato para sugerir nome DEPOIS de abrir
      try {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('name')
          .eq('id', contactId)
          .single<{ name: string }>()
        
        if (contact) {
          // Sugerir nome do contato como nome completo do cliente
          setFormData(prev => ({
            ...prev,
            full_name: contact.name // Sugestão do nome
          }))
        }
      } catch (error) {
        console.error('Error fetching contact:', error)
      }
    }
  }

  const handleEditContact = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingContact(contact)
    setIsContactEditModalOpen(true)
  }

  const handleSaveContact = (contactId: number, updates: Partial<Contact>) => {
    updateContact({ contactId, updates })
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

    const clientData = {
      ...sanitizedData,
      contact_id: createdContactId, // Vincular ao contato criado
      source: 'balcao' as const,
      is_active: true,
    }

    if (editingClient) {
      updateClient({
        id: editingClient.id,
        updates: sanitizedData,
      })
    } else {
      createClient(clientData)
    }

    setIsDialogOpen(false)
    setCreatedContactId(null) // Limpar contact_id após criar cliente
  }

  // Filter clients by search term
  const filteredClients = activeClients.filter((client) =>
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm)
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">
            Gerenciar clientes do ERP ({activeClients.length} ativos)
          </p>
        </div>
        <Button onClick={handleNewClient} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client: Client) => (
          <Card
            key={client.id}
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/erp/clients/${client.id}`)}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                <UserCircle className="h-7 w-7 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">{client.full_name}</h3>
                <p className="text-sm text-slate-500">CPF: {client.cpf}</p>
                <div className="mt-2 flex items-center gap-1">
                  <Badge variant={client.source === 'crm' ? 'default' : 'secondary'} className="text-xs">
                    {client.source === 'crm' ? 'CRM' : 'Balcão'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {client.contacts?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  {client.contacts.phone}
                </div>
              )}
              {client.contacts?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="truncate">{client.contacts.email}</span>
                </div>
              )}
              {client.city && client.state && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {client.city} - {client.state}
                </div>
              )}
            </div>

            {/* Chatwoot Button */}
            {client.contact_id && client.contacts && client.contacts.chatwoot_id && client.contacts.chatwoot_id > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(
                      `${chatwootUrl}/app/accounts/1/contacts/${client.contacts!.chatwoot_id}`,
                      '_blank'
                    )
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Abrir no Chatwoot
                </Button>
              </div>
            )}

            {/* Edit Contact Button */}
            {client.contact_id && client.contacts && (
              <div className={client.contacts.chatwoot_id && client.contacts.chatwoot_id > 0 ? "mt-2" : "mt-4 pt-4 border-t border-slate-200"}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  onClick={(e) => handleEditContact(client.contacts!, e)}
                >
                  <Edit2 className="h-4 w-4" />
                  Editar Contato
                </Button>
              </div>
            )}

            {/* Create Contact Button - for clients without contact */}
            {!client.contact_id && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingClient(client)
                    handleOpenDialog(client)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Criar Contato
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500">Nenhum cliente encontrado</p>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente de Balcão'}
              </DialogTitle>
              <DialogDescription>
                {editingClient
                  ? 'Atualize os dados do cliente'
                  : 'Cadastre um novo cliente diretamente no ERP'}
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

                {/* Filiação */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="father_name">Nome do Pai</Label>
                    <Input
                      id="father_name"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_name">Nome da Mãe</Label>
                    <Input
                      id="mother_name"
                      value={formData.mother_name}
                      onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    />
                  </div>
                </div>

                {/* Naturalidade */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth_city">Cidade Natal</Label>
                    <Input
                      id="birth_city"
                      value={formData.birth_city}
                      onChange={(e) => setFormData({ ...formData, birth_city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_state">Estado</Label>
                    <Input
                      id="birth_state"
                      maxLength={2}
                      placeholder="SP"
                      value={formData.birth_state}
                      onChange={(e) => setFormData({ ...formData, birth_state: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth_country">País</Label>
                    <Input
                      id="birth_country"
                      value={formData.birth_country}
                      onChange={(e) => setFormData({ ...formData, birth_country: e.target.value })}
                    />
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address_complement">Complemento</Label>
                    <Input
                      id="address_complement"
                      value={formData.address_complement}
                      onChange={(e) => setFormData({ ...formData, address_complement: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
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

              {/* CNH (Autoescola) */}
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

              {/* Informações de Contato - Only show when editing existing client */}
              {editingClient && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold text-sm text-slate-700">
                      Informações de Contato
                    </h3>
                    {editingClient.contact_id && (
                      <Badge variant="secondary" className="text-xs">
                        Contato Vinculado
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Nome do Contato *</Label>
                      <Input
                        id="contact_name"
                        value={contactFormData.name}
                        onChange={(e) => setContactFormData({ ...contactFormData, name: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Telefone</Label>
                      <Input
                        id="contact_phone"
                        value={contactFormData.phone}
                        onChange={(e) => setContactFormData({ ...contactFormData, phone: e.target.value })}
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={contactFormData.email}
                        onChange={(e) => setContactFormData({ ...contactFormData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  {contactError && (
                    <p className="text-sm text-red-600">{contactError}</p>
                  )}

                  <div className="flex gap-2">
                    {editingClient?.contact_id ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUpdateContact}
                        className="gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Atualizar Contato
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCreateContact}
                        className="gap-2"
                        disabled={!editingClient}
                      >
                        <Plus className="h-4 w-4" />
                        {editingClient ? 'Criar Contato' : 'Salve o cliente primeiro'}
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {editingClient?.contact_id 
                      ? 'Edite as informações de contato e clique em "Atualizar Contato"'
                      : editingClient 
                        ? 'Preencha os dados e clique em "Criar Contato" para vincular um contato a este cliente'
                        : 'Salve o cliente primeiro para poder criar um contato'}
                  </p>
                </div>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações adicionais..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {editingClient ? 'Atualizar' : 'Cadastrar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contact Create Modal - Modo Balcão */}
      <ContactCreateModal
        open={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false)
          setCreatedContactId(null)
        }}
        onCreate={createContact}
        mode="balcao"
        onSuccess={handleContactCreated}
      />

      {/* Contact Edit Modal */}
      <ContactEditModal
        contact={editingContact}
        open={isContactEditModalOpen}
        onClose={() => setIsContactEditModalOpen(false)}
        onSave={handleSaveContact}
      />
    </div>
  )
}
