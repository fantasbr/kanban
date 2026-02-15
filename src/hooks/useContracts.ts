import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db'
import type { Contract, ContractItem } from '@/types/database'
import type { ContractInsert, ContractUpdate, ContractItemInsert, ReceivableInsert } from '@/types/supabase-helpers'
import { logger } from '@/lib/logger'
import { isValidId, isValidString } from '@/utils/validators'


export function useContracts() {
  const queryClient = useQueryClient()

  // Fetch all contracts with joins
  const contractsQuery = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await db
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

        const { data, error } = await db
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

        const { data, error } = await db
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

        const { data, error } = await db
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
      const { data, error } = await db
        .from('erp_contracts')
        .select('contract_number')
        .like('contract_number', 'CONT-%')
        .order('contract_number', { ascending: false })
        .limit(1)

      if (error) {
        logger.error('Erro ao buscar último contrato:', error)
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
      // ✅ SEGURANÇA: Validação de entrada completa
      if (!isValidId(contract.company_id)) {
        throw new Error('ID da empresa inválido')
      }

      if (!isValidId(contract.client_id)) {
        throw new Error('ID do cliente inválido')
      }

      if (!contract.final_value || contract.final_value <= 0 || !Number.isFinite(contract.final_value)) {
        throw new Error('Valor final deve ser maior que zero')
      }

      if (!contract.installments || contract.installments < 1 || !Number.isInteger(contract.installments)) {
        throw new Error('Número de parcelas deve ser um inteiro maior ou igual a 1')
      }

      if (!items || items.length === 0) {
        throw new Error('Contrato deve ter pelo menos um item')
      }

      // Validar datas
      if (!contract.start_date) {
        throw new Error('Data de início é obrigatória')
      }

      if (!contract.end_date) {
        throw new Error('Data de término é obrigatória')
      }

      const startDate = new Date(contract.start_date)
      const endDate = new Date(contract.end_date)
      
      if (isNaN(startDate.getTime())) {
        throw new Error('Data de início inválida')
      }

      if (isNaN(endDate.getTime())) {
        throw new Error('Data de término inválida')
      }

      if (endDate <= startDate) {
        throw new Error('Data de término deve ser posterior à data de início')
      }

      // Insert contract
      const { data: contractData, error: contractError } = await db
        .insert('erp_contracts', contract as ContractInsert)
        .select()
        .single()

      if (contractError) {
        logger.error('[createContract] Erro ao inserir contrato', { contract, error: contractError })
        throw new Error('Erro ao criar contrato. Verifique os dados e tente novamente.')
      }

      if (!contractData) {
        throw new Error('Contrato não foi criado')
      }

      const contractId = (contractData as Contract).id


      // Insert items
      const itemsWithContractId = items.map((item) => ({
        ...item,
        contract_id: contractId,
      }))

      const { error: itemsError } = await db
        .insert('erp_contract_items', itemsWithContractId as ContractItemInsert[])

      if (itemsError) {
        logger.error('[createContract] Erro ao inserir itens', { contractId, error: itemsError })
        throw new Error('Erro ao adicionar itens ao contrato')
      }


      // Generate receivables based on installments
      if (contract.installments > 0) {
        // ✅ SEGURANÇA: Arredondamento correto para evitar perda de centavos
        const installmentValue = Math.floor((contract.final_value / contract.installments) * 100) / 100
        const totalInstallments = installmentValue * contract.installments
        const lastInstallmentAdjustment = contract.final_value - totalInstallments
        
        const receivables = []

        for (let i = 0; i < contract.installments; i++) {
          const dueDate = new Date(contract.start_date)
          dueDate.setMonth(dueDate.getMonth() + i + 1)

          const isLastInstallment = i === contract.installments - 1
          const amount = isLastInstallment 
            ? installmentValue + lastInstallmentAdjustment 
            : installmentValue

          receivables.push({
            contract_id: contractId,
            company_id: contract.company_id,
            client_id: contract.client_id,
            installment_number: i + 1,
            due_date: dueDate.toISOString().split('T')[0],
            amount: amount,
            status: 'pending',
          })
        }

        const { error: receivablesError } = await db
          .insert('erp_receivables', receivables as ReceivableInsert[])


        if (receivablesError) {
          logger.error('[createContract] Erro ao gerar parcelas', { contractId, error: receivablesError })
          throw new Error('Erro ao gerar parcelas do contrato')
        }
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
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidId(id)) {
        throw new Error('ID do contrato inválido')
      }

      // Prevenir sobrescrita de campos críticos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { id: _, created_at: _created, companies: _companies, clients: _clients, contract_types: _types, payment_methods: _methods, ...safeUpdates } = updates as any

      // Validar valores se estiverem presentes
      if (safeUpdates.final_value !== undefined) {
        if (safeUpdates.final_value <= 0 || !Number.isFinite(safeUpdates.final_value)) {
          throw new Error('Valor final deve ser maior que zero')
        }
      }

      if (safeUpdates.installments !== undefined) {
        if (safeUpdates.installments < 1 || !Number.isInteger(safeUpdates.installments)) {
          throw new Error('Número de parcelas deve ser um inteiro maior ou igual a 1')
        }
      }

      const { error } = await db
        .update('erp_contracts', { ...safeUpdates, updated_at: new Date().toISOString() } as ContractUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[updateContract] Erro ao atualizar contrato', { id, updates: safeUpdates, error })
        throw new Error('Erro ao atualizar contrato')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.id] })
    },
  })

  // Cancel contract
  const cancelContractMutation = useMutation({
    mutationFn: async (id: number) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidId(id)) {
        throw new Error('ID do contrato inválido')
      }

      // ✅ SEGURANÇA: Previne race condition - só cancela se status='active'
      const { data: contractData, error: contractError } = await db
        .update('erp_contracts', { status: 'cancelled', updated_at: new Date().toISOString() } as ContractUpdate)
        .eq('id', id)
        .eq('status', 'active')  // ✅ Só cancela se estiver ativo
        .select()
        .single()

      if (contractError) {
        logger.error('[cancelContract] Erro ao cancelar contrato', { id, error: contractError })
        throw new Error('Erro ao cancelar contrato')
      }

      if (!contractData) {
        throw new Error('Contrato já foi cancelado ou não existe')
      }

      // Delete pending receivables
      const { error: receivablesError } = await db
        .from('erp_receivables')
        .delete()
        .eq('contract_id', id)
        .eq('status', 'pending')

      if (receivablesError) {
        logger.error('[cancelContract] Erro ao deletar parcelas pendentes', { id, error: receivablesError })
        throw new Error('Erro ao cancelar parcelas do contrato')
      }
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
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidId(id)) {
        throw new Error('ID do contrato inválido')
      }

      const validStatuses = ['active', 'cancelled', 'completed', 'suspended']
      if (!newStatus || !validStatuses.includes(newStatus)) {
        throw new Error(`Status inválido. Valores permitidos: ${validStatuses.join(', ')}`)
      }

      if (!isValidString(reason, 10)) {
        throw new Error('Motivo deve ter pelo menos 10 caracteres')
      }

      const { error } = await db
        .update('erp_contracts', { 
          status: newStatus,
          status_change_reason: reason.trim(),
          updated_at: new Date().toISOString() 
        } as ContractUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[updateContractStatus] Erro ao atualizar status', { id, newStatus, reason, error })
        throw new Error('Erro ao atualizar status do contrato')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['contracts', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['contract-status-history', variables.id] })
    },
  })

  // NOTE: Contract status history is now tracked via erp_audit_log
  // Use useContractsAudit hook instead for contract audit history


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
    // useContractStatusHistory removed - use useContractsAudit instead
  }
}
