import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { InstructorBlock, InstructorPreferences, Database } from '@/types/database'

export function useInstructorSettings(instructorId?: number) {
  const queryClient = useQueryClient()

  const { data: blocks = [], isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['instructor-blocks', instructorId],
    queryFn: async () => {
      if (!instructorId) return []
      const { data, error } = await supabase
        .from('erp_instructor_blocks')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('start_date', { ascending: false })

      if (error) throw error
      return data as InstructorBlock[]
    },
    enabled: !!instructorId,
  })

  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['instructor-preferences', instructorId],
    queryFn: async () => {
      if (!instructorId) return null
      const { data, error } = await supabase
        .from('erp_instructor_preferences')
        .select('*')
        .eq('instructor_id', instructorId)
        .maybeSingle()

      if (error) throw error
      return (data as unknown as InstructorPreferences) || null
    },
    enabled: !!instructorId,
  })

  const addBlock = useMutation({
    mutationFn: async (block: Database['public']['Tables']['erp_instructor_blocks']['Insert']) => {
      const { data, error } = await supabase
        .from('erp_instructor_blocks')
        .insert(block as unknown as never)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-blocks', instructorId] })
    },
  })

  const deleteBlock = useMutation({
    mutationFn: async (blockId: number) => {
      const { error } = await supabase
        .from('erp_instructor_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-blocks', instructorId] })
    },
  })

  const updatePreferences = useMutation({
    mutationFn: async (prefs: Partial<InstructorPreferences>) => {
      if (!instructorId) throw new Error('Instructor ID is required')

      const { data, error } = await supabase
        .from('erp_instructor_preferences')
        .upsert({ ...prefs, instructor_id: instructorId } as never)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructor-preferences', instructorId] })
    },
  })

  return {
    blocks,
    preferences,
    isLoading: isLoadingBlocks || isLoadingPreferences,
    addBlock,
    deleteBlock,
    updatePreferences,
  }
}
