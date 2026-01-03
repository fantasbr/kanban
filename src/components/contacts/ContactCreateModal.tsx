import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useContacts } from '@/hooks/useContacts'

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
  const [chatwootId, setChatwootId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [forceCreateNew, setForceCreateNew] = useState(false)
  
  const { setPhoneSearchQuery, contactByPhone, isSearchingByPhone } = useContacts()

  // Debounce phone search
  useEffect(() => {
    if (!phone || phone.length < 10) {
      setPhoneSearchQuery('')
      return
    }

    const timer = setTimeout(() => {
      setPhoneSearchQuery(phone)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [phone, setPhoneSearchQuery])

  const handlePhoneChange = (value: string) => {
    setPhone(value)
    setForceCreateNew(false) // Reset when phone changes
  }

  const handleUseExisting = () => {
    if (contactByPhone && onSuccess) {
      onSuccess(contactByPhone.id)
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
    setForceCreateNew(false)
    setPhoneSearchQuery('')
    onClose()
  }

  // Verificar se deve mostrar contato existente
  const showExistingContact = contactByPhone && !forceCreateNew && phone.length >= 10

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
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
              Telefone {mode === 'balcao' && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+55 11 99999-9999"
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                required={mode === 'balcao'}
              />
              {isSearchingByPhone && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-600" />
              )}
            </div>
            {mode === 'balcao' && (
              <p className="text-xs text-slate-500">
                O sistema verificará se já existe um contato com este telefone
              </p>
            )}
          </div>

          {/* Mostrar contato existente se encontrado */}
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
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={handleUseExisting}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Usar Este Contato
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setForceCreateNew(true)}
                      className="flex-1"
                    >
                      Criar Novo Mesmo Assim
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Alerta se forçar criação de novo */}
          {forceCreateNew && contactByPhone && (
            <Card className="p-3 bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-sm text-yellow-800">
                  Você está criando um novo contato mesmo havendo um existente com este telefone.
                </p>
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
              (!!showExistingContact && !forceCreateNew)
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
