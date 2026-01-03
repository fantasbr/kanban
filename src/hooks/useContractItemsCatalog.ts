import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CatalogItem {
  id: number
  name: string
  description: string | null
  default_unit_price: number
  unit_type: string
  is_lesson: boolean
  vehicle_category: 'car' | 'motorcycle' | 'bus' | 'truck' | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useContractItemsCatalog() {
  const queryClient = useQueryClient()

  // Buscar todos os itens do catálogo ativos
  const catalogItemsQuery = useQuery({
    queryKey: ['contract-items-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_items_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as CatalogItem[]
    },
  })

  // Criar item no catálogo
  const createCatalogItemMutation = useMutation({
    mutationFn: async (item: Omit<CatalogItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('erp_contract_items_catalog')
        // @ts-expect-error - Supabase type inference issue
        .insert(item)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-items-catalog'] })
    },
  })

  // Atualizar item do catálogo
  const updateCatalogItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CatalogItem> }) => {
      const { error } = await supabase
        .from('erp_contract_items_catalog')
        // @ts-expect-error - Supabase type inference issue
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-items-catalog'] })
    },
  })

  // Deletar item do catálogo (soft delete)
  const deleteCatalogItemMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_contract_items_catalog')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-items-catalog'] })
    },
  })

  return {
    catalogItems: catalogItemsQuery.data ?? [],
    isLoading: catalogItemsQuery.isLoading,
    createCatalogItem: createCatalogItemMutation.mutateAsync,
    updateCatalogItem: updateCatalogItemMutation.mutateAsync,
    deleteCatalogItem: deleteCatalogItemMutation.mutateAsync,
    isCreating: createCatalogItemMutation.isPending,
    isUpdating: updateCatalogItemMutation.isPending,
    isDeleting: deleteCatalogItemMutation.isPending,
  }
}
