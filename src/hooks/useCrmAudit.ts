import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CrmAuditItem {
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

export type CrmAuditAction = 'created' | 'updated' | 'deleted' | 'stage_changed'
export type CrmEntityType = 'contact' | 'deal' | 'pipeline' | 'stage'

interface UseCrmAuditOptions {
  limit?: number
  actions?: CrmAuditAction[]
  entityTypes?: CrmEntityType[]
}

export function useCrmAudit(options: UseCrmAuditOptions = {}) {
  const { limit = 50, actions, entityTypes } = options

  const auditQuery = useQuery({
    queryKey: ['crm-audit', limit, actions, entityTypes],
    queryFn: async () => {
      let query = supabase
        .from('crm_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (actions && actions.length > 0) {
        query = query.in('action', actions)
      }

      if (entityTypes && entityTypes.length > 0) {
        query = query.in('entity_type', entityTypes)
      }

      const { data, error } = await query

      if (error) throw error
      return data as CrmAuditItem[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('crm-audit-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_audit_log',
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
