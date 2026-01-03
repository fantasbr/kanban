import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AuditLog } from '@/types/database'

export function useAuditLog() {
  // Fetch all audit logs
  const auditLogsQuery = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100) // Limitar a 100 registros mais recentes

      if (error) throw error
      return data as AuditLog[]
    },
  })

  // Fetch logs by table
  const useLogsByTable = (tableName: string | undefined) => {
    return useQuery({
      queryKey: ['audit-logs', 'table', tableName],
      queryFn: async () => {
        if (!tableName) return []

        const { data, error } = await supabase
          .from('erp_audit_log')
          .select('*')
          .eq('table_name', tableName)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return data as AuditLog[]
      },
      enabled: !!tableName,
    })
  }

  // Fetch logs by record (table + record_id)
  const useLogsByRecord = (tableName: string | undefined, recordId: number | undefined) => {
    return useQuery({
      queryKey: ['audit-logs', 'record', tableName, recordId],
      queryFn: async () => {
        if (!tableName || !recordId) return []

        const { data, error } = await supabase
          .from('erp_audit_log')
          .select('*')
          .eq('table_name', tableName)
          .eq('record_id', recordId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as AuditLog[]
      },
      enabled: !!tableName && !!recordId,
    })
  }

  // Fetch logs by user
  const useLogsByUser = (userId: string | undefined) => {
    return useQuery({
      queryKey: ['audit-logs', 'user', userId],
      queryFn: async () => {
        if (!userId) return []

        const { data, error } = await supabase
          .from('erp_audit_log')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        return data as AuditLog[]
      },
      enabled: !!userId,
    })
  }

  // Fetch logs by action type
  const useLogsByAction = (action: 'create' | 'update' | 'delete' | undefined) => {
    return useQuery({
      queryKey: ['audit-logs', 'action', action],
      queryFn: async () => {
        if (!action) return []

        const { data, error } = await supabase
          .from('erp_audit_log')
          .select('*')
          .eq('action', action)
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        return data as AuditLog[]
      },
      enabled: !!action,
    })
  }

  // Fetch logs with multiple filters
  const useFilteredLogs = (filters: {
    tableName?: string
    action?: 'create' | 'update' | 'delete'
    userId?: string
    dateFrom?: string
    dateTo?: string
  }) => {
    return useQuery({
      queryKey: ['audit-logs', 'filtered', filters],
      queryFn: async () => {
        let query = supabase
          .from('erp_audit_log')
          .select('*')

        if (filters.tableName) {
          query = query.eq('table_name', filters.tableName)
        }

        if (filters.action) {
          query = query.eq('action', filters.action)
        }

        if (filters.userId) {
          query = query.eq('user_id', filters.userId)
        }

        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }

        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(200)

        if (error) throw error
        return data as AuditLog[]
      },
    })
  }

  // Get client activity timeline (all tables related to a client)
  const useClientTimeline = (clientId: number | undefined) => {
    return useQuery({
      queryKey: ['audit-logs', 'client-timeline', clientId],
      queryFn: async () => {
        if (!clientId) return []

        const { data, error } = await supabase
          .from('erp_audit_log')
          .select('*')
          .or(`table_name.eq.erp_clients,table_name.eq.erp_contracts,table_name.eq.erp_receivables,table_name.eq.erp_receipts`)
          .eq('record_id', clientId)
          .order('created_at', { ascending: false })

        if (error) throw error
        return data as AuditLog[]
      },
      enabled: !!clientId,
    })
  }

  return {
    auditLogs: auditLogsQuery.data ?? [],
    isLoading: auditLogsQuery.isLoading,
    // Helpers
    useLogsByTable,
    useLogsByRecord,
    useLogsByUser,
    useLogsByAction,
    useFilteredLogs,
    useClientTimeline,
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format changes for display
 * Compares old_values and new_values to show what changed
 */
export function formatAuditChanges(log: AuditLog): Array<{
  field: string
  oldValue: unknown
  newValue: unknown
}> {
  if (!log.old_values || !log.new_values) return []

  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown }> = []

  // Get all unique keys from both old and new values
  const allKeys = new Set([
    ...Object.keys(log.old_values),
    ...Object.keys(log.new_values),
  ])

  allKeys.forEach((key) => {
    const oldValue = log.old_values?.[key]
    const newValue = log.new_values?.[key]

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return

    changes.push({
      field: key,
      oldValue,
      newValue,
    })
  })

  return changes
}

/**
 * Get human-readable action name
 */
export function getActionLabel(action: 'create' | 'update' | 'delete'): string {
  const labels = {
    create: 'Criado',
    update: 'Atualizado',
    delete: 'Deletado',
  }
  return labels[action]
}

/**
 * Get human-readable table name
 */
export function getTableLabel(tableName: string): string {
  const labels: Record<string, string> = {
    erp_companies: 'Empresa',
    erp_clients: 'Cliente',
    erp_contracts: 'Contrato',
    erp_contract_items: 'Item de Contrato',
    erp_receivables: 'Conta a Receber',
    erp_receipts: 'Recibo',
    erp_contract_types: 'Tipo de Contrato',
    erp_payment_methods: 'Método de Pagamento',
    erp_contract_templates: 'Template',
  }
  return labels[tableName] || tableName
}

/**
 * Format audit log for display
 */
export function formatAuditLogMessage(log: AuditLog): string {
  const action = getActionLabel(log.action)
  const table = getTableLabel(log.table_name)
  const user = log.user_email || 'Sistema'

  return `${user} ${action.toLowerCase()} ${table} #${log.record_id}`
}
