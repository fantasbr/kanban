import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Pipeline, Stage, Deal } from '@/types/database'
import { useAuth } from './useAuth'

export function useKanban(pipelineId?: string) {
  const queryClient = useQueryClient()
  const { allowedInboxIds } = useAuth()

  // Fetch all pipelines filtered by user permissions
  const pipelinesQuery = useQuery({
    queryKey: ['all-pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .in('chatwoot_inbox_id', allowedInboxIds)
        .order('name')

      if (error) throw error
      return data as Pipeline[]
    },
    enabled: allowedInboxIds.length > 0,
  })

  // Fetch stages for a specific pipeline
  const stagesQuery = useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return []

      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('position')

      if (error) throw error
      return data as Stage[]
    },
    enabled: !!pipelineId,
  })

  // Fetch deals for a specific pipeline
  const dealsQuery = useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return []

      const { data, error } = await supabase
        .from('crm_deals')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .eq('pipeline_id', pipelineId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Deal[]
    },
    enabled: !!pipelineId,
  })

  // Update deal stage (for drag & drop)
  const updateDealStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      const { error } = await supabase
        .from('crm_deals')
        // @ts-expect-error - Supabase type inference issue with update
        .update({ stage_id: stageId })
        .eq('id', dealId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
    },
  })

  // Update deal details (for edit modal)
  const updateDealMutation = useMutation({
    mutationFn: async ({
      dealId,
      updates,
    }: {
      dealId: string
      updates: Partial<Deal>
    }) => {
      const { error } = await supabase
        .from('crm_deals')
        // @ts-expect-error - Supabase type inference issue with update
        .update(updates)
        .eq('id', dealId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
    },
  })

  // Create new deal
  const createDealMutation = useMutation({
    mutationFn: async ({
      pipeline_id,
      stage_id,
      title,
      deal_value_negotiated,
      priority,
      contact_id,
    }: {
      pipeline_id: string
      stage_id: string
      title: string
      deal_value_negotiated: number
      priority: 'low' | 'medium' | 'high'
      contact_id?: number | null
    }) => {
      const { error } = await supabase
        .from('crm_deals')
        // @ts-expect-error - Supabase type inference issue with insert
        .insert({
          pipeline_id,
          stage_id,
          title,
          deal_value_negotiated,
          priority,
          contact_id: contact_id || null,
          chatwoot_conversation_id: null,
          ai_summary: null,
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
    },
  })

  // Delete deal
  const deleteDealMutation = useMutation({
    mutationFn: async ({ dealId }: { dealId: string }) => {
      const { error } = await supabase
        .from('crm_deals')
        .delete()
        .eq('id', dealId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
    },
  })

  return {
    pipelines: pipelinesQuery.data ?? [],
    pipelinesLoading: pipelinesQuery.isLoading,
    stages: stagesQuery.data ?? [],
    stagesLoading: stagesQuery.isLoading,
    deals: dealsQuery.data ?? [],
    dealsLoading: dealsQuery.isLoading,
    updateDealStage: updateDealStageMutation.mutate,
    updateDeal: updateDealMutation.mutate,
    createDeal: createDealMutation.mutate,
    deleteDeal: deleteDealMutation.mutate,
    isUpdating: updateDealStageMutation.isPending || updateDealMutation.isPending,
    isCreating: createDealMutation.isPending,
    isDeleting: deleteDealMutation.isPending,
  }
}
