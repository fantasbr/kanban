import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ErpAuditItem {
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

export type ErpAuditAction = 'created' | 'updated' | 'deleted'
export type ErpEntityType = 'client' | 'supplier'

interface UseErpAuditOptions {
  limit?: number
  actions?: ErpAuditAction[]
  entityTypes?: ErpEntityType[]
}

export function useErpAudit(options: UseErpAuditOptions = {}) {
  const { limit = 50, actions, entityTypes } = options

  const auditQuery = useQuery({
    queryKey: ['erp-audit', limit, actions, entityTypes],
    queryFn: async () => {
      let query = supabase
        .from('erp_audit_log')
        .select('*')
        .eq('table_name', 'erp_clients') // Filter only clients
        .order('created_at', { ascending: false })
        .limit(limit)

      if (actions && actions.length > 0) {
        query = query.in('action', actions)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Map table_name to entity_type and record_id to entity_id
      return (data || []).map((item: any) => ({
        ...item,
        entity_type: 'client',
        entity_id: String(item.record_id),
        metadata: {
          client_name: item.new_values?.full_name || item.old_values?.full_name,
          cpf: item.new_values?.cpf || item.old_values?.cpf,
          source: item.new_values?.source || item.old_values?.source,
        }
      })) as ErpAuditItem[]
    },
  })


  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('erp-audit-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'erp_audit_log',
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
