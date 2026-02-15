import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'


// Removed incorrect alias

export interface FinancialAuditItem {
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

export type FinancialAuditAction = 'created' | 'updated' | 'deleted' | 'paid' | 'received'
export type FinancialEntityType = 'receivable' | 'receipt'

interface UseFinancialAuditOptions {
  limit?: number
  actions?: FinancialAuditAction[]
  entityTypes?: FinancialEntityType[]
}

export function useFinancialAudit(options: UseFinancialAuditOptions = {}) {
  const { limit = 50, actions, entityTypes } = options

  const auditQuery = useQuery({
    queryKey: ['financial-audit', limit, actions, entityTypes],
    queryFn: async () => {
      let query = supabase
        .from('financial_audit_log')
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
      
      // Get unique receivable IDs to fetch contract info
      const receivableIds = [...new Set(
        (data || [])
          .filter((item: FinancialAuditItem) => item.entity_type === 'receivable') // Using entity_type from AuditLog which technically relies on table_name usually, but here checking dynamic field? AuditLog has 'table_name', 'action'. 'entity_type' is NOT in AuditLog interface in database.ts? 
          // Wait, database.ts AuditLog has: table_name, record_id, action, etc.
          // The query selects *. If financial_audit_log has entity_type, I need to extend AuditLog or use a specific type.
          // financial_audit_log is NOT erp_audit_log.
          // I should define a local interface for financial_audit_log items.
          .map((item: FinancialAuditItem) => parseInt(item.entity_id)) // Keeping any for now inside map if interface doesn't match, but wait.
          // I'll define a proper interface above.
          .filter(Boolean)
      )]

      // Fetch contract numbers for receivables
      let contractsMap: Record<number, string> = {}
      if (receivableIds.length > 0) {
        const { data: receivables } = await supabase
          .from('erp_receivables')
          .select('id, contract_id, erp_contracts(contract_number)')
          .in('id', receivableIds)
        
        if (receivables) {
          contractsMap = Object.fromEntries(
            (receivables as unknown as Array<{ id: number; erp_contracts: { contract_number: string } | null }>)
              .filter(r => r.erp_contracts)
              .map(r => [r.id, r.erp_contracts!.contract_number])
          )
        }
      }
      
      // Enrich metadata with contract_number
      return ((data as FinancialAuditItem[]) || []).map((item: FinancialAuditItem) => {
        if (item.entity_type === 'receivable') {
          const receivableId = parseInt(item.entity_id)
          const contractNumber = contractsMap[receivableId]
          
          return {
            ...item,
            metadata: {
              ...item.metadata,
              contract_number: contractNumber || item.metadata?.contract_number,
            }
          }
        }
        return item
      }) as FinancialAuditItem[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('financial-audit-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'financial_audit_log',
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
