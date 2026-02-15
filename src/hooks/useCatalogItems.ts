import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface CatalogItem {
  id: number
  name: string
  description: string | null
  default_unit_price: number
  unit_type: string
  is_lesson: boolean
  vehicle_category: 'car' | 'motorcycle' | 'bus' | 'truck' | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function useCatalogItems() {
  const { data: catalogItems = [], isLoading } = useQuery({
    queryKey: ['catalog-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_items_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as CatalogItem[]
    },
  })

  return {
    catalogItems,
    isLoading,
  }
}
