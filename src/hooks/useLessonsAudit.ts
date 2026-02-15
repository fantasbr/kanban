import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface LessonsAuditItem {
  id: number
  action: string
  entity_type: string
  entity_id: string
  user_id?: string
  user_email?: string
  metadata?: Record<string, unknown>
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  created_at: string
}

export type LessonsAuditAction = 'created' | 'updated' | 'deleted' | 'completed' | 'cancelled'

interface UseLessonsAuditOptions {
  limit?: number
  actions?: LessonsAuditAction[]
}

export function useLessonsAudit(options: UseLessonsAuditOptions = {}) {
  const { limit = 50, actions } = options

  const auditQuery = useQuery({
    queryKey: ['lessons-audit', limit, actions],
    queryFn: async () => {
      let query = supabase
        .from('lessons_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (actions && actions.length > 0) {
        query = query.in('action', actions)
      }

      const { data, error } = await query

      if (error) throw error
      return data as LessonsAuditItem[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('lessons-audit-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons_audit_log',
        },
        () => {
          auditQuery.refetch()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {
        // Ignore errors when closing channel during unmount
      })
    }
  }, [auditQuery])

  return {
    items: auditQuery.data ?? [],
    isLoading: auditQuery.isLoading,
    error: auditQuery.error,
    refetch: auditQuery.refetch,
  }
}
