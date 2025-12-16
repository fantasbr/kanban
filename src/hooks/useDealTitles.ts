import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { DealTitle, Database } from '@/types/database'

export function useDealTitles() {
  return useQuery({
    queryKey: ['deal-titles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_deal_titles')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) throw error
      return data as DealTitle[]
    },
  })
}

export function useAllDealTitles() {
  return useQuery({
    queryKey: ['deal-titles', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_deal_titles')
        .select('*')
        .order('title', { ascending: true })

      if (error) throw error
      return data as DealTitle[]
    },
  })
}

export function useCreateDealTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ title, value_default }: { title: string; value_default: number | null }) => {
      type InsertType = Database['public']['Tables']['crm_deal_titles']['Insert']
      const insertData: InsertType = { title, is_active: true, value_default }
      
      const { data, error } = await supabase
        .from('crm_deal_titles')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data as DealTitle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-titles'] })
    },
  })
}

export function useUpdateDealTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title, value_default }: { id: string; title: string; value_default?: number | null }) => {
      type UpdateType = Database['public']['Tables']['crm_deal_titles']['Update']
      const updateData: UpdateType = { title }
      if (value_default !== undefined) {
        updateData.value_default = value_default
      }
      
      const { data, error } = await supabase
        .from('crm_deal_titles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DealTitle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-titles'] })
    },
  })
}

export function useToggleDealTitleActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      type UpdateType = Database['public']['Tables']['crm_deal_titles']['Update']
      const updateData: UpdateType = { is_active }
      
      const { data, error } = await supabase
        .from('crm_deal_titles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as DealTitle
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-titles'] })
    },
  })
}

export function useDeleteDealTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_deal_titles')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-titles'] })
    },
  })
}
