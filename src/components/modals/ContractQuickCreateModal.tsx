import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCompanies, useContractTypes, usePaymentMethods } from '@/hooks/useERPConfig'
import { useContracts } from '@/hooks/useContracts'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { useKanban } from '@/hooks/useKanban'

interface ContractQuickCreateModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: number
  clientName: string
  dealValue: number
  dealId?: string
}

export function ContractQuickCreateModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  dealValue,
  dealId,
}: ContractQuickCreateModalProps) {
  const navigate = useNavigate()
  const { activeCompanies } = useCompanies()
  const { activeContractTypes } = useContractTypes()
  const { activePaymentMethods } = usePaymentMethods()
  const { createContract, generateContractNumber, isCreating } = useContracts()
  const { updateDeal } = useKanban()


  const [formData, setFormData] = useState({
    company_id: '',
    contract_type_id: '',
    total_value: dealValue.toString(),
    discount: '0',
    installments: '12',
    payment_method_id: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const finalValue = parseFloat(formData.total_value || '0') - parseFloat(formData.discount || '0')
  const installmentValue = formData.installments ? finalValue / parseInt(formData.installments) : 0

  const handleSubmit = async () => {
    if (!formData.company_id || !formData.contract_type_id || !formData.payment_method_id) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (parseFloat(formData.total_value) <= 0) {
      toast.error('Valor deve ser maior que zero')
      return
    }

    try {
      // Gerar número do contrato primeiro
      const contractNumber = await generateContractNumber()
      
      const newContract = await createContract({
        contract: {
          company_id: parseInt(formData.company_id),
          client_id: clientId,
          contract_type_id: parseInt(formData.contract_type_id),
          template_id: null,
          contract_number: contractNumber,
          total_value: parseFloat(formData.total_value),
          discount: parseFloat(formData.discount) || 0,
          final_value: finalValue,
          installments: parseInt(formData.installments),
          payment_method_id: parseInt(formData.payment_method_id),
          start_date: formData.start_date,
          end_date: null,
          status: 'active',
          pdf_url: null,
          notes: formData.notes || null,
        },
        items: [], // Sem itens por enquanto
      })

      // Arquivar o deal após criar contrato
      if (dealId && newContract) {
        await updateDeal({
          dealId,
          updates: {
            is_archived: true,
            archived_at: new Date().toISOString(),
            archived_reason: `Contrato ${contractNumber} criado`,
            contract_id: newContract.id,
          },
        })
      }

      toast.success('Contrato criado com sucesso!', {
        action: {
          label: 'Ver Contratos',
          onClick: () => navigate('/erp/contracts'),
        },
      })

      onClose()
    } catch (error) {
      console.error('Erro ao criar contrato:', error)
      toast.error('Erro ao criar contrato')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Contrato</DialogTitle>
          <DialogDescription>
            Criação rápida de contrato a partir do deal ganho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Cliente (read-only) */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-sm text-slate-500">Cliente:</span>
            <p className="font-semibold">{clientName}</p>
          </div>

          {/* Empresa */}
          <div className="space-y-2">
            <Label htmlFor="company_id">Empresa *</Label>
            <Select
              value={formData.company_id}
              onValueChange={(value) => setFormData({ ...formData, company_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa" />
              </SelectTrigger>
              <SelectContent>
                {activeCompanies.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">Nenhuma empresa cadastrada</div>
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

          {/* Tipo de Contrato */}
          <div className="space-y-2">
            <Label htmlFor="contract_type_id">Tipo de Contrato *</Label>
            <Select
              value={formData.contract_type_id}
              onValueChange={(value) => setFormData({ ...formData, contract_type_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {activeContractTypes.length === 0 ? (
                  <div className="p-2 text-sm text-slate-500">Nenhum tipo cadastrado</div>
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

          {/* Valores */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_value">Valor Total *</Label>
              <Input
                id="total_value"
                type="number"
                step="0.01"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Desconto</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Valor Final */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-blue-900">Valor Final:</span>
              <span className="text-lg font-bold text-blue-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(finalValue)}
              </span>
            </div>
          </div>

          {/* Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installments">Parcelas *</Label>
              <Input
                id="installments"
                type="number"
                min="1"
                value={formData.installments}
                onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
              />
              {parseInt(formData.installments) > 0 && (
                <p className="text-xs text-slate-500">
                  {parseInt(formData.installments)}x de{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(installmentValue)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method_id">Forma de Pagamento *</Label>
              <Select
                value={formData.payment_method_id}
                onValueChange={(value) => setFormData({ ...formData, payment_method_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activePaymentMethods.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500">Nenhuma forma cadastrada</div>
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

          {/* Data de Início */}
          <div className="space-y-2">
            <Label htmlFor="start_date">Data de Início *</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações adicionais..."
            />
          </div>

          <p className="text-xs text-slate-500">
            * Os itens do contrato podem ser adicionados na página de contratos
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isCreating}>
            {isCreating ? 'Criando...' : 'Criar Contrato'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
