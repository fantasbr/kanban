import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { Company, ContractType, PaymentMethod } from '@/types/database'
import type { 
  CompanyInsert, 
  CompanyUpdate, 
  ContractTypeInsert, 
  ContractTypeUpdate, 
  PaymentMethodInsert, 
  PaymentMethodUpdate 
} from '@/types/supabase-helpers'
import { isValidString, isValidCNPJ, isValidId } from '@/utils/validators'


// ============================================
// COMPANIES HOOK
// ============================================

export function useCompanies() {
  const queryClient = useQueryClient()

  // Fetch all companies
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_companies')
        .select('*')
        .order('name')

      if (error) {
        logger.error('[useCompanies] Erro ao buscar empresas', { error })
        throw error
      }
      return data as Company[]
    },
  })

  // Fetch active companies only
  const activeCompaniesQuery = useQuery({
    queryKey: ['companies', 'active'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        logger.error('[useCompanies] Erro ao buscar empresas ativas', { error })
        throw error
      }
      return data as Company[]
    },
  })

  // Create company
  const createCompanyMutation = useMutation({
    mutationFn: async (company: CompanyInsert) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidString(company.name, 3)) {
        throw new Error('Nome da empresa deve ter pelo menos 3 caracteres')
      }

      if (!isValidCNPJ(company.cnpj)) {
        throw new Error('CNPJ inválido')
      }

      const { error } = await db
        .insert('erp_companies', company)

      if (error) {
        logger.error('[createCompany] Erro ao criar empresa', { company, error })
        throw new Error('Erro ao criar empresa')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Update company
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: CompanyUpdate }) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidId(id)) {
        throw new Error('ID da empresa inválido')
      }

      const safeUpdates = { ...updates }
      if (safeUpdates.name !== undefined && !isValidString(safeUpdates.name, 3)) {
        throw new Error('Nome da empresa deve ter pelo menos 3 caracteres')
      }

      const { error } = await db
        .update('erp_companies', { ...safeUpdates, updated_at: new Date().toISOString() } as CompanyUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[updateCompany] Erro ao atualizar empresa', { id, updates, error })
        throw new Error('Erro ao atualizar empresa')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Deactivate company (soft delete)
  const deactivateCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidId(id)) {
        throw new Error('ID da empresa inválido')
      }

      const { error } = await db
        .update('erp_companies', { is_active: false, updated_at: new Date().toISOString() } as CompanyUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[deactivateCompany] Erro ao desativar empresa', { id, error })
        throw new Error('Erro ao desativar empresa')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  return {
    companies: companiesQuery.data ?? [],
    activeCompanies: activeCompaniesQuery.data ?? [],
    isLoading: companiesQuery.isLoading || activeCompaniesQuery.isLoading,
    createCompany: createCompanyMutation.mutate,
    updateCompany: updateCompanyMutation.mutate,
    deactivateCompany: deactivateCompanyMutation.mutate,
    isCreating: createCompanyMutation.isPending,
    isUpdating: updateCompanyMutation.isPending,
  }
}

// ============================================
// CONTRACT TYPES HOOK
// ============================================

export function useContractTypes() {
  const queryClient = useQueryClient()

  // Fetch all contract types
  const contractTypesQuery = useQuery({
    queryKey: ['contract-types'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_contract_types')
        .select('*')
        .order('name')

      if (error) {
        logger.error('[useContractTypes] Erro ao buscar tipos de contrato', { error })
        throw error
      }
      return data as ContractType[]
    },
  })

  // Fetch active contract types only
  const activeContractTypesQuery = useQuery({
    queryKey: ['contract-types', 'active'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_contract_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        logger.error('[useContractTypes] Erro ao buscar tipos de contrato ativos', { error })
        throw error
      }
      return data as ContractType[]
    },
  })

  // Create contract type
  const createContractTypeMutation = useMutation({
    mutationFn: async (contractType: ContractTypeInsert) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidString(contractType.name, 3)) {
        throw new Error('Nome do tipo de contrato deve ter pelo menos 3 caracteres')
      }

      const { error } = await db
        .insert('erp_contract_types', contractType)

      if (error) {
        logger.error('[createContractType] Erro ao criar tipo de contrato', { contractType, error })
        throw new Error('Erro ao criar tipo de contrato')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] })
    },
  })

  // Update contract type
  const updateContractTypeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: ContractTypeUpdate }) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!id || id <= 0 || !Number.isInteger(id)) {
        throw new Error('ID inválido')
      }

      const safeUpdates = { ...updates }
      if (safeUpdates.name !== undefined && !isValidString(safeUpdates.name, 3)) {
        throw new Error('Nome do tipo de contrato deve ter pelo menos 3 caracteres')
      }

      const { error } = await db
        .update('erp_contract_types', safeUpdates as ContractTypeUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[updateContractType] Erro ao atualizar tipo de contrato', { id, updates, error })
        throw new Error('Erro ao atualizar tipo de contrato')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] })
    },
  })

  // Deactivate contract type
  const deactivateContractTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!id || id <= 0 || !Number.isInteger(id)) {
        throw new Error('ID inválido')
      }

      const { error } = await db
        .update('erp_contract_types', { is_active: false } as ContractTypeUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[deactivateContractType] Erro ao desativar tipo de contrato', { id, error })
        throw new Error('Erro ao desativar tipo de contrato')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] })
    },
  })

  return {
    contractTypes: contractTypesQuery.data ?? [],
    activeContractTypes: activeContractTypesQuery.data ?? [],
    isLoading: contractTypesQuery.isLoading || activeContractTypesQuery.isLoading,
    createContractType: createContractTypeMutation.mutate,
    updateContractType: updateContractTypeMutation.mutate,
    deactivateContractType: deactivateContractTypeMutation.mutate,
    isCreating: createContractTypeMutation.isPending,
    isUpdating: updateContractTypeMutation.isPending,
  }
}

// ============================================
// PAYMENT METHODS HOOK
// ============================================

export function usePaymentMethods() {
  const queryClient = useQueryClient()

  // Fetch all payment methods
  const paymentMethodsQuery = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_payment_methods')
        .select('*')
        .order('name')

      if (error) {
        logger.error('[usePaymentMethods] Erro ao buscar métodos de pagamento', { error })
        throw error
      }
      return data as PaymentMethod[]
    },
  })

  // Fetch active payment methods only
  const activePaymentMethodsQuery = useQuery({
    queryKey: ['payment-methods', 'active'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        logger.error('[usePaymentMethods] Erro ao buscar métodos de pagamento ativos', { error })
        throw error
      }
      return data as PaymentMethod[]
    },
  })

  // Create payment method
  const createPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethod: PaymentMethodInsert) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidString(paymentMethod.name, 3)) {
        throw new Error('Nome do método de pagamento deve ter pelo menos 3 caracteres')
      }

      const { error } = await db
        .insert('erp_payment_methods', paymentMethod)

      if (error) {
        logger.error('[createPaymentMethod] Erro ao criar método de pagamento', { paymentMethod, error })
        throw new Error('Erro ao criar método de pagamento')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  // Update payment method
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: PaymentMethodUpdate }) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!id || id <= 0 || !Number.isInteger(id)) {
        throw new Error('ID inválido')
      }

      const safeUpdates = { ...updates }
      if (safeUpdates.name !== undefined && !isValidString(safeUpdates.name, 3)) {
        throw new Error('Nome do método de pagamento deve ter pelo menos 3 caracteres')
      }

      const { error } = await db
        .update('erp_payment_methods', updates)
        .eq('id', id)

      if (error) {
        logger.error('[updatePaymentMethod] Erro ao atualizar método de pagamento', { id, updates, error })
        throw new Error('Erro ao atualizar método de pagamento')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  // Deactivate payment method
  const deactivatePaymentMethodMutation = useMutation({
    mutationFn: async (id: number) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!id || id <= 0 || !Number.isInteger(id)) {
        throw new Error('ID inválido')
      }

      const { error } = await db
        .update('erp_payment_methods', { is_active: false } as PaymentMethodUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[deactivatePaymentMethod] Erro ao desativar método de pagamento', { id, error })
        throw new Error('Erro ao desativar método de pagamento')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  return {
    paymentMethods: paymentMethodsQuery.data ?? [],
    activePaymentMethods: activePaymentMethodsQuery.data ?? [],
    isLoading: paymentMethodsQuery.isLoading || activePaymentMethodsQuery.isLoading,
    createPaymentMethod: createPaymentMethodMutation.mutate,
    updatePaymentMethod: updatePaymentMethodMutation.mutate,
    deactivatePaymentMethod: deactivatePaymentMethodMutation.mutate,
    isCreating: createPaymentMethodMutation.isPending,
    isUpdating: updatePaymentMethodMutation.isPending,
  }
}
