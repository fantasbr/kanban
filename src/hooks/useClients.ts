import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types/database'

export function useClients() {
  const queryClient = useQueryClient()

  // Fetch all clients with contact info
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .order('full_name')

      if (error) throw error
      return data as Client[]
    },
  })

  // Fetch active clients only
  const activeClientsQuery = useQuery({
    queryKey: ['clients', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      return data as Client[]
    },
  })

  // Fetch client by ID
  const useClient = (id: number | undefined) => {
    return useQuery({
      queryKey: ['clients', id],
      queryFn: async () => {
        if (!id) return null

        const { data, error } = await supabase
          .from('erp_clients')
          .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
          .eq('id', id)
          .single()

        if (error) throw error
        return data as Client
      },
      enabled: !!id,
    })
  }

  // Search clients by name, CPF, or phone
  const searchClientsMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error } = await supabase
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, name, phone, email, profile_url)')
        .or(`full_name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      return data as Client[]
    },
  })

  // Create client
  const createClientMutation = useMutation<Client, Error, Omit<Client, 'id' | 'created_at' | 'updated_at' | 'contacts'>>({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'contacts'>) => {
      const { error, data } = await supabase
        .from('erp_clients')
        // @ts-expect-error - Supabase type inference issue
        .insert(client)
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Update client
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Client> }) => {
      const { error } = await supabase
        .from('erp_clients')
        // @ts-expect-error - Supabase type inference issue
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
    },
  })

  // Deactivate client (soft delete)
  const deactivateClientMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('erp_clients')
        // @ts-expect-error - Supabase type inference issue
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Get client by contact_id (for CRM integration)
  const useClientByContactId = (contactId: number | undefined) => {
    return useQuery({
      queryKey: ['clients', 'contact', contactId],
      queryFn: async () => {
        if (!contactId) return null

        const { data, error } = await supabase
          .from('erp_clients')
          .select('*, contacts:crm_contacts(id, name, phone, email, profile_url)')
          .eq('contact_id', contactId)
          .single()

        if (error && error.code !== 'PGRST116') throw error // Ignore not found error
        return data as Client | null
      },
      enabled: !!contactId,
    })
  }

  return {
    clients: clientsQuery.data ?? [],
    activeClients: activeClientsQuery.data ?? [],
    isLoading: clientsQuery.isLoading || activeClientsQuery.isLoading,
    createClient: createClientMutation.mutateAsync,
    updateClient: updateClientMutation.mutateAsync,
    deactivateClient: deactivateClientMutation.mutateAsync,
    searchClients: searchClientsMutation.mutateAsync,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isSearching: searchClientsMutation.isPending,
    searchResults: searchClientsMutation.data ?? [],
    // Helpers
    useClient,
    useClientByContactId,
  }
}
