import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DealItem } from '@/types/database'
import { toast } from 'sonner'
import { useAuth } from './useAuth'

export function useDealItems(dealId?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Fetch items for a specific deal
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['deal-items', dealId],
    queryFn: async () => {
      if (!dealId) return []
      
      const { data, error } = await supabase
        .from('crm_deal_items')
        .select('*')
        .eq('deal_id', dealId)
        .order('id')

      if (error) throw error
      return data as DealItem[]
    },
    enabled: !!dealId,
  })

  // Create items for a deal
  const createItemsMutation = useMutation({
    mutationFn: async ({
      dealId: targetDealId,
      items: newItems,
    }: {
      dealId: string
      items: Omit<DealItem, 'id' | 'deal_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]
    }) => {
      const itemsToInsert = newItems.map((item) => ({
        ...item,
        deal_id: targetDealId,
        created_by: user?.id || null,
        updated_by: user?.id || null,
      }))

      const { error } = await supabase
        .from('crm_deal_items')
        .insert(itemsToInsert as never)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deal-items', variables.dealId] })
      toast.success('Itens salvos com sucesso')
    },
    onError: (error) => {
      console.error('Error creating deal items:', error)
      toast.error('Erro ao salvar itens')
    },
  })

  // Update an item
  const updateItemMutation = useMutation({
    mutationFn: async ({
      itemId,
      updates,
    }: {
      itemId: number
      updates: Partial<Omit<DealItem, 'id' | 'deal_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>>
    }) => {
      const { error } = await supabase
        .from('crm_deal_items')
        .update({
          ...updates,
          updated_by: user?.id || null,
        } as never)
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ['deal-items', dealId] })
      }
    },
  })

  // Delete an item
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const { error } = await supabase
        .from('crm_deal_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: () => {
      if (dealId) {
        queryClient.invalidateQueries({ queryKey: ['deal-items', dealId] })
      }
      toast.success('Item removido')
    },
  })

  return {
    items,
    isLoading,
    createItems: (params: Parameters<typeof createItemsMutation.mutate>[0]) =>
      createItemsMutation.mutate(params),
    updateItem: (params: Parameters<typeof updateItemMutation.mutate>[0]) =>
      updateItemMutation.mutate(params),
    deleteItem: (itemId: number) => deleteItemMutation.mutate(itemId),
  }
}
