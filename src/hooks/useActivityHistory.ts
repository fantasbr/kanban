import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Activity, ActivityType } from '@/types/activity'

interface UseActivityHistoryOptions {
  limit?: number
  activityTypes?: ActivityType[]
}

export function useActivityHistory(options: UseActivityHistoryOptions = {}) {
  const { limit = 50, activityTypes } = options

  const activitiesQuery = useQuery({
    queryKey: ['activity-history', limit, activityTypes],
    queryFn: async () => {
      let query = supabase
        .from('crm_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filtrar por tipos de atividade se especificado
      if (activityTypes && activityTypes.length > 0) {
        query = query.in('activity_type', activityTypes)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Activity[]
    },
  })

  return {
    activities: activitiesQuery.data ?? [],
    isLoading: activitiesQuery.isLoading,
    error: activitiesQuery.error,
    refetch: activitiesQuery.refetch,
  }
}
