import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  permissions: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_by: string | null
  created_at: string
}

export function useAPIKeys() {
  const queryClient = useQueryClient()

  const apiKeysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ApiKey[]
    },
  })

  const createAPIKeyMutation = useMutation({
    mutationFn: async ({ 
      name, 
      permissions,
      expiresInDays 
    }: { 
      name: string
      permissions: string[]
      expiresInDays?: number
    }) => {
      // Gerar API key aleatória (64 caracteres hex)
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      const apiKey = 'sk_live_' + Array.from(array, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('')
      
      // Hash SHA-256 da key
      const encoder = new TextEncoder()
      const data = encoder.encode(apiKey)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Calcular data de expiração
      let expiresAt = null
      if (expiresInDays) {
        const date = new Date()
        date.setDate(date.getDate() + expiresInDays)
        expiresAt = date.toISOString()
      }

      const { data: result, error } = await supabase
        .from('api_keys')
        .insert({
          name,
          key_hash: keyHash,
          key_prefix: apiKey.substring(0, 15), // 'sk_live_' + 8 chars
          permissions,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (error) throw error

      // Retornar a key completa (única vez que será exibida)
      return { ...result, api_key: apiKey }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const updateAPIKeyMutation = useMutation({
    mutationFn: async ({ 
      id, 
      updates 
    }: { 
      id: string
      updates: Partial<ApiKey>
    }) => {
      const { error } = await supabase
        .from('api_keys')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  const deleteAPIKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })

  return {
    apiKeys: apiKeysQuery.data ?? [],
    isLoading: apiKeysQuery.isLoading,
    error: apiKeysQuery.error,
    createAPIKey: createAPIKeyMutation.mutateAsync,
    updateAPIKey: updateAPIKeyMutation.mutateAsync,
    deleteAPIKey: deleteAPIKeyMutation.mutateAsync,
    isCreating: createAPIKeyMutation.isPending,
    isUpdating: updateAPIKeyMutation.isPending,
    isDeleting: deleteAPIKeyMutation.isPending,
  }
}
