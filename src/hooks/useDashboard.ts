import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Deal } from '@/types/database'

interface DashboardMetrics {
  totalSales: number
  activeLeads: number
  conversionRate: number
  averageTicket: number
}

export function useDashboard() {
  const metricsQuery = useQuery({
    queryKey: ['dashboard-metrics'],
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

      // Calculate metrics
      const allDeals = (deals || []) as (Deal & { crm_stages: { id: string; name: string; is_won: boolean; pipeline_id: string } | null })[]
      
      // Filter won deals (deals in stages marked as won)
      const wonDeals = allDeals.filter(d => d.crm_stages?.is_won === true)
      
      // Active leads are deals NOT in won stages
      const activeLeads = allDeals.filter(d => d.crm_stages?.is_won !== true)
      
      // Total sales: sum of deal values for won deals
      const totalSales = wonDeals.reduce((sum, deal) => sum + (deal.deal_value_negotiated || 0), 0)
      
      // Conversion rate: won deals / total deals * 100
      const conversionRate = allDeals.length > 0 
        ? (wonDeals.length / allDeals.length) * 100 
        : 0
      
      // Average ticket: average value of won deals
      const averageTicket = wonDeals.length > 0
        ? totalSales / wonDeals.length
        : 0

      const metrics: DashboardMetrics = {
        totalSales,
        activeLeads: activeLeads.length,
        conversionRate,
        averageTicket,
      }

      return metrics
    },
  })

  return {
    metrics: metricsQuery.data,
    isLoading: metricsQuery.isLoading,
    error: metricsQuery.error,
  }
}
