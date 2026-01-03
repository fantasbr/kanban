import { useState } from 'react'
import { DollarSign, Clock, CheckCircle, AlertCircle, Download, FileText, Search, MoreVertical, Receipt as ReceiptIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useReceivables, useReceipts } from '@/hooks/useFinancial'
import { useCompanies } from '@/hooks/useERPConfig'
import { usePaymentMethods } from '@/hooks/useERPConfig'
import { useContracts } from '@/hooks/useContracts'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ReceiptPDF } from '@/components/pdf/ReceiptPDF'
import { ContractDetailsModal } from '@/components/modals/ContractDetailsModal'
import { ReceiptActionsModal } from '@/components/modals/ReceiptActionsModal'
import type { Receivable, Contract, Receipt } from '@/types/database'
import { toast } from 'sonner'

export function Financial() {
  const { receivables, markAsPaid, isLoading: loadingReceivables, isMarkingAsPaid } = useReceivables()
  const { receipts, isLoading: loadingReceipts } = useReceipts()
  const { activeCompanies } = useCompanies()
  const { activePaymentMethods } = usePaymentMethods()
  const { contracts } = useContracts()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [companyFilter, setCompanyFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [receiptActionsModalOpen, setReceiptActionsModalOpen] = useState(false)
  const [generatedReceipt, setGeneratedReceipt] = useState<Receipt | null>(null)
  const [paymentData, setPaymentData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method_id: '',
    paid_value: '',
    notes: '',
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleOpenPaymentDialog = (receivable: Receivable) => {
    setSelectedReceivable(receivable)
    setPaymentData({
      payment_date: new Date().toISOString().split('T')[0],
      payment_method_id: '',
      paid_value: receivable.amount.toString(),
      notes: '',
    })
    setPaymentDialogOpen(true)
  }

  const handleMarkAsPaid = async () => {
    if (!selectedReceivable) return

    try {
      const result = await markAsPaid({
        receivableId: selectedReceivable.id,
        paidAmount: parseFloat(paymentData.paid_value),
        paymentMethodId: parseInt(paymentData.payment_method_id),
        generateReceipt: true,
      })
      
      toast.success('Pagamento registrado com sucesso!')
      
      // Close payment dialog
      setPaymentDialogOpen(false)
      setSelectedReceivable(null)
      
      // Open receipt actions modal with generated receipt
      if (result.receipt) {
        setGeneratedReceipt(result.receipt)
        setReceiptActionsModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast.error('Erro ao registrar pagamento. Tente novamente.')
    }
  }

  // Filtrar recebíveis
  const filteredReceivables = receivables.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (companyFilter !== 'all' && r.company_id?.toString() !== companyFilter) return false
    
    // Date range filter
    if (startDate) {
      const dueDate = parseISO(r.due_date)
      const start = parseISO(startDate)
      if (dueDate < start) return false
    }
    if (endDate) {
      const dueDate = parseISO(r.due_date)
      const end = parseISO(endDate)
      if (dueDate > end) return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const clientName = r.contracts?.clients?.full_name?.toLowerCase() || ''
      const contractNumber = r.contracts?.contract_number?.toLowerCase() || ''
      const amount = r.amount.toString()
      
      if (!clientName.includes(query) && !contractNumber.includes(query) && !amount.includes(query)) {
        return false
      }
    }
    
    return true
  })

  // Calcular métricas
  const totalPending = receivables
    .filter((r) => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalOverdue = receivables
    .filter((r) => r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalPaid= receivables
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + (r.paid_amount || 0), 0)

  const totalReceivables = receivables.reduce((sum, r) => sum + r.amount, 0)

  if (loadingReceivables || loadingReceipts) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando dados financeiros...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Financeiro</h1>
        <p className="text-slate-500 mt-1">Gestão de contas a receber e recibos</p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Total a Receber</span>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalReceivables)}</p>
          <p className="text-xs text-slate-500 mt-1">{receivables.length} parcelas</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Pendentes</span>
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {receivables.filter((r) => r.status === 'pending').length} parcelas
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Vencidas</span>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {receivables.filter((r) => r.status === 'overdue').length} parcelas
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-500">Recebido</span>
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          <p className="text-xs text-slate-500 mt-1">
            {receivables.filter((r) => r.status === 'paid').length} parcelas
          </p>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, contrato ou valor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="overdue">Vencidas</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {activeCompanies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="start-date" className="text-sm text-slate-600 mb-1.5 block">
              Data Inicial
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="end-date" className="text-sm text-slate-600 mb-1.5 block">
              Data Final
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          {(startDate || endDate) && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="w-full sm:w-auto"
              >
                Limpar Datas
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Receivables Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Vencimento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Parcela
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredReceivables
                .sort((a, b) => parseISO(a.due_date).getTime() - parseISO(b.due_date).getTime())
                .map((receivable) => {
                  const dueDate = parseISO(receivable.due_date)
                  const isOverdue = isPast(dueDate) && !isToday(dueDate) && receivable.status !== 'paid'

                  const statusColors: Record<string, string> = {
                    pending: 'bg-yellow-100 text-yellow-700',
                    overdue: 'bg-red-100 text-red-700',
                    paid: 'bg-green-100 text-green-700',
                    cancelled: 'bg-gray-100 text-gray-700',
                  }

                  const statusLabels: Record<string, string> = {
                    pending: 'Pendente',
                    overdue: 'Vencida',
                    paid: 'Paga',
                    cancelled: 'Cancelada',
                  }

                  return (
                    <TooltipProvider key={receivable.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            {isOverdue && receivable.status === 'pending' && (
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                            )}
                            <div>
                              <div className="font-medium">{format(dueDate, 'dd/MM/yyyy', { locale: ptBR })}</div>
                              {isOverdue && receivable.status === 'pending' && (
                                <span className="text-xs text-red-600">Vencida</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help">
                                <div className="font-medium">{receivable.contracts?.clients?.full_name || 'N/A'}</div>
                                <div className="text-xs text-slate-500">{receivable.contracts?.clients?.cpf || ''}</div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                <p className="font-semibold">{receivable.contracts?.clients?.full_name}</p>
                                <p className="text-xs">CPF: {receivable.contracts?.clients?.cpf}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                            {receivable.contracts?.contract_number || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{receivable.installment_number}</span>
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{receivable.contracts?.installments || '?'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span className="font-semibold text-slate-900">{formatCurrency(receivable.amount)}</span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <Badge className={statusColors[receivable.status]}>
                            {statusLabels[receivable.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {receivable.status !== 'paid' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenPaymentDialog(receivable)}>
                                      <DollarSign className="h-4 w-4 mr-2" />
                                      Registrar Pagamento
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                {receivable.contract_id && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const contract = contracts.find(c => c.id === receivable.contract_id)
                                      if (contract) {
                                        setSelectedContract(contract)
                                        setContractModalOpen(true)
                                      }
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Ver Contrato
                                  </DropdownMenuItem>
                                )}
                                {receivable.status === 'paid' && (
                                  <>
                                    <DropdownMenuItem>
                                      <ReceiptIcon className="h-4 w-4 mr-2" />
                                      Ver Recibo
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="h-4 w-4 mr-2" />
                                      Baixar Recibo
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    </TooltipProvider>
                  )
                })}
            </tbody>
          </table>

          {filteredReceivables.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhuma conta a receber encontrada</p>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Receipts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Recibos Recentes</h2>
          <Button variant="outline" size="sm">
            Ver Todos
          </Button>
        </div>
        <div className="space-y-3">
          {receipts.slice(0, 5).map((receipt) => (
            <div
              key={receipt.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{receipt.receipt_number}</p>
                <p className="text-xs text-slate-500">
                  {receipt.clients?.full_name} •{' '}
                  {format(parseISO(receipt.receipt_date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div className="text-right mr-4">
                <p className="font-semibold text-green-600">{formatCurrency(receipt.amount)}</p>
              </div>
              <PDFDownloadLink
                document={<ReceiptPDF receipt={receipt} />}
                fileName={`recibo-${receipt.receipt_number}.pdf`}
              >
                {({ loading }) => (
                  <Button size="sm" variant="ghost" disabled={loading}>
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
          ))}
          {receipts.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum recibo emitido</p>
          )}
        </div>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Registre o pagamento da parcela e gere o recibo automaticamente
            </DialogDescription>
          </DialogHeader>

          {selectedReceivable && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-slate-50 rounded-lg space-y-1">
                <p className="text-sm text-slate-500">Contrato</p>
                <p className="font-semibold">{selectedReceivable.contracts?.contract_number}</p>
                <p className="text-sm text-slate-500 mt-2">Cliente</p>
                <p className="font-medium">{selectedReceivable.contracts?.clients?.full_name}</p>
                <p className="text-sm text-slate-500 mt-2">Parcela</p>
                <p className="font-medium">
                  {selectedReceivable.installment_number} /{' '}
                  {selectedReceivable.contracts?.installments}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Data do Pagamento *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method_id">Forma de Pagamento *</Label>
                <Select
                  value={paymentData.payment_method_id}
                  onValueChange={(value) => setPaymentData({ ...paymentData, payment_method_id: value })}
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

              <div className="space-y-2">
                <Label htmlFor="paid_value">Valor Pago *</Label>
                <Input
                  id="paid_value"
                  type="number"
                  step="0.01"
                  value={paymentData.paid_value}
                  onChange={(e) => setPaymentData({ ...paymentData, paid_value: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Valor original: {formatCurrency(selectedReceivable.amount)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Input
                  id="notes"
                  placeholder="Anotações adicionais..."
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Atenção:</strong> Um recibo será gerado automaticamente após o registro do
                  pagamento.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={isMarkingAsPaid}>
              Cancelar
            </Button>
            <Button
              onClick={handleMarkAsPaid}
              disabled={!paymentData.payment_method_id || !paymentData.paid_value || isMarkingAsPaid}
            >
              {isMarkingAsPaid ? 'Processando...' : 'Confirmar Pagamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Details Modal */}
      {selectedContract && (
        <ContractDetailsModal
          contract={selectedContract}
          open={contractModalOpen}
          onOpenChange={setContractModalOpen}
        />
      )}

      {/* Receipt Actions Modal */}
      <ReceiptActionsModal
        open={receiptActionsModalOpen}
        onClose={() => {
          setReceiptActionsModalOpen(false)
          setGeneratedReceipt(null)
        }}
        receipt={generatedReceipt}
      />
    </div>
  )
}
