import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { Receivable, Receipt } from '@/types/database'
import type { ReceiptInsert, ReceivableUpdate } from '@/types/supabase-helpers'

export function useReceivables() {
  const queryClient = useQueryClient()

  // Fetch all receivables
  const receivablesQuery = useQuery({
    queryKey: ['receivables'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_receivables')
        .select(`
          *,
          companies:erp_companies(id, name),
          contracts:erp_contracts(
            id, 
            contract_number, 
            installments,
            clients:erp_clients(id, full_name, cpf)
          )
        `)
        .order('due_date')

      if (error) throw error
      return data as Receivable[]
    },
  })

  // Fetch receivables by status
  const useReceivablesByStatus = (status: 'pending' | 'paid' | 'overdue' | 'cancelled') => {
    return useQuery({
      queryKey: ['receivables', 'status', status],
      queryFn: async () => {
        const { data, error } = await db
          .from('erp_receivables')
          .select(`
            *,
            clients:erp_clients(id, full_name, cpf),
            companies:erp_companies(id, name),
            contracts:erp_contracts(id, contract_number)
          `)
          .eq('status', status)
          .order('due_date')

        if (error) throw error
        return data as Receivable[]
      },
    })
  }

  // Fetch receivables by client
  const useReceivablesByClient = (clientId: number | undefined) => {
    return useQuery({
      queryKey: ['receivables', 'client', clientId],
      queryFn: async () => {
        if (!clientId) return []

        const { data, error } = await db
          .from('erp_receivables')
          .select(`
            *,
            companies:erp_companies(id, name),
            contracts:erp_contracts(id, contract_number)
          `)
          .eq('client_id', clientId)
          .order('due_date')

        if (error) throw error
        return data as Receivable[]
      },
      enabled: !!clientId,
    })
  }

  // Fetch receivables by contract
  const useReceivablesByContract = (contractId: number | undefined) => {
    return useQuery({
      queryKey: ['receivables', 'contract', contractId],
      queryFn: async () => {
        if (!contractId) return []

        const { data, error } = await db
          .from('erp_receivables')
          .select('*')
          .eq('contract_id', contractId)
          .order('installment_number')

        if (error) throw error
        return data as Receivable[]
      },
      enabled: !!contractId,
    })
  }

  // Mark as paid and generate receipt
  const markAsPaidMutation = useMutation({
    mutationFn: async ({
      receivableId,
      paidAmount,
      paymentMethodId,
      generateReceipt = true,
    }: {
      receivableId: number
      paidAmount: number
      paymentMethodId: number
      generateReceipt?: boolean
    }) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!receivableId || receivableId <= 0 || !Number.isInteger(receivableId)) {
        throw new Error('ID do recebível inválido')
      }
      
      if (!paidAmount || paidAmount <= 0 || !Number.isFinite(paidAmount)) {
        throw new Error('Valor pago deve ser maior que zero')
      }
      
      if (!paymentMethodId || paymentMethodId <= 0 || !Number.isInteger(paymentMethodId)) {
        throw new Error('Método de pagamento inválido')
      }

      // Generate receipt first if requested
      let receiptData: Receipt | null = null
      let receiptNumber = null
      
      if (generateReceipt) {
        // Get receivable data for receipt creation
        const { data: currentReceivable, error: receivableError } = await db
          .from('erp_receivables')
          .select('company_id, client_id, installment_number')
          .eq('id', receivableId)
          .single()

        if (receivableError) {
          logger.error('[markAsPaid] Erro ao buscar recebível', { receivableId, error: receivableError })
          throw new Error('Não foi possível encontrar o recebível. Verifique se o ID está correto.')
        }
        
        if (!currentReceivable) {
          throw new Error('Recebível não encontrado')
        }

        // @ts-expect-error - Supabase RPC type inference issue
        const { data: generatedNumber } = await db.rpc('generate_document_number', {
          doc_type: 'receipt',
        })
        receiptNumber = generatedNumber

        // Temporário: TypeScript infere 'never' para currentReceivable
        // TODO: Remover quando tipos Supabase forem regenerados
        // @ts-ignore
        const receiptDataToInsert: ReceiptInsert = {
          company_id: (currentReceivable as any).company_id,
          // @ts-ignore
          client_id: (currentReceivable as any).client_id,
          receivable_id: receivableId,
          receipt_number: receiptNumber || '',
          receipt_date: new Date().toISOString().split('T')[0],
          amount: paidAmount,
          payment_method_id: paymentMethodId,
          // @ts-ignore
          description: `Pagamento da parcela ${(currentReceivable as any).installment_number}`,
          pdf_url: null,
        }

        const { error: receiptError, data: receipt } = await db
          .insert('erp_receipts', receiptDataToInsert)
          .select()
          .single()

        if (receiptError) {
          logger.error('[markAsPaid] Erro ao gerar recibo', { receivableId, error: receiptError })
          
          // Mensagens específicas por tipo de erro
          if (receiptError.code === '23505') {  // Unique violation
            throw new Error('Número de recibo já existe')
          }
          
          throw new Error('Erro ao gerar recibo. Tente novamente.')
        }
        receiptData = receipt as Receipt
      }

      // Single UPDATE with all fields including receipt_id (if generated)
      const updateData: ReceivableUpdate = {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        paid_amount: paidAmount,
        payment_method_id: paymentMethodId,
      }
      
      if (receiptData) {
        updateData.receipt_id = receiptData.id
      }

      // ✅ SEGURANÇA: Previne race condition - só atualiza se status='pending'
      const { data: receivableData, error: receivableError } = await db
        .update('erp_receivables', updateData)
        .eq('id', receivableId)
        .eq('status', 'pending')  // ✅ Só atualiza se ainda estiver pendente
        .select(`
          *,
          clients:erp_clients(id, full_name, cpf),
          companies:erp_companies(id, name, cnpj)
        `)
        .single()

      if (receivableError) {
        logger.error('[markAsPaid] Erro ao atualizar recebível', { receivableId, error: receivableError })
        throw new Error('Erro ao atualizar recebível')
      }
      
      if (!receivableData) {
        throw new Error('Recebível já foi pago ou não existe')
      }

      return { receivable: receivableData, receipt: receiptData }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })

  // Update overdue status (should be run periodically)
  const updateOverdueStatusMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split('T')[0]

      const updateData: ReceivableUpdate = { status: 'overdue' }

      const { error } = await db
        .update('erp_receivables', updateData)
        .eq('status', 'pending')
        .lt('due_date', today)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
    },
  })

  // Update receivable due date
  const updateReceivableDueDateMutation = useMutation({
    mutationFn: async ({ id, dueDate }: { id: number; dueDate: string }) => {
      const updateData: ReceivableUpdate = { due_date: dueDate }

      const { error } = await db
        .update('erp_receivables', updateData)
        .eq('id', id)
        .eq('status', 'pending') // ✅ SEGURANÇA: Só atualiza se estiver pendente (previne race condition)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
    },
  })

  return {
    receivables: receivablesQuery.data ?? [],
    isLoading: receivablesQuery.isLoading,
    markAsPaid: markAsPaidMutation.mutateAsync,
    updateOverdueStatus: updateOverdueStatusMutation.mutate,
    updateReceivableDueDate: updateReceivableDueDateMutation.mutate,
    isMarkingAsPaid: markAsPaidMutation.isPending,
    isUpdatingDueDate: updateReceivableDueDateMutation.isPending,
    // Helpers
    useReceivablesByStatus,
    useReceivablesByClient,
    useReceivablesByContract,
  }
}

// ============================================
// RECEIPTS HOOK
// ============================================

export function useReceipts() {
  const queryClient = useQueryClient()

  // Fetch all receipts
  const receiptsQuery = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_receipts')
        .select(`
          *,
          clients:erp_clients(id, full_name, cpf),
          companies:erp_companies(id, name, cnpj),
          payment_methods:erp_payment_methods(id, name)
        `)
        .order('receipt_date', { ascending: false })

      if (error) throw error
      return data as Receipt[]
    },
  })

  // Fetch receipts by client
  const useReceiptsByClient = (clientId: number | undefined) => {
    return useQuery({
      queryKey: ['receipts', 'client', clientId],
      queryFn: async () => {
        if (!clientId) return []

        const { data, error } = await db
          .from('erp_receipts')
          .select(`
            *,
            companies:erp_companies(id, name, cnpj),
            payment_methods:erp_payment_methods(id, name)
          `)
          .eq('client_id', clientId)
          .order('receipt_date', { ascending: false })

        if (error) throw error
        return data as Receipt[]
      },
      enabled: !!clientId,
    })
  }

  // Fetch receipt by ID
  const useReceipt = (id: number | undefined) => {
    return useQuery({
      queryKey: ['receipts', id],
      queryFn: async () => {
        if (!id) return null

        const { data, error } = await db
          .from('erp_receipts')
          .select(`
            *,
            clients:erp_clients(id, full_name, cpf, address, city, state),
            companies:erp_companies(id, name, cnpj, phone, email, address, city, state, logo_url),
            payment_methods:erp_payment_methods(id, name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        return data as Receipt
      },
      enabled: !!id,
    })
  }

  // Create manual receipt
  const createReceiptMutation = useMutation({
    mutationFn: async (receipt: ReceiptInsert) => {
      const { error, data } = await db
        .insert('erp_receipts', receipt)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
    },
  })

  return {
    receipts: receiptsQuery.data ?? [],
    isLoading: receiptsQuery.isLoading,
    createReceipt: createReceiptMutation.mutate,
    isCreating: createReceiptMutation.isPending,
    // Helpers
    useReceipt,
    useReceiptsByClient,
  }
}
