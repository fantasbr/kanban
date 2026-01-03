import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Contact } from '@/types/database'

interface ContactEditModalProps {
  contact: Contact | null
  open: boolean
  onClose: () => void
  onSave: (contactId: number, updates: Partial<Contact>) => void
}

export function ContactEditModal({ contact, open, onClose, onSave }: ContactEditModalProps) {
  const [name, setName] = useState(contact?.name || '')
  const [phone, setPhone] = useState(contact?.phone || '')
  const [email, setEmail] = useState(contact?.email || '')
  const [chatwootId, setChatwootId] = useState(contact?.chatwoot_id?.toString() || '')

  // Update state when contact changes
  if (contact && contact.name !== name && !name) {
    setName(contact.name)
    setPhone(contact.phone || '')
    setEmail(contact.email || '')
    setChatwootId(contact.chatwoot_id?.toString() || '')
  }

  const handleSave = () => {
    if (!contact) return

    onSave(contact.id, {
      name,
      phone: phone || null,
      email: email || null,
      chatwoot_id: chatwootId ? parseInt(chatwootId) : contact.chatwoot_id,
    })
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  if (!contact) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">Editar Contato</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">Atualize as informações do contato</p>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Avatar and ID Section */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100">
            {contact.profile_url ? (
              <img
                src={contact.profile_url}
                alt={contact.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {contact.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Chatwoot ID */}
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
                required
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">
                ID único do contato no Chatwoot. Use valores negativos para contatos de balcão.
              </p>
            </div>

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
                required
                className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+55 11 99999-9999"
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} className="px-6">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || !chatwootId.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
