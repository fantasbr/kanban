import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Deal } from '@/types/database'
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

interface DashboardMetrics {
  totalActiveLeads: number
  totalActiveValue: number
  newLeadsMonth: number
  convertedLeadsMonth: number
  conversionRateMonth: number
  averageTicketMonth: number
}

interface UseDashboardOptions {
  month?: Date
}

export function useDashboard({ month = new Date() }: UseDashboardOptions = {}) {
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics', month.toISOString()],
    queryFn: async () => {
      // Fetch all deals with stage information
      const { data: deals, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          crm_stages (
            id,
            name,
            is_won,
            pipeline_id
          )
        `)

      if (error) throw error

      const allDeals = (deals || []) as (Deal & { crm_stages: { id: string; name: string; is_won: boolean; pipeline_id: string } | null })[]

      // Date range for the selected month
      const start = startOfMonth(month)
      const end = endOfMonth(month)
      const interval = { start, end }

      // 1. Leads Ativos (Total do banco)
      // Active = not won, not archived, not lost (assuming lost means archived or specific stage, but here simplified to not won/archived)
      const activeDeals = allDeals.filter(d => 
        !d.crm_stages?.is_won && 
        !d.is_archived
      )
      const totalActiveLeads = activeDeals.length

      // 2. Valor Total Leads Ativos
      const totalActiveValue = activeDeals.reduce((sum, deal) => sum + (deal.deal_value_negotiated || 0), 0)

      // 3. Novos Leads no Mês
      const newLeadsMonth = allDeals.filter(d => 
        isWithinInterval(new Date(d.created_at), interval)
      ).length

      // 4. Leads Convertidos no Mês (usando won_at se disponível, senão updated_at para antigos)
      const convertedDealsMonth = allDeals.filter(d => {
        if (!d.crm_stages?.is_won) return false
        
        // Prefer won_at, fallback to updated_at (though less accurate for old data)
        const dateToCheck = d.won_at ? new Date(d.won_at) : new Date(d.updated_at)
        return isWithinInterval(dateToCheck, interval)
      })
      const totalConvertedLeadsMonth = convertedDealsMonth.length

      // 5. Taxa de Conversão no Mês
      // (Converted in Month / New in Month) * 100 - This is one way. 
      // Another common way is (Won / (Won + Lost)) in that month.
      // User asked for "taxa de conversão no mês", usually implies relation to flow. 
      // Let's use (Converted / New) as a simple proxy for now, or (Converted / (Converted + Lost)) if tracking lost dates.
      // Since we don't strictly track "lost_at", let's use (Converted / New) but cap at 100% or just handle 0.
      // Actually, standard is often (Sales / Leads).
      const conversionRateMonth = newLeadsMonth > 0 
        ? (totalConvertedLeadsMonth / newLeadsMonth) * 100 
        : 0

      // 6. Ticket Médio no Mês
      const totalSalesMonth = convertedDealsMonth.reduce((sum, deal) => sum + (deal.deal_value_negotiated || 0), 0)
      const averageTicketMonth = totalConvertedLeadsMonth > 0
        ? totalSalesMonth / totalConvertedLeadsMonth
        : 0

      const metrics: DashboardMetrics = {
        totalActiveLeads,
        totalActiveValue,
        newLeadsMonth,
        convertedLeadsMonth: totalConvertedLeadsMonth,
        conversionRateMonth,
        averageTicketMonth,
      }

      return metrics
    },
  })

  return {
    metrics: metricsQuery.data,
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
    refetch: metricsQuery.refetch,
  }
}
