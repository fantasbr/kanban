import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Pipeline } from '@/types/database'

export function usePipelines() {
  const queryClient = useQueryClient()

  const pipelinesQuery = useQuery({
    queryKey: ['all-pipelines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_pipelines')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data as Pipeline[]
    },
  })

  const createPipelineMutation = useMutation({
    mutationFn: async (pipeline: { name: string; chatwoot_inbox_id: string }) => {
      const { error } = await supabase
        .from('crm_pipelines')
        // @ts-expect-error - Supabase type inference issue
        .insert(pipeline)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-pipelines'] })
    },
  })

  const updatePipelineMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pipeline> }) => {
      const { error } = await supabase
        .from('crm_pipelines')
        // @ts-expect-error - Supabase type inference issue with Partial
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-pipelines'] })
    },
  })

  const deletePipelineMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('crm_pipelines')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-pipelines'] })
    },
    onError: (error) => {
      alert(`Erro ao deletar pipeline: ${error.message}`)
    },
  })

  return {
    pipelines: pipelinesQuery.data ?? [],
    isLoading: pipelinesQuery.isLoading,
    createPipeline: createPipelineMutation.mutate,
    updatePipeline: updatePipelineMutation.mutate,
    deletePipeline: deletePipelineMutation.mutate,
  }
}
