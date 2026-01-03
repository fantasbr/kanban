import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ContractTemplate } from '@/types/database'

export function useTemplates() {
  const queryClient = useQueryClient()

  // Fetch all templates
  const templatesQuery = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_templates')
        .select('*, contract_types:erp_contract_types(id, name)')
        .order('name')

      if (error) throw error
      return data as ContractTemplate[]
    },
  })

  // Fetch templates by type (contract or receipt)
  const useTemplatesByType = (type: 'contract' | 'receipt') => {
    return useQuery({
      queryKey: ['templates', type],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('erp_contract_templates')
          .select('*, contract_types:erp_contract_types(id, name)')
          .eq('type', type)
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        return data as ContractTemplate[]
      },
    })
  }

  // Fetch default template
  const useDefaultTemplate = (type: 'contract' | 'receipt') => {
    return useQuery({
      queryKey: ['templates', type, 'default'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('erp_contract_templates')
          .select('*')
          .eq('type', type)
          .eq('is_default', true)
          .eq('is_active', true)
          .single()

        if (error && error.code !== 'PGRST116') throw error // Ignore not found error
        return data as ContractTemplate | null
      },
    })
  }

  // Create template
  const createTemplateMutation = useMutation({
    mutationFn: async (template: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .insert(template)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Update template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ContractTemplate> }) => {
      const { error } = await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_contract_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  // Set template as default
  const setDefaultTemplateMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number; type: 'contract' | 'receipt' }) => {
      // First, unset all defaults for this type
      await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_default: false })
        .eq('type', type)

      // Then set the new default
      const { error } = await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutate,
    updateTemplate: updateTemplateMutation.mutate,
    deleteTemplate: deleteTemplateMutation.mutate,
    setDefaultTemplate: setDefaultTemplateMutation.mutate,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    // Helpers
    useTemplatesByType,
    useDefaultTemplate,
  }
}
