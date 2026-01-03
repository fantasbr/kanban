import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Pipeline, Stage, Deal } from '@/types/database'
import { toast } from 'sonner'

export function useKanban(pipelineId: string) {
  const queryClient = useQueryClient()

  // Fetch all pipelines
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Pipeline[]
    },
  })

  // Fetch stages for selected pipeline
  const { data: stages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: async () => {
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

  // Fetch deals for selected pipeline
  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', pipelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_deals')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .eq('pipeline_id', pipelineId)
        .eq('is_active', true) // Filtrar apenas deals ativos
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Deal[]
    },
    enabled: !!pipelineId,
  })

  // Update deal stage (for drag & drop) - using RPC for activity logging
  const updateDealStageMutation = useMutation({
    mutationFn: async ({ dealId, stageId }: { dealId: string; stageId: string }) => {
      // @ts-expect-error - RPC function not in generated types yet
      const { error } = await supabase.rpc('update_deal_stage', {
        p_deal_id: dealId,
        p_stage_id: stageId
      })

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

  // Soft delete deal (set is_active = false)
  const deleteDealMutation = useMutation({
    mutationFn: async ({ dealId }: { dealId: string }) => {
      const { error } = await supabase
        .from('crm_deals')
        // @ts-expect-error - Supabase type inference issue with update
        .update({ is_active: false })
        .eq('id', dealId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
      // Assuming 'toast' is imported or available globally
      // If not, you might need to add: import { toast } from 'your-toast-library';
      // For example: import { toast } from 'react-hot-toast';
      toast.success('Deal arquivado com sucesso')
    },
  })

  return {
    pipelines,
    pipelinesLoading,
    stages,
    stagesLoading,
    deals,
    dealsLoading,
    updateDealStage: (params: { dealId: string; stageId: string }) =>
      updateDealStageMutation.mutate(params),
    updateDeal: (params: { dealId: string; updates: Partial<Deal> }) =>
      updateDealMutation.mutate(params),
    createDeal: (params: {
      pipeline_id: string
      stage_id: string
      title: string
      deal_value_negotiated: number
      priority: 'low' | 'medium' | 'high'
      contact_id?: number | null
    }) => createDealMutation.mutate(params),
    deleteDeal: (params: { dealId: string }) => deleteDealMutation.mutate(params),
  }
}
