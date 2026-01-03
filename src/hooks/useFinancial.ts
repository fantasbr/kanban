import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Receivable, Receipt } from '@/types/database'

export function useReceivables() {
  const queryClient = useQueryClient()

  // Fetch all receivables
  const receivablesQuery = useQuery({
    queryKey: ['receivables'],
    queryFn: async () => {
      const { data, error } = await supabase
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
        const { data, error } = await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
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
      // Update receivable
      const { data: receivableData, error: receivableError } = await supabase
        .from('erp_receivables')
        // @ts-expect-error - Supabase type inference issue
        .update({
          status: 'paid',
          paid_date: new Date().toISOString().split('T')[0],
          paid_amount: paidAmount,
          payment_method_id: paymentMethodId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', receivableId)
        .select(`
          *,
          clients:erp_clients(id, full_name, cpf),
          companies:erp_companies(id, name, cnpj)
        `)
        .single()

      if (receivableError) throw receivableError

      // Generate receipt if requested
      if (generateReceipt) {
        // @ts-expect-error - Supabase RPC type inference issue
        const { data: receiptNumber } = await supabase.rpc('generate_document_number', {
          doc_type: 'receipt',
        })

        const{ error: receiptError, data: receiptData } = await supabase
          .from('erp_receipts')
          // @ts-expect-error - Supabase type inference issue
          .insert({
            // @ts-expect-error - Supabase type inference issue
            company_id: receivableData.company_id,
            // @ts-expect-error - Supabase type inference issue
            client_id: receivableData.client_id,
            receivable_id: receivableId,
            receipt_number: receiptNumber,
            receipt_date: new Date().toISOString().split('T')[0],
            amount: paidAmount,
            payment_method_id: paymentMethodId,
            // @ts-expect-error - Supabase type inference issue
            description: `Pagamento da parcela ${receivableData.installment_number}`,
          })
          .select()
          .single()

        if (receiptError) throw receiptError

        // Update receivable with receipt_id
        await supabase
          .from('erp_receivables')
          // @ts-expect-error - Supabase type inference issue
          .update({ receipt_id: receiptData.id })
          .eq('id', receivableId)

        return { receivable: receivableData, receipt: receiptData }
      }

      return { receivable: receivableData, receipt: null }
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

      const { error } = await supabase
        .from('erp_receivables')
        // @ts-expect-error - Supabase type inference issue
        .update({ status: 'overdue' })
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
      const { error } = await supabase
        .from('erp_receivables')
        // @ts-expect-error - Supabase type inference issue
        .update({ due_date: dueDate })
        .eq('id', id)

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
      const { data, error } = await supabase
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

        const { data, error } = await supabase
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

        const { data, error } = await supabase
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
    mutationFn: async (receipt: Omit<Receipt, 'id' | 'created_at' | 'clients' | 'companies' | 'payment_methods'>) => {
      const { error, data } = await supabase
        .from('erp_receipts')
        // @ts-expect-error - Supabase type inference issue
        .insert(receipt)
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
