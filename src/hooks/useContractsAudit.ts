import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types/database'

export interface ContractsAuditItem {
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

export type ContractsAuditAction = 'created' | 'updated' | 'deleted' | 'status_changed'

interface UseContractsAuditOptions {
  limit?: number
  actions?: ContractsAuditAction[]
}

export function useContractsAudit(options: UseContractsAuditOptions = {}) {
  const { limit = 50, actions } = options

  const auditQuery = useQuery({
    queryKey: ['contracts-audit', limit, actions],
    queryFn: async () => {
      let query = supabase
        .from('erp_audit_log')
        .select('*')
        .eq('table_name', 'erp_contracts') // Filter only contracts
        .order('created_at', { ascending: false })
        .limit(limit)

      if (actions && actions.length > 0) {
        query = query.in('action', actions)
      }

      const { data, error } = await query

      if (error) throw error
      
      // Get unique client IDs from the audit logs
      const clientIds = [...new Set(
        (data || [])
          .map((item: AuditLog) => (item.new_values as Record<string, unknown>)?.client_id || (item.old_values as Record<string, unknown>)?.client_id)
          .filter(Boolean)
      )]

      // Fetch client names if we have client IDs
      let clientsMap: Record<number, string> = {}
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('erp_clients')
          .select('id, full_name')
          .in('id', clientIds)
        
        if (clients) {
          clientsMap = Object.fromEntries(
            (clients as Array<{ id: number; full_name: string }>).map(c => [c.id, c.full_name])
          )
        }
      }
      
      // Map table_name to entity_type and record_id to entity_id
      return (data || []).map((item: AuditLog) => {
        const clientId = ((item.new_values as Record<string, unknown>)?.client_id || (item.old_values as Record<string, unknown>)?.client_id) as number
        return {
          ...item,
          entity_type: 'contract',
          entity_id: String(item.record_id),
          metadata: {
            contract_number: item.new_values?.contract_number || item.old_values?.contract_number,
            client_name: clientsMap[clientId] || 'Cliente não encontrado',
            client_id: clientId,
            final_value: item.new_values?.final_value || item.old_values?.final_value,
          }
        }
      }) as ContractsAuditItem[]
    },
  })



  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('contracts-audit-realtime')
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
