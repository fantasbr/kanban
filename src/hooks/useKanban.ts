import { useEffect } from 'react'
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
        .select(`
          *, 
          contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url),
          companies:erp_companies(id, name),
          contract_templates:erp_contract_templates(id, name)
        `)
        .eq('pipeline_id', pipelineId)
        .eq('is_active', true) // Filtrar apenas deals ativos
        .eq('is_archived', false) // Excluir deals arquivados
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Deal[]
    },
    enabled: !!pipelineId,
  })

  // Realtime subscription for automatic sync
  useEffect(() => {
    if (!pipelineId) return

    const channel = supabase
      .channel(`deals-${pipelineId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'crm_deals',
          filter: `pipeline_id=eq.${pipelineId}`,
        },
        (_payload) => {
          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({ queryKey: ['deals', pipelineId] })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel).catch(() => {
        // Ignore errors when closing channel during unmount
      })
    }
  }, [pipelineId, queryClient])

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
      deal_value_negotiated,
      priority,
      contact_id,
      company_id,
      contract_template_id,
      items,
    }: {
      pipeline_id: string
      stage_id: string
      deal_value_negotiated: number
      priority: 'low' | 'medium' | 'high'
      contact_id: number
      company_id: number
      contract_type_id?: number | null
      contract_template_id?: number | null
      items?: { description: string; quantity: number; unit_price: number; total_price: number }[]
    }) => {
      // Create deal
      const { data: dealData, error: dealError } = await supabase
        .from('crm_deals')
        // @ts-expect-error - Supabase type inference issue with insert
        .insert({
          pipeline_id,
          stage_id,
          deal_value_negotiated,
          priority,
          contact_id,
          company_id,
          contract_template_id: contract_template_id || null,
          chatwoot_conversation_id: null,
          ai_summary: null,
        })
        .select()
        .single()

      if (dealError) throw dealError

      // Create items if provided
      if (items && items.length > 0 && dealData) {
        const { error: itemsError } = await supabase
          .from('crm_deal_items')
          .insert(
            items.map((item) => ({
              ...item,
              deal_id: (dealData as Deal).id,
            })) as never
          )

        if (itemsError) throw itemsError
      }
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
      contact_id: number
      company_id: number
      deal_value_negotiated: number
      priority: 'low' | 'medium' | 'high'
      items?: { description: string; quantity: number; unit_price: number; total_price: number }[]
      contract_type_id?: number | null
      contract_template_id?: number | null
    }) => createDealMutation.mutate(params),
    deleteDeal: (params: { dealId: string }) => deleteDealMutation.mutate(params),
  }
}
