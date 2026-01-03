import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Deal, Client } from '@/types/database'

interface DealWithStage extends Deal {
  crm_stages: { id: string; name: string; is_won: boolean } | null
}

interface ContractWithRelations {
  id: number
  contract_number: string
  final_value: number
  status: string
  start_date: string
  installments: number
  created_at: string
  companies: { id: number; name: string } | null
  contract_types: { id: number; name: string } | null
}


export function useContactHistory(contactId: number | undefined) {
  // Buscar deals do contato
  const dealsQuery = useQuery({
    queryKey: ['contact-deals', contactId],
    queryFn: async () => {
      if (!contactId) return []

      const { data, error } = await supabase
        .from('crm_deals')
        .select('*, crm_stages(id, name, is_won)')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as DealWithStage[]
    },
    enabled: !!contactId,
  })

  // Buscar cliente ERP vinculado
  const clientQuery = useQuery({
    queryKey: ['contact-client', contactId],
    queryFn: async () => {
      if (!contactId) return null

      const { data, error } = await supabase
        .from('erp_clients')
        .select('*')
        .eq('contact_id', contactId)
        .maybeSingle()

      if (error) throw error
      return data as Client | null
    },
    enabled: !!contactId,
  })

  // Buscar contratos do cliente ERP (se existir)
  const contractsQuery = useQuery({
    queryKey: ['contact-contracts', clientQuery.data?.id],
    queryFn: async () => {
      if (!clientQuery.data?.id) return []

      const { data, error } = await supabase
        .from('erp_contracts')
        .select(`
          *,
          companies:erp_companies(id, name),
          contract_types:erp_contract_types(id, name)
        `)
        .eq('client_id', clientQuery.data.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ContractWithRelations[]
    },
    enabled: !!clientQuery.data?.id,
  })

  // Separar deals ativos e arquivados
  const activeDeals = dealsQuery.data?.filter((deal) => !deal.is_archived) ?? []
  const archivedDeals = dealsQuery.data?.filter((deal) => deal.is_archived) ?? []

  return {
    deals: dealsQuery.data ?? [],
    activeDeals,
    archivedDeals,
    client: clientQuery.data,
    contracts: contractsQuery.data ?? [],
    isLoading: dealsQuery.isLoading || clientQuery.isLoading,
    hasClient: !!clientQuery.data,
    hasContracts: (contractsQuery.data?.length ?? 0) > 0,
  }
}
