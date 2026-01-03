import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Stage } from '@/types/database'

export function useStages(pipelineId: string) {
  const queryClient = useQueryClient()

  const stagesQuery = useQuery({
    queryKey: ['stages', pipelineId],
    queryFn: async () => {
      if (!pipelineId) return []

      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true })

      if (error) throw error
      return data as Stage[]
    },
    enabled: !!pipelineId,
  })

  const createStageMutation = useMutation({
    mutationFn: async (stage: { pipeline_id: string; name: string; is_default?: boolean; is_won?: boolean }) => {
      // Get max position
      const { data: stages } = await supabase
        .from('crm_stages')
        .select('position')
        .eq('pipeline_id', stage.pipeline_id)
        .order('position', { ascending: false })
        .limit(1)

      // @ts-expect-error - Supabase type inference issue
      const nextPosition = stages && stages.length > 0 ? stages[0].position + 1 : 1

      // If marking as won, unset other won stages in the same pipeline
      if (stage.is_won) {
        await supabase
          .from('crm_stages')
          // @ts-expect-error - Supabase type inference issue
          .update({ is_won: false })
          .eq('pipeline_id', stage.pipeline_id)
          .eq('is_won', true)
      }

      const { error } = await supabase
        .from('crm_stages')
        // @ts-expect-error - Supabase type inference issue
        .insert({
          ...stage,
          position: nextPosition,
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Stage> }) => {
      // If marking as won, first get the pipeline_id and unset other won stages
      if (updates.is_won) {
        // Get the pipeline_id of this stage
        const { data: stageData } = await supabase
          .from('crm_stages')
          .select('pipeline_id')
          .eq('id', id)
          .single()

        if (stageData) {
          // Unset other won stages in the same pipeline
          await supabase
            .from('crm_stages')
            // @ts-expect-error - Supabase type inference issue
            .update({ is_won: false })
            // @ts-expect-error - Supabase type inference issue
            .eq('pipeline_id', stageData.pipeline_id)
            .eq('is_won', true)
            .neq('id', id)
        }
      }

      const { error } = await supabase
        .from('crm_stages')
        // @ts-expect-error - Supabase type inference issue with Partial
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })

  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_stages')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })

  const reorderStagesMutation = useMutation({
    mutationFn: async (stages: { id: string; position: number }[]) => {
      const updates = stages.map((stage) =>
        supabase
          .from('crm_stages')
          // @ts-expect-error - Supabase type inference issue
          .update({ position: stage.position })
          .eq('id', stage.id)
      )

      await Promise.all(updates)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stages'] })
    },
  })

  return {
    stages: stagesQuery.data ?? [],
    isLoading: stagesQuery.isLoading,
    createStage: createStageMutation.mutate,
    updateStage: updateStageMutation.mutate,
    deleteStage: deleteStageMutation.mutate,
    reorderStages: reorderStagesMutation.mutate,
  }
}
