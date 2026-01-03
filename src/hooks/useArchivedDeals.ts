import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Deal } from '@/types/database'

export function useArchivedDeals() {
  // Fetch all archived deals with related data
  const archivedDealsQuery = useQuery({
    queryKey: ['deals', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('crm_deals')
        .select(`
          *,
          contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url),
          crm_stages(id, name, pipeline_id, is_won),
          erp_contracts(id, contract_number, final_value, status)
        `)
        .or('is_archived.eq.true,is_active.eq.false,contract_id.not.is.null')
        .order('archived_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data as (Deal & {
        crm_stages: { id: string; name: string; pipeline_id: string; is_won: boolean } | null
        erp_contracts: { id: number; contract_number: string; final_value: number; status: string } | null
      })[]
    },
  })

  return {
    archivedDeals: archivedDealsQuery.data ?? [],
    isLoading: archivedDealsQuery.isLoading,
    error: archivedDealsQuery.error,
  }
}
