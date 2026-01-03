import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contract, ContractItem } from '@/types/database'

export function useContracts() {
  const queryClient = useQueryClient()

  // Fetch all contracts with joins
  const contractsQuery = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contracts')
        .select(`
          *,
          companies:erp_companies(id, name, cnpj),
          clients:erp_clients(id, full_name, cpf),
          contract_types:erp_contract_types(id, name),
          payment_methods:erp_payment_methods(id, name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Contract[]
    },
  })

  // Fetch contracts by client
  const useContractsByClient = (clientId: number | undefined) => {
    return useQuery({
      queryKey: ['contracts', 'client', clientId],
      queryFn: async () => {
        if (!clientId) return []

        const { data, error } = await supabase
          .from('erp_contracts')
          .select(`
            *,
            companies:erp_companies(id, name),
            contract_types:erp_contract_types(id, name),
            payment_methods:erp_payment_methods(id, name)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as Contract[]
      },
      enabled: !!clientId,
    })
  }

  // Fetch contract by ID
  const useContract = (id: number | undefined) => {
    return useQuery({
      queryKey: ['contracts', id],
      queryFn: async () => {
        if (!id) return null

        const { data, error } = await supabase
          .from('erp_contracts')
          .select(`
            *,
            companies:erp_companies(id, name, cnpj, phone, email, address, city, state, zip_code, logo_url),
            clients:erp_clients(id, full_name, cpf, rg_number, address, city, state),
            contract_types:erp_contract_types(id, name),
            payment_methods:erp_payment_methods(id, name)
          `)
          .eq('id', id)
          .single()

        if (error) throw error
        return data as Contract
      },
      enabled: !!id,
    })
  }

  // Fetch contract items
  const useContractItems = (contractId: number | undefined) => {
    return useQuery({
      queryKey: ['contract-items', contractId],
      queryFn: async () => {
        if (!contractId) return []

        const { data, error } = await supabase
          .from('erp_contract_items')
          .select('*')
          .eq('contract_id', contractId)
          .order('id')

        if (error) throw error
        return data as ContractItem[]
      },
      enabled: !!contractId,
    })
  }

  // Generate contract number
  const generateContractNumberMutation = useMutation({
    mutationFn: async () => {
      // Buscar o maior número de contrato existente
      const { data, error } = await supabase
        .from('erp_contracts')
        .select('contract_number')
        .like('contract_number', 'CONT-%')
        .order('contract_number', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Erro ao buscar último contrato:', error)
        throw error
      }

      // Extrair número do último contrato
      let nextNumber = 1
      if (data && data.length > 0) {
        const lastNumber = (data[0] as { contract_number: string }).contract_number
        // Extrair apenas números do formato CONT-XXX
        const match = lastNumber.match(/CONT-(\d+)/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      // Formatar com zeros à esquerda (CONT-001, CONT-002, etc.)
      const formattedNumber = `CONT-${nextNumber.toString().padStart(3, '0')}`
      return formattedNumber
    },
  })

  // Create contract with items
  const createContractMutation = useMutation<
    Contract,
    Error,
    {
      contract: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'companies' | 'clients' | 'contract_types' | 'payment_methods'>
      items: Omit<ContractItem, 'id' | 'contract_id' | 'created_at'>[]
    }
  >({
    mutationFn: async ({
      contract,
      items,
    }: {
      contract: Omit<Contract, 'id' | 'created_at' | 'updated_at' | 'companies' | 'clients' | 'contract_types' | 'payment_methods'>
      items: Omit<ContractItem, 'id' | 'contract_id' | 'created_at'>[]
    }) => {
      // Insert contract
      const { data: contractData, error: contractError } = await supabase
        .from('erp_contracts')
        // @ts-expect-error - Supabase type inference issue
        .insert(contract)
        .select()
        .single()

      if (contractError) throw contractError

      // Insert items
      const itemsWithContractId = items.map((item) => ({
        ...item,
        // @ts-expect-error - Supabase type inference issue
        contract_id: contractData.id,
      }))

      const { error: itemsError } = await supabase
        .from('erp_contract_items')
        // @ts-expect-error - Supabase type inference issue
        .insert(itemsWithContractId)

      if (itemsError) throw itemsError

      // Generate receivables based on installments
      if (contract.installments > 0) {
        const installmentValue = contract.final_value / contract.installments
        const receivables = []

        for (let i = 0; i < contract.installments; i++) {
          const dueDate = new Date(contract.start_date)
          dueDate.setMonth(dueDate.getMonth() + i + 1)

          receivables.push({
            // @ts-expect-error - Supabase type inference issue
            contract_id: contractData.id,
            company_id: contract.company_id,
            client_id: contract.client_id,
            installment_number: i + 1,
            due_date: dueDate.toISOString().split('T')[0],
            amount: installmentValue,
            status: 'pending',
          })
        }

        const { error: receivablesError } = await supabase
          .from('erp_receivables')
          // @ts-expect-error - Supabase type inference issue
          .insert(receivables)

        if (receivablesError) throw receivablesError
      }

      return contractData as Contract
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
    },
  })

  // Update contract
  const updateContractMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Contract> }) => {
      const { error } = await supabase
        .from('erp_contracts')
        // @ts-expect-error - Supabase type inference issue
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.id] })
    },
  })

  // Cancel contract
  const cancelContractMutation = useMutation({
    mutationFn: async (id: number) => {
      // Update contract status
      const { error: contractError } = await supabase
        .from('erp_contracts')
        // @ts-expect-error - Supabase type inference issue
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)

      if (contractError) throw contractError

      // Delete pending receivables (status 'cancelled' doesn't exist in schema)
      const { error: receivablesError } = await supabase
        .from('erp_receivables')
        .delete()
        .eq('contract_id', id)
        .eq('status', 'pending')

      if (receivablesError) throw receivablesError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
    },
  })

  // Update contract status with reason (for audit)
  const updateContractStatusMutation = useMutation({
    mutationFn: async ({ 
      id, 
      newStatus, 
      reason 
    }: { 
      id: number
      newStatus: string
      reason: string 
    }) => {
      const { error } = await supabase
        .from('erp_contracts')
        // @ts-expect-error - Supabase type inference issue
        .update({ 
          status: newStatus,
          status_change_reason: reason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['contract-status-history', variables.id] })
    },
  })

  // Fetch contract status history
  const useContractStatusHistory = (contractId: number | undefined) => {
    return useQuery({
      queryKey: ['contract-status-history', contractId],
      queryFn: async () => {
        if (!contractId) return []

        const { data, error } = await supabase
          .from('erp_contract_status_history')
          .select('*')
          .eq('contract_id', contractId)
          .order('changed_at', { ascending: false })

        if (error) throw error
        
        // Return data with UUID as changed_by (will be displayed in UI)
        return (data || []).map((item: any) => ({
          ...item,
          changed_by: item.changed_by || 'Sistema'
        }))
      },
      enabled: !!contractId,
    })
  }

  return {
    contracts: contractsQuery.data ?? [],
    isLoading: contractsQuery.isLoading,
    createContract: createContractMutation.mutateAsync,
    updateContract: updateContractMutation.mutateAsync,
    updateContractStatus: updateContractStatusMutation.mutateAsync,
    cancelContract: cancelContractMutation.mutateAsync,
    generateContractNumber: generateContractNumberMutation.mutateAsync,
    isCreating: createContractMutation.isPending,
    isUpdating: updateContractMutation.isPending,
    isUpdatingStatus: updateContractStatusMutation.isPending,
    isGeneratingNumber: generateContractNumberMutation.isPending,
    generatedNumber: generateContractNumberMutation.data,
    // Helpers
    useContract,
    useContractsByClient,
    useContractItems,
    useContractStatusHistory,
  }
}
