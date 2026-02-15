import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import type { Client, Contract } from '@/types/database'
import type { ClientInsert, ClientUpdate } from '@/types/supabase-helpers'
import { isValidString, isValidCPF, isValidCNPJ, isValidEmail, isValidId } from '@/utils/validators'

export function useClients() {
  const queryClient = useQueryClient()

  // Fetch all clients with contact info
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .order('full_name')

      if (error) {
        logger.error('[useClients] Erro ao buscar clientes', { error })
        throw error
      }
      return data as Client[]
    },
  })

  // Fetch active clients only
  const activeClientsQuery = useQuery({
    queryKey: ['clients', 'active'],
    queryFn: async () => {
      const { data, error } = await db
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .eq('is_active', true)
        .order('full_name')

      if (error) {
        logger.error('[useClients] Erro ao buscar clientes ativos', { error })
        throw error
      }
      return data as Client[]
    },
  })

  // Fetch clients with active contracts only
  const clientsWithActiveContractsQuery = useQuery({
    queryKey: ['clients', 'with-active-contracts'],
    queryFn: async () => {
      // Get all active contracts
      const { data: contracts, error: contractsError } = await db
        .from('erp_contracts')
        .select('client_id')
        .eq('status', 'active')

      if (contractsError) {
        logger.error('[useClients] Erro ao buscar contratos ativos', { error: contractsError })
        throw contractsError
      }

      // Get unique client IDs
      const clientIds = [...new Set((contracts as unknown as Pick<Contract, 'client_id'>[])?.map(c => c.client_id) || [])]

      if (clientIds.length === 0) return []

      // Fetch clients with those IDs
      const { data, error } = await db
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
        .in('id', clientIds)
        .order('full_name')

      if (error) {
        logger.error('[useClients] Erro ao buscar clientes com contratos', { error })
        throw error
      }
      return data as Client[]
    },
  })

  // Fetch client by ID
  const useClient = (id: number | undefined) => {
    return useQuery({
      queryKey: ['clients', id],
      queryFn: async () => {
        if (!id) return null

        const { data, error } = await db
          .from('erp_clients')
          .select('*, created_by, updated_by, contacts:crm_contacts(id, chatwoot_id, name, phone, email, profile_url)')
          .eq('id', id)
          .single()

        if (error) {
          logger.error('[useClient] Erro ao buscar cliente', { id, error })
          throw error
        }
        return data as Client
      },
      enabled: !!id,
    })
  }

  // Search clients by name, CPF, or phone
  const searchClientsMutation = useMutation({
    mutationFn: async (searchTerm: string) => {
      const { data, error } = await db
        .from('erp_clients')
        .select('*, contacts:crm_contacts(id, name, phone, email, profile_url)')
        .or(`full_name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) {
        logger.error('[searchClients] Erro ao pesquisar clientes', { searchTerm, error })
        throw error
      }
      return data as Client[]
    },
  })

  // Create client
  const createClientMutation = useMutation<Client, Error, Omit<Client, 'id' | 'created_at' | 'updated_at' | 'contacts'>>({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'contacts'>) => {
      // ✅ SEGURANÇA: Validação de entrada
      if (!isValidString(client.full_name, 3)) {
        throw new Error('Nome do cliente deve ter pelo menos 3 caracteres')
      }

      if (client.person_type === 'pf' && !isValidCPF(client.cpf)) {
        throw new Error('CPF fornecido é inválido')
      }

      if (client.person_type === 'pj' && !isValidCNPJ(client.cnpj)) {
        throw new Error('CNPJ fornecido é inválido')
      }

      if (client.email && !isValidEmail(client.email)) {
        throw new Error('Email inválido')
      }

      const { error, data } = await db
        .insert('erp_clients', client as ClientInsert)
        .select()
        .single()

      if (error) {
        logger.error('[createClient] Erro ao criar cliente', { client, error })
        if (error.code === '23505') {
          throw new Error('CPF/CNPJ ou Email já cadastrado')
        }
        throw error
      }
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  // Update client
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Client> }) => {
      // ✅ SEGURANÇA: Validação de ID
      if (!isValidId(id)) throw new Error('ID inválido')

      // ✅ SEGURANÇA: Validação de Update
      const safeUpdates = { ...updates }
      if (safeUpdates.full_name !== undefined && !isValidString(safeUpdates.full_name, 3)) {
        throw new Error('Nome do cliente deve ter pelo menos 3 caracteres')
      }
      
      // Validação condicional para CPF/CNPJ em updates parciais é complexa pois depende do person_type.
      // Assumindo que updates geralmente enviam dados consistentes do form.
      // Poderíamos buscar o cliente antes, mas adicionaria overhead.
      
      if (safeUpdates.email !== undefined && safeUpdates.email !== null && safeUpdates.email !== '' && !isValidEmail(safeUpdates.email)) {
         throw new Error('Email inválido')
      }

      const { data, error } = await db
        .update('erp_clients', safeUpdates as ClientUpdate)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        logger.error('[updateClient] Erro ao atualizar cliente', { id, updates, error })
        if (error.code === '23505') {
          throw new Error('CPF/CNPJ ou Email já cadastrado')
        }
        throw error
      }
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', variables.id] })
    },
  })

  // Deactivate client (soft delete)
  const deactivateClientMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!isValidId(id)) throw new Error('ID inválido')

      const { error } = await db
        .update('erp_clients', { is_active: false, updated_at: new Date().toISOString() } as ClientUpdate)
        .eq('id', id)

      if (error) {
        logger.error('[deactivateClient] Erro ao desativar cliente', { id, error })
        throw error
      }
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

        const { data, error } = await db
          .from('erp_clients')
          .select('*, contacts:crm_contacts(id, name, phone, email, profile_url)')
          .eq('contact_id', contactId)
          .single()

        if (error && error.code !== 'PGRST116') {
          logger.error('[useClientByContactId] Erro ao buscar cliente por contato', { contactId, error })
          throw error // Ignore not found error
        }
        return data as Client | null
      },
      enabled: !!contactId,
    })
  }

  return {
    clients: clientsQuery.data ?? [],
    activeClients: activeClientsQuery.data ?? [],
    clientsWithActiveContracts: clientsWithActiveContractsQuery.data ?? [],
    isLoading: clientsQuery.isLoading || activeClientsQuery.isLoading || clientsWithActiveContractsQuery.isLoading,
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
