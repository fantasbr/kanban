import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'
import { supabase } from '@/lib/supabase'
import { PhoneInput } from '@/components/ui/phone-input'

interface ContactCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: {
    chatwoot_id?: number | null
    name: string
    phone?: string | null
    email?: string | null
  }) => Promise<{ id: number }> // Retorna Promise com o contato criado
  mode?: 'crm' | 'balcao'
  onSuccess?: (contactId: number) => void
}

export function ContactCreateModal({ open, onClose, onCreate, mode = 'crm', onSuccess }: ContactCreateModalProps) {
  const navigate = useNavigate()
  const [chatwootId, setChatwootId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [existingClient, setExistingClient] = useState<{ id: number; full_name: string; cpf: string } | null>(null)
  
  const { setPhoneSearchQuery, contactByPhone, isSearchingByPhone } = useContacts()

  // Debounce phone search
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handlePhoneChange = (value: string) => {
    setPhone(value)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value || value.length < 10) {
      setPhoneSearchQuery('')
      setExistingClient(null)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      setPhoneSearchQuery(value)
    }, 500)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, []) // Empty dependency array is correct for cleanup of ref

  // Check if contact has existing client
  useEffect(() => {
    const checkExistingClient = async () => {
      if (!contactByPhone) {
        setExistingClient(null)
        return
      }

      const { data: client } = await supabase
        .from('erp_clients')
        .select('id, full_name, cpf')
        .eq('contact_id', contactByPhone.id)
        .maybeSingle()

      setExistingClient(client)
    }

    checkExistingClient()
  }, [contactByPhone])



  const handleUseExisting = () => {
    if (contactByPhone && onSuccess) {
      onSuccess(contactByPhone.id)
      handleClose()
    }
  }

  const handleOpenClient = () => {
    if (existingClient) {
      navigate(`/erp/clients/${existingClient.id}`)
      handleClose()
    }
  }

  const handleCreate = async () => {
    // Validação baseada no modo
    if (mode === 'crm' && !chatwootId.trim()) return
    if (!name.trim()) return

    // Gerar chatwoot_id apenas para modo CRM
    const finalChatwootId = mode === 'crm' ? parseInt(chatwootId) : null

    try {
      const result = await onCreate({
        chatwoot_id: finalChatwootId,
        name,
        phone: phone || null,
        email: email || null,
      })

      // Chamar callback de sucesso com o ID real do contato criado
      if (onSuccess && result?.id) {
        onSuccess(result.id)
      }

      // Reset form
      handleClose()
    } catch (error) {
      console.error('Erro ao criar contato:', error)
    }
  }

  const handleClose = () => {
    // Reset form on close
    setChatwootId('')
    setName('')
    setPhone('')
    setEmail('')

    setExistingClient(null)
    setPhoneSearchQuery('')
    onClose()
  }

  // Verificar se deve mostrar contato existente ou cliente existente
  const showExistingClient = existingClient && phone.length >= 10
  const showExistingContact = contactByPhone && !existingClient && phone.length >= 10

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            {mode === 'balcao' ? 'Novo Contato' : 'Novo Lead'}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 mt-1">
            {mode === 'balcao' 
              ? 'Cadastre as informações básicas do contato'
              : 'Cadastre um novo contato no sistema'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Chatwoot ID - Apenas para modo CRM */}
          {mode === 'crm' && (
            <div className="space-y-2">
              <Label htmlFor="chatwoot-id" className="text-sm font-semibold text-slate-700">
                Chatwoot ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="chatwoot-id"
                type="number"
                value={chatwootId}
                onChange={(e) => setChatwootId(e.target.value)}
                placeholder="Digite o ID do Chatwoot"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">
                ID único do contato no Chatwoot
              </p>
            </div>
          )}

          {/* Phone - Com validação */}
          <div className="relative">
            <PhoneInput
              value={phone}
              onChange={handlePhoneChange}
              required={mode === 'balcao'}
              label={mode === 'balcao' ? 'Telefone' : 'Telefone (opcional)'}
            />
            {isSearchingByPhone && (
              <Loader2 className="absolute right-3 top-8 h-4 w-4 animate-spin text-blue-600" />
            )}
            {mode === 'balcao' && (
              <p className="text-xs text-slate-500 mt-1">
                O sistema verificará se já existe um contato ou cliente com este telefone
              </p>
            )}
          </div>

          {/* Mostrar cliente existente se encontrado */}
          {showExistingClient && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-semibold text-green-900">Cliente Encontrado!</p>
                    <p className="text-sm text-green-700 mt-1">
                      Já existe um cliente cadastrado com este telefone:
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 space-y-1">
                    <p className="font-medium text-slate-900">{existingClient.full_name}</p>
                    <p className="text-sm text-slate-600">CPF: {existingClient.cpf}</p>
                    <p className="text-sm text-slate-600">{contactByPhone?.phone}</p>
                    {contactByPhone?.email && (
                      <p className="text-sm text-slate-600">{contactByPhone.email}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleOpenClient}
                    className="w-full bg-green-600 hover:bg-green-700 mt-2"
                  >
                    Abrir Cliente
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Mostrar contato existente se encontrado (sem cliente) */}
          {showExistingContact && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-semibold text-blue-900">Contato Encontrado!</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Já existe um contato com este telefone:
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 space-y-1">
                    <p className="font-medium text-slate-900">{contactByPhone.name}</p>
                    <p className="text-sm text-slate-600">{contactByPhone.phone}</p>
                    {contactByPhone.email && (
                      <p className="text-sm text-slate-600">{contactByPhone.email}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUseExisting}
                    className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
                  >
                    Usar Este Contato
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
              Nome Completo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome completo"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} className="px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              (mode === 'crm' ? (!chatwootId.trim() || !name.trim()) : (!name.trim() || !phone.trim())) ||
              !!showExistingContact ||
              !!showExistingClient
            }
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {mode === 'balcao' ? 'Criar Contato' : 'Criar Lead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
