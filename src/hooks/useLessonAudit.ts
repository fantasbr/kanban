import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface BasicUser {
  id: string
  email: string
  full_name: string
}

export interface LessonAuditEntry {
  id: number
  lesson_id: number
  action: string
  performed_by: string
  performed_at: string
  previous_status: string | null
  new_status: string
  reason: string | null
  metadata: {
    lesson_date: string
    start_time: string
    end_time?: string
    instructor_id: number
    vehicle_id: number
    contract_item_id: number
    duration_minutes?: number
  }
  user_email?: string
  user_name?: string
}

interface UseLessonAuditOptions {
  limit?: number
  lessonId?: number
  actions?: string[]
  startDate?: string
  endDate?: string
}

export function useLessonAudit(options: UseLessonAuditOptions = {}) {
  const { limit = 100, lessonId, actions, startDate, endDate } = options

  const auditQuery = useQuery({
    queryKey: ['lesson-audit', limit, lessonId, actions, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('lessons_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      // Filter by lesson ID if specified
      if (lessonId) {
        query = query.eq('lesson_id', lessonId)
      }

      // Filter by actions if specified
      if (actions && actions.length > 0) {
        query = query.in('action', actions)
      }

      // Filter by date range
      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch user emails for each entry
      const entries = data as LessonAuditEntry[]
      const userIds = [...new Set(entries.map(e => e.performed_by))]
      
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('system_users')
          .select('id, email, full_name')
          .in('id', userIds)

        const userMap = new Map((users as BasicUser[])?.map((u: BasicUser) => [u.id, u]) || [])
        
        entries.forEach(entry => {
          const user = userMap.get(entry.performed_by)
          if (user) {
            entry.user_email = user.email
            entry.user_name = user.full_name
          }
        })
      }

      return entries
    },
  })

  return {
    auditEntries: auditQuery.data ?? [],
    isLoading: auditQuery.isLoading,
    error: auditQuery.error,
    refetch: auditQuery.refetch,
  }
}
