import { useState } from 'react'
import { User, Phone, Mail, MapPin, FileText, DollarSign, Calendar, Clock, Edit2, CheckCircle2, XCircle, ShoppingCart, RefreshCw, GraduationCap } from 'lucide-react'
import { ContractStatusChangeModal } from './ContractStatusChangeModal'
import { ContractLessonsTab } from '@/components/contracts/ContractLessonsTab'
import { ContractStatusHistory } from '@/components/contract/ContractStatusHistory'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useReceivables } from '@/hooks/useFinancial'
import { usePaymentMethods } from '@/hooks/useERPConfig'
import { useContracts } from '@/hooks/useContracts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Contract, Receivable, Receipt } from '@/types/database'
import { formatCurrency, calculateInstallmentValue } from '@/lib/utils/currency'
import { CONTRACT_STATUS_COLORS, CONTRACT_STATUS_LABELS, type ContractStatus } from '@/types/contract'
import { toast } from 'sonner'
import { ReceiptActionsModal } from './ReceiptActionsModal'

interface ContractDetailsModalProps {
  contract: Contract
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractDetailsModal({ contract, open, onOpenChange }: ContractDetailsModalProps) {
  const { useReceivablesByContract, markAsPaid, updateReceivableDueDate, isMarkingAsPaid, isUpdatingDueDate } = useReceivables()
  const { activePaymentMethods } = usePaymentMethods()
  const { useContractItems, updateContractStatus, isUpdatingStatus, useContractStatusHistory } = useContracts()
  const { data: receivables, isLoading: loadingReceivables } = useReceivablesByContract(contract.id)
  const { data: contractItems, isLoading: loadingItems } = useContractItems(contract.id)
  const { data: statusHistory, isLoading: loadingHistory } = useContractStatusHistory(contract.id)
  
  const [editingDueDateId, setEditingDueDateId] = useState<number | null>(null)
  const [newDueDate, setNewDueDate] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false)
  const [receiptActionsModalOpen, setReceiptActionsModalOpen] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    paidAmount: '',
    paymentMethodId: '',
  })

  const handleEditDueDate = (receivable: Receivable) => {
    setEditingDueDateId(receivable.id)
    setNewDueDate(receivable.due_date)
  }

  const handleSaveDueDate = (receivableId: number) => {
    if (!newDueDate) {
      toast.error('Selecione uma data válida')
      return
    }

    updateReceivableDueDate(
      { id: receivableId, dueDate: newDueDate },
      {
        onSuccess: () => {
          toast.success('Data de vencimento atualizada!')
          setEditingDueDateId(null)
          setNewDueDate('')
        },
        onError: () => {
          toast.error('Erro ao atualizar data de vencimento')
        },
      }
    )
  }

  const handleOpenPaymentModal = (receivable: Receivable) => {
    setSelectedReceivable(receivable)
    setPaymentForm({
      paidAmount: receivable.amount.toString(),
      paymentMethodId: contract.payment_method_id?.toString() || '',
    })
    setPaymentModalOpen(true)
  }

  const handleRegisterPayment = async () => {
    if (!selectedReceivable) return

    const paidAmount = parseFloat(paymentForm.paidAmount)
    const paymentMethodId = parseInt(paymentForm.paymentMethodId)

    if (!paidAmount || paidAmount <= 0) {
      toast.error('Informe um valor válido')
      return
    }

    if (!paymentMethodId) {
      toast.error('Selecione uma forma de pagamento')
      return
    }

    try {
      const result = await markAsPaid({
        receivableId: selectedReceivable.id,
        paidAmount,
        paymentMethodId,
        generateReceipt: true,
      })
      
      toast.success('Pagamento registrado com sucesso!')
      
      // Close payment modal
      setPaymentModalOpen(false)
      setSelectedReceivable(null)
      setPaymentForm({ paidAmount: '', paymentMethodId: '' })
      
      // Open receipt actions modal
      if (result.receipt) {
        setGeneratedReceipt(result.receipt)
        setReceiptActionsModalOpen(true)
      }
    } catch (error) {
      console.error('Error registering payment:', error)
      toast.error('Erro ao registrar pagamento')
    }
  }

  const handleStatusChange = async (newStatus: ContractStatus, reason: string) => {
    try {
      await updateContractStatus({
        id: contract.id,
        newStatus,
        reason,
      })
      toast.success('Status atualizado com sucesso!')
      setStatusChangeModalOpen(false)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      paid: { label: 'Pago', className: 'bg-green-100 text-green-700' },
      overdue: { label: 'Vencido', className: 'bg-red-100 text-red-700' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-700' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Detalhes do Contrato</DialogTitle>
                <DialogDescription>{contract.contract_number}</DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={CONTRACT_STATUS_COLORS[contract.status as ContractStatus]}>
                  {CONTRACT_STATUS_LABELS[contract.status as ContractStatus]}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusChangeModalOpen(true)}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Alterar Status
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Dados Gerais</TabsTrigger>
              <TabsTrigger value="lessons">
                <GraduationCap className="h-4 w-4 mr-2" />
                Aulas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6 mt-6">
            {/* Client Information */}
            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Informações do Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Nome:</span>
                  <p className="font-medium">{contract.clients?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">CPF:</span>
                  <p className="font-medium">{contract.clients?.cpf || 'N/A'}</p>
                </div>
                {contract.clients?.contacts?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{contract.clients.contacts.phone}</span>
                  </div>
                )}
                {contract.clients?.contacts?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{contract.clients.contacts.email}</span>
                  </div>
                )}
                {contract.clients?.city && contract.clients?.state && (
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span>{contract.clients.city} - {contract.clients.state}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Contract Details */}
            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Detalhes do Contrato
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Empresa:</span>
                  <p className="font-medium">{contract.companies?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Tipo de Contrato:</span>
                  <p className="font-medium">{contract.contract_types?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Data de Início:</span>
                  <p className="font-medium">
                    {format(parseISO(contract.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Forma de Pagamento:</span>
                  <p className="font-medium">{contract.payment_methods?.name || 'N/A'}</p>
                </div>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Resumo Financeiro
              </h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Valor Total:</span>
                  <p className="font-semibold text-lg">{formatCurrency(contract.total_value)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Desconto:</span>
                  <p className="font-semibold text-lg text-red-600">-{formatCurrency(contract.discount)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Valor Final:</span>
                  <p className="font-semibold text-lg text-green-600">{formatCurrency(contract.final_value)}</p>
                </div>
                <div>
                  <span className="text-slate-500">Parcelas:</span>
                  <p className="font-semibold text-lg">
                    {contract.installments}x de {formatCurrency(calculateInstallmentValue(contract.final_value, contract.installments))}
                  </p>
                </div>
              </div>
            </Card>

            {/* Contract Items */}
            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
                Itens Contratados ({contractItems?.length || 0})
              </h3>
              
              {loadingItems ? (
                <div className="text-center py-8 text-slate-500">Carregando itens...</div>
              ) : contractItems && contractItems.length > 0 ? (
                <div className="space-y-2">
                  {contractItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center min-w-[40px]">
                          <div className="font-semibold text-purple-600">#{index + 1}</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{item.description}</div>
                          {item.catalog_item_id && (
                            <div className="text-xs text-slate-500 mt-1">
                              Ref. Catálogo: #{item.catalog_item_id}
                            </div>
                          )}
                        </div>

                        <div className="text-right min-w-[80px]">
                          <div className="text-sm text-slate-500">Quantidade</div>
                          <div className="font-semibold">{item.quantity}</div>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <div className="text-sm text-slate-500">Preço Unit.</div>
                          <div className="font-semibold">{formatCurrency(item.unit_price)}</div>
                        </div>

                        <div className="text-right min-w-[120px]">
                          <div className="text-sm text-slate-500">Total</div>
                          <div className="font-semibold text-green-600">{formatCurrency(item.total_price)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="font-semibold">Total dos Itens:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        contractItems.reduce((sum, item) => sum + item.total_price, 0)
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhum item encontrado
                </div>
              )}
            </Card>

            {/* Installments */}
            <Card className="p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Parcelas ({receivables?.length || 0})
              </h3>
              
              {loadingReceivables ? (
                <div className="text-center py-8 text-slate-500">Carregando parcelas...</div>
              ) : receivables && receivables.length > 0 ? (
                <div className="space-y-2">
                  {receivables.map((receivable) => (
                    <div
                      key={receivable.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-center min-w-[60px]">
                          <div className="text-xs text-slate-500">Parcela</div>
                          <div className="font-semibold">{receivable.installment_number}/{contract.installments}</div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {editingDueDateId === receivable.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="date"
                                  value={newDueDate}
                                  onChange={(e) => setNewDueDate(e.target.value)}
                                  className="w-40"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveDueDate(receivable.id)}
                                  disabled={isUpdatingDueDate}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingDueDateId(null)
                                    setNewDueDate('')
                                  }}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-slate-400" />
                                <span className="text-sm">
                                  Vencimento: {format(parseISO(receivable.due_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                                {receivable.status !== 'paid' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditDueDate(receivable)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                          {receivable.paid_date && (
                            <div className="text-xs text-green-600 mt-1">
                              Pago em: {format(parseISO(receivable.paid_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </div>
                          )}
                        </div>

                        <div className="text-right min-w-[120px]">
                          <div className="font-semibold">{formatCurrency(receivable.amount)}</div>
                          {receivable.paid_amount && receivable.paid_amount !== receivable.amount && (
                            <div className="text-xs text-slate-500">
                              Pago: {formatCurrency(receivable.paid_amount)}
                            </div>
                          )}
                        </div>

                        <div className="min-w-[100px]">
                          {getStatusBadge(receivable.status)}
                        </div>

                        <div>
                          {receivable.status === 'pending' || receivable.status === 'overdue' ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPaymentModal(receivable)}
                              disabled={isMarkingAsPaid}
                            >
                              Registrar Pagamento
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Nenhuma parcela encontrada
                </div>
              )}
            </Card>

            {/* Status History */}
            <ContractStatusHistory 
              history={statusHistory || []} 
              isLoading={loadingHistory}
            />

            {contract.notes && (
              <Card className="p-5">
                <h3 className="font-semibold text-lg mb-2">Observações</h3>
                <p className="text-sm text-slate-600">{contract.notes}</p>
              </Card>
            )}
            </TabsContent>

            <TabsContent value="lessons" className="mt-6">
              <ContractLessonsTab 
                contract={contract}
                items={contractItems || []}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Payment Registration Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Parcela {selectedReceivable?.installment_number} - Vencimento:{' '}
              {selectedReceivable && format(parseISO(selectedReceivable.due_date), 'dd/MM/yyyy', { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Valor Pago *</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                value={paymentForm.paidAmount}
                onChange={(e) => setPaymentForm({ ...paymentForm, paidAmount: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-slate-500">
                Valor da parcela: {selectedReceivable && formatCurrency(selectedReceivable.amount)}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Forma de Pagamento *</Label>
              <Select
                value={paymentForm.paymentMethodId}
                onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethodId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {activePaymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Atenção:</strong> Um recibo será gerado automaticamente após o registro do pagamento.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterPayment} disabled={isMarkingAsPaid}>
              {isMarkingAsPaid ? 'Registrando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Modal */}
      <ContractStatusChangeModal
        open={statusChangeModalOpen}
        onOpenChange={setStatusChangeModalOpen}
        currentStatus={contract.status as ContractStatus}
        contractId={contract.id}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdatingStatus}
      />

      {/* Receipt Actions Modal */}
      <ReceiptActionsModal
        open={receiptActionsModalOpen}
        onClose={() => {
          setReceiptActionsModalOpen(false)
          setGeneratedReceipt(null)
        }}
        receipt={generatedReceipt}
      />
    </>
  )
}
