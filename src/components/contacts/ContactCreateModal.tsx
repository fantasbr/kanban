import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContactCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: {
    chatwoot_id: number
    name: string
    phone?: string | null
    email?: string | null
  }) => void
}

export function ContactCreateModal({ open, onClose, onCreate }: ContactCreateModalProps) {
  const [chatwootId, setChatwootId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const handleCreate = () => {
    if (!chatwootId.trim() || !name.trim()) return

    onCreate({
      chatwoot_id: parseInt(chatwootId),
      name,
      phone: phone || null,
      email: email || null,
    })

    // Reset form
    setChatwootId('')
    setName('')
    setPhone('')
    setEmail('')
    onClose()
  }

  const handleClose = () => {
    // Reset form on close
    setChatwootId('')
    setName('')
    setPhone('')
    setEmail('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader className="border-b border-slate-200 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-900">
            Novo Lead
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Cadastre um novo contato no sistema
          </p>
        </DialogHeader>

        <div className="space-y-4 py-6">
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
              className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              ID único do contato no Chatwoot
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

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={handleClose} className="px-6">
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!chatwootId.trim() || !name.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            Criar Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
