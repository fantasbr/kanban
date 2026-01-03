import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, UserPlus } from 'lucide-react'
import { useClients } from '@/hooks/useClients'
import { useClientVerification } from '@/hooks/useClientVerification'
import { useKanban } from '@/hooks/useKanban'
import type { Deal, Contact, Client } from '@/types/database'
import { toast } from 'sonner'

interface ClientVerificationModalProps {
  isOpen: boolean
  deal: Deal | null
  contact: Contact | null
  onClose: () => void
  onClientLinked: (clientId: number) => void
  onContractPrompt: () => void
}

type VerificationStep = 'check' | 'register' | 'contract'

export function ClientVerificationModal({
  isOpen,
  deal,
  contact,
  onClose,
  onClientLinked,
  onContractPrompt,
}: ClientVerificationModalProps) {
  const [step, setStep] = useState<VerificationStep>('check')
  const [foundClient, setFoundClient] = useState<Client | null>(null)
  const { createClient, isCreating } = useClients()
  const { updateDeal } = useKanban('')
  
  const [formData, setFormData] = useState({
    full_name: contact?.name || '',
    cpf: '',
    address: '',
    city: '',
    state: '',
  })

  // Verificar cliente quando modal abre
  const { findClientByContact } = useClientVerification()
  
  useState(() => {
    if (isOpen && deal && !foundClient) {
      const client = findClientByContact(deal.contact_id)
      if (client) {
        setFoundClient(client)
        setStep('check')
      } else {
        setStep('check')
      }
    }
  })

  const handleLinkExisting = async () => {
    if (!foundClient || !deal) return
    
    try {
      await updateDeal({ dealId: deal.id, updates: { existing_client_id: foundClient.id } })
      onClientLinked(foundClient.id)
      setStep('contract')
    } catch {
      toast.error('Erro ao vincular cliente')
    }
  }

  const handleRegisterClient = async () => {
    if (!deal || !formData.cpf || !formData.full_name) {
      toast.error('Preencha CPF e Nome Completo')
      return
    }

    try {
      // Create client and await the result
      const newClient = await createClient({
        full_name: formData.full_name,
        cpf: formData.cpf,
        address: formData.address || null,
        address_number: null,
        address_complement: null,
        neighborhood: null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: null,
        rg_number: null,
        rg_issuer_state: null,
        rg_issue_date: null,
        birth_date: null,
        gender: null,
        father_name: null,
        mother_name: null,
        birth_country: 'Brasil',
        birth_state: null,
        birth_city: null,
        cnh_number: null,
        cnh_expiration_date: null,
        contact_id: deal.contact_id,
        source: 'crm',
        notes: null,
        is_active: true,
      })
      
      await updateDeal({ dealId: deal.id, updates: { existing_client_id: newClient.id } })
      onClientLinked(newClient.id)
      toast.success('Cliente cadastrado e vinculado!')
      setStep('contract')
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      toast.error('Erro ao cadastrar cliente')
    }
  }

  const handleCreateContract = () => {
    onContractPrompt()
    handleClose()
  }

  const handleDecideLater = async () => {
    if (!deal) return
    await updateDeal({ dealId: deal.id, updates: { needs_contract: true } })
    toast.info('Deal marcado. Contrato pendente.')
    handleClose()
  }

  const handleClose = () => {
    setStep('check')
    setFoundClient(null)
    onClose()
  }

  if (!deal) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {step === 'check' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {foundClient ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Cliente Encontrado!
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Cliente não cadastrado
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {foundClient
                  ? 'Este contato já é cliente ERP'
                  : 'Para marcar como ganho, cadastre o cliente no ERP'}
              </DialogDescription>
            </DialogHeader>

            {foundClient ? (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-slate-500">Nome:</span>
                    <p className="font-semibold">{foundClient.full_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">CPF:</span>
                    <p className="font-medium">{foundClient.cpf}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-sm text-slate-600">
                  Contato: <strong>{contact?.name || 'Sem nome'}</strong>
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              {foundClient ? (
                <Button onClick={handleLinkExisting}>
                  Vincular Cliente
                </Button>
              ) : (
                <Button onClick={() => setStep('register')} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Cadastrar Cliente
                </Button>
              )}
            </DialogFooter>
          </>
        )}

        {step === 'register' && (
          <>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do cliente para vinculá-lo ao deal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do cliente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>

              <p className="text-xs text-slate-500">
                * Campos obrigatórios. Outros dados podem ser completados depois.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('check')}>
                Voltar
              </Button>
              <Button onClick={handleRegisterClient} disabled={isCreating}>
                {isCreating ? 'Cadastrando...' : 'Cadastrar e Vincular'}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 'contract' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Cliente Vinculado!
              </DialogTitle>
              <DialogDescription>
                Deseja criar um contrato agora?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                <div>
                  <span className="text-sm text-slate-500">Cliente:</span>
                  <p className="font-semibold">{foundClient?.full_name || formData.full_name}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Valor do Deal:</span>
                  <p className="font-semibold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(deal.deal_value_negotiated)}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleDecideLater}>
                ⏭️ Depois
              </Button>
              <Button onClick={handleCreateContract}>
                📄 Criar Contrato
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
