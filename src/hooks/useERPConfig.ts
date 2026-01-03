import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Company, ContractType, PaymentMethod } from '@/types/database'

// ============================================
// COMPANIES HOOK
// ============================================

export function useCompanies() {
  const queryClient = useQueryClient()

  // Fetch all companies
  const companiesQuery = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_companies')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Company[]
    },
  })

  // Fetch active companies only
  const activeCompaniesQuery = useQuery({
    queryKey: ['companies', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_companies')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as Company[]
    },
  })

  // Create company
  const createCompanyMutation = useMutation({
    mutationFn: async (company: Omit<Company, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('erp_companies')
        // @ts-expect-error - Supabase type inference issue
        .insert(company)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Update company
  const updateCompanyMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Company> }) => {
      const { error } = await supabase
        .from('erp_companies')
        // @ts-expect-error - Supabase type inference issue
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })

  // Deactivate company (soft delete)
  const deactivateCompanyMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_companies')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
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
      const { data, error } = await supabase
        .from('erp_contract_types')
        .select('*')
        .order('name')

      if (error) throw error
      return data as ContractType[]
    },
  })

  // Fetch active contract types only
  const activeContractTypesQuery = useQuery({
    queryKey: ['contract-types', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as ContractType[]
    },
  })

  // Create contract type
  const createContractTypeMutation = useMutation({
    mutationFn: async (contractType: Omit<ContractType, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('erp_contract_types')
        // @ts-expect-error - Supabase type inference issue
        .insert(contractType)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] })
    },
  })

  // Update contract type
  const updateContractTypeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ContractType> }) => {
      const { error } = await supabase
        .from('erp_contract_types')
        // @ts-expect-error - Supabase type inference issue
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-types'] })
    },
  })

  // Deactivate contract type
  const deactivateContractTypeMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_contract_types')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
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
      const { data, error } = await supabase
        .from('erp_payment_methods')
        .select('*')
        .order('name')

      if (error) throw error
      return data as PaymentMethod[]
    },
  })

  // Fetch active payment methods only
  const activePaymentMethodsQuery = useQuery({
    queryKey: ['payment-methods', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as PaymentMethod[]
    },
  })

  // Create payment method
  const createPaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethod: Omit<PaymentMethod, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('erp_payment_methods')
        // @ts-expect-error - Supabase type inference issue
        .insert(paymentMethod)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  // Update payment method
  const updatePaymentMethodMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<PaymentMethod> }) => {
      const { error } = await supabase
        .from('erp_payment_methods')
        // @ts-expect-error - Supabase type inference issue
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
  })

  // Deactivate payment method
  const deactivatePaymentMethodMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_payment_methods')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
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
