import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CatalogItem } from './useContractItemsCatalog'

export interface ContractTemplate {
  id: number
  contract_type_id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TemplateItem {
  id: number
  template_id: number
  catalog_item_id: number
  quantity: number
  display_order: number
  created_at: string
  catalog_item?: CatalogItem
}

export interface TemplateWithItems extends ContractTemplate {
  items: TemplateItem[]
}

export function useContractTemplates() {
  const queryClient = useQueryClient()

  // Buscar todos os templates ativos
  const templatesQuery = useQuery({
    queryKey: ['contract-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_templates')
        .select('*')
        .eq('is_active', true)
        .order('contract_type_id')
        .order('name')

      if (error) throw error
      return data as ContractTemplate[]
    },
  })

  // Buscar templates por tipo de contrato
  const useTemplatesByType = (contractTypeId: number | undefined) => {
    return useQuery({
      queryKey: ['contract-templates', 'type', contractTypeId],
      queryFn: async () => {
        if (!contractTypeId) return []

        const { data, error } = await supabase
          .from('erp_contract_templates')
          .select('*')
          .eq('contract_type_id', contractTypeId)
          .eq('is_active', true)
          .order('name')

        if (error) throw error
        return data as ContractTemplate[]
      },
      enabled: !!contractTypeId,
    })
  }

  // Buscar template com seus itens
  const useTemplateWithItems = (templateId: number | undefined) => {
    return useQuery({
      queryKey: ['contract-templates', 'with-items', templateId],
      queryFn: async () => {
        if (!templateId) return null

        // Buscar template
        const { data: template, error: templateError } = await supabase
          .from('erp_contract_templates')
          .select('*')
          .eq('id', templateId)
          .single()

        if (templateError) throw templateError

        // Buscar itens do template com informações do catálogo
        const { data: items, error: itemsError } = await supabase
          .from('erp_contract_template_items')
          .select(`
            *,
            catalog_item:erp_contract_items_catalog(*)
          `)
          .eq('template_id', templateId)
          .order('display_order')

        if (itemsError) throw itemsError

        return {
          ...template,
          items: items as TemplateItem[],
        } as TemplateWithItems
      },
      enabled: !!templateId,
    })
  }

  // Criar template com itens
  const createTemplateMutation = useMutation({
    mutationFn: async ({
      template,
      items,
    }: {
      template: Omit<ContractTemplate, 'id' | 'created_at' | 'updated_at'>
      items: Array<{ catalog_item_id: number; quantity: number; display_order: number }>
    }) => {
      // Criar template
      const { data: templateData, error: templateError } = await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .insert(template)
        .select()
        .single()

      if (templateError) throw templateError

      // Criar itens do template
      const templateItems = items.map((item) => ({
        template_id: (templateData as { id: number }).id,
        ...item,
      }))

      const { error: itemsError } = await supabase
        .from('erp_contract_template_items')
        // @ts-expect-error - Supabase type inference issue
        .insert(templateItems)

      if (itemsError) throw itemsError

      return templateData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] })
    },
  })

  // Atualizar template
  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ContractTemplate> }) => {
      const { error } = await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] })
    },
  })

  // Deletar template (soft delete)
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_contract_templates')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] })
    },
  })

  // Atualizar itens de um template
  const updateTemplateItemsMutation = useMutation({
    mutationFn: async ({
      templateId,
      items,
    }: {
      templateId: number
      items: Array<{ catalog_item_id: number; quantity: number; display_order: number }>
    }) => {
      // Deletar itens existentes
      const { error: deleteError } = await supabase
        .from('erp_contract_template_items')
        .delete()
        .eq('template_id', templateId)

      if (deleteError) throw deleteError

      // Inserir novos itens
      const templateItems = items.map((item) => ({
        template_id: templateId,
        ...item,
      }))

      const { error: insertError } = await supabase
        .from('erp_contract_template_items')
        // @ts-expect-error - Supabase type inference issue
        .insert(templateItems)

      if (insertError) throw insertError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-templates'] })
    },
  })

  return {
    templates: templatesQuery.data ?? [],
    isLoading: templatesQuery.isLoading,
    createTemplate: createTemplateMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    updateTemplateItems: updateTemplateItemsMutation.mutateAsync,
    isCreating: createTemplateMutation.isPending,
    isUpdating: updateTemplateMutation.isPending,
    isDeleting: deleteTemplateMutation.isPending,
    useTemplatesByType,
    useTemplateWithItems,
  }
}
