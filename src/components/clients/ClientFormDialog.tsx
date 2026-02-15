import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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
import { CPFInput } from '@/components/ui/cpf-input'
import type { Client, Contact } from '@/types/database'

// Component to show linked contact info
function ContactInfoCard({ contactId }: { contactId: number }) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [emailValue, setEmailValue] = useState('')
  const [isSavingEmail, setIsSavingEmail] = useState(false)

  useEffect(() => {
    const fetchContact = async () => {
      const { data } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('id', contactId)
        .single<Contact>()
      
      if (data) {
        setContact(data)
        // Auto-show email input if contact doesn't have email
        if (!data.email) {
          setShowEmailInput(true)
        }
      }
    }
    
    fetchContact()
  }, [contactId])

  const handleSaveEmail = async () => {
    if (!emailValue.trim() || !contact) return
    
    setIsSavingEmail(true)
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .update({ email: emailValue } as never)
        .eq('id', contactId)
      
      if (!error) {
        setContact({ ...contact, email: emailValue } as Contact)
        setShowEmailInput(false)
        toast.success('Email adicionado ao contato!')
      } else {
        toast.error('Erro ao salvar email')
      }
    } catch (error) {
      console.error('Error saving email:', error)
      toast.error('Erro ao salvar email')
    } finally {
      setIsSavingEmail(false)
    }
  }

  if (!contact) return null

  return (
    <Card className="p-4 bg-green-50 border-green-200 mt-4">
      <div className="flex items-start gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-green-900 text-sm">Contato Vinculado</p>
          <div className="mt-2 space-y-2">
            <p className="text-sm text-slate-700"><strong>Nome:</strong> {contact.name}</p>
            {contact.phone && <p className="text-sm text-slate-700"><strong>Telefone:</strong> {contact.phone}</p>}
            
            {/* Email section */}
            {contact.email ? (
              <p className="text-sm text-slate-700"><strong>Email:</strong> {contact.email}</p>
            ) : (
              <div className="space-y-2">
                {!showEmailInput ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailInput(true)}
                    className="text-xs"
                  >
                    + Adicionar Email (Opcional)
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                      ℹ️ Este contato não possui email cadastrado. Você pode adicionar agora ou pular.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="text-sm h-8"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveEmail}
                        disabled={!emailValue.trim() || isSavingEmail}
                        className="h-8 px-3 text-xs"
                      >
                        {isSavingEmail ? 'Salvando...' : 'Salvar'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmailInput(false)}
                        className="h-8 px-3 text-xs"
                      >
                        Pular
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

interface ClientFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (clientId: number) => void
  contactId?: number | null
  editingClient?: Client | null
  source?: 'balcao' | 'crm'
}

export function ClientFormDialog({
  isOpen,
  onClose,
  onSuccess,
  contactId,
  editingClient,
  source = 'balcao',
}: ClientFormDialogProps) {
  const navigate = useNavigate()
  const { systemUser } = useAuth()
  const { createClient, updateClient, isCreating } = useClients()
  const { createContact, updateContact } = useContacts()
  
  const [isCpfValid, setIsCpfValid] = useState(true)
  const [isCpfDuplicate, setIsCpfDuplicate] = useState(false)
  const [contactError, setContactError] = useState('')
  const [contactFormData, setContactFormData] = useState(() => ({
    name: editingClient?.contacts?.name || '',
    phone: editingClient?.contacts?.phone || '',
    email: editingClient?.contacts?.email || '',
  }))
  const [formData, setFormData] = useState(() => {
    if (editingClient) {
      return {
        full_name: editingClient.full_name,
        cpf: editingClient.cpf,
        rg_number: editingClient.rg_number || '',
        rg_issuer_state: editingClient.rg_issuer_state || '',
        rg_issue_date: editingClient.rg_issue_date || '',
        birth_date: editingClient.birth_date || '',
        gender: editingClient.gender || null,
        father_name: editingClient.father_name || '',
        mother_name: editingClient.mother_name || '',
        birth_country: editingClient.birth_country,
        birth_state: editingClient.birth_state || '',
        birth_city: editingClient.birth_city || '',
        address: editingClient.address || '',
        address_number: editingClient.address_number || '',
        address_complement: editingClient.address_complement || '',
        neighborhood: editingClient.neighborhood || '',
        city: editingClient.city || '',
        state: editingClient.state || '',
        zip_code: editingClient.zip_code || '',
        cnh_number: editingClient.cnh_number || '',
        cnh_expiration_date: editingClient.cnh_expiration_date || '',
        notes: editingClient.notes || '',
      }
    }
    return {
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
    }
  })

  // Load contact name when contactId changes
  useEffect(() => {
    if (contactId && !editingClient) {
      const fetchContact = async () => {
        const { data: contact } = await supabase
          .from('crm_contacts')
          .select('name')
          .eq('id', contactId)
          .single<{ name: string }>()
        
        if (contact) {
          setFormData(prev => ({ ...prev, full_name: contact.name }))
        }
      }
      fetchContact()
    }
  }, [contactId, editingClient])



  const handleCreateContact = async () => {
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
        await updateClient({
          id: editingClient.id,
          updates: { contact_id: result.id } as never,
        })
        setContactError('')
        window.location.reload()
      }
    } catch (error) {
      console.error('Error creating contact:', error)
      setContactError('Erro ao criar contato')
    }
  }

  const handleUpdateContact = async () => {
    if (!editingClient?.contact_id) return

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
      window.location.reload()
    } catch (error) {
      console.error('Error updating contact:', error)
      setContactError('Erro ao atualizar contato')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isCpfValid) {
      toast.error('CPF inválido')
      return
    }

    if (isCpfDuplicate) {
      toast.error('Este CPF já está cadastrado no sistema')
      return
    }

    // For new clients only: Check if contact_id already has a client
    if (!editingClient && contactId) {
      const { data: clientWithContact, error: contactCheckError } = await supabase
        .from('erp_clients')
        .select('id, full_name')
        .eq('contact_id', contactId)
        .maybeSingle<{ id: number; full_name: string }>()

      if (contactCheckError) {
        console.error('Error checking contact_id:', contactCheckError)
      }

      if (clientWithContact) {
        toast.error(`Este contato já possui um cliente: ${clientWithContact.full_name}`)
        navigate(`/erp/clients/${clientWithContact.id}`)
        onClose()
        return
      }
    }

    // Sanitize form data - convert empty strings to null
    const sanitizedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    ) as typeof formData

    const clientData = {
      ...sanitizedData,
      contact_id: contactId || null,
      source: source,
      is_active: true,
      created_by: systemUser?.id || null,
      updated_by: systemUser?.id || null,
    }

    // Validate contact_id for new clients
    if (!editingClient && !clientData.contact_id) {
      toast.error('Erro: Cliente deve estar vinculado a um contato.')
      return
    }

    try {
      let clientId: number | undefined
      
      if (editingClient) {
        await updateClient({
          id: editingClient.id,
          updates: {
            ...sanitizedData,
            updated_by: systemUser?.id || null,
          },
        })
        clientId = editingClient.id
        toast.success('Cliente atualizado com sucesso!')
      } else {
        const result = await createClient(clientData as never)
        clientId = result?.id
        toast.success('Cliente cadastrado com sucesso!')
      }

      onClose()
      
      if (clientId) {
        onSuccess(clientId)
      }
    } catch (error: unknown) {
      const dbError = error as { code?: string; message?: string }
      if (dbError.code === '23505') {
        if (dbError.message?.includes('cpf_key')) {
          toast.error('Este CPF já está cadastrado no sistema')
        } else if (dbError.message?.includes('contact_id')) {
          toast.error('Este contato já possui um cliente vinculado')
        } else {
          toast.error('Erro: Registro duplicado')
        }
      } else {
        toast.error('Erro ao salvar cliente')
        console.error('Error saving client:', error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : source === 'crm' ? 'Novo Cliente (CRM)' : 'Novo Cliente de Balcão'}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Atualize os dados do cliente'
                : 'Cadastre um novo cliente no ERP'}
            </DialogDescription>
          </DialogHeader>

          {/* Contact Info - Show when creating new client */}
          {!editingClient && contactId && (
            <ContactInfoCard contactId={contactId} />
          )}

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
                <CPFInput
                  value={formData.cpf}
                  onChange={(value) => {
                    setFormData({ ...formData, cpf: value })
                  }}
                  onValidationChange={(isValid, isDuplicate) => {
                    setIsCpfValid(isValid)
                    setIsCpfDuplicate(isDuplicate)
                  }}
                  excludeClientId={editingClient?.id}
                  required
                />
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
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !isCpfValid || isCpfDuplicate}
            >
              {editingClient ? 'Atualizar' : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
