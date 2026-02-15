import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types/database'

export function useCompanies() {
  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_companies')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Company[]
    },
  })

  return {
    companies,
    isLoading,
  }
}
