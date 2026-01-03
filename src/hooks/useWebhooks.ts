import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface WebhookSubscription {
  id: string
  api_key_id: string | null
  name: string
  url: string
  events: string[]
  secret: string
  is_active: boolean
  retry_count: number
  timeout_seconds: number
  headers: Record<string, string>
  created_at: string
  updated_at: string
}

export function useWebhooks() {
  const queryClient = useQueryClient()

  const webhooksQuery = useQuery({
    queryKey: ['webhooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as WebhookSubscription[]
    },
  })

  const createWebhookMutation = useMutation({
    mutationFn: async ({
      name,
      url,
      events,
      apiKeyId,
      retryCount = 3,
      timeoutSeconds = 30,
      headers = {},
    }: {
      name: string
      url: string
      events: string[]
      apiKeyId?: string | null
      retryCount?: number
      timeoutSeconds?: number
      headers?: Record<string, string>
    }) => {
      // Gerar secret aleatório para HMAC
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      const secret = Array.from(array, byte => 
        byte.toString(16).padStart(2, '0')
      ).join('')

      const { data, error } = await supabase
        .from('webhook_subscriptions')
        .insert({
          name,
          url,
          events,
          api_key_id: apiKeyId || null,
          secret,
          retry_count: retryCount,
          timeout_seconds: timeoutSeconds,
          headers,
        })
        .select()
        .single()

      if (error) throw error

      // Retornar secret apenas uma vez
      return { ...data, secret }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const updateWebhookMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<WebhookSubscription>
    }) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .update(updates)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_subscriptions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  // Buscar logs de um webhook específico
  const useWebhookLogs = (subscriptionId: string | undefined) => {
    return useQuery({
      queryKey: ['webhook-logs', subscriptionId],
      queryFn: async () => {
        if (!subscriptionId) return []

        const { data, error } = await supabase
          .from('webhook_logs')
          .select('*')
          .eq('subscription_id', subscriptionId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return data
      },
      enabled: !!subscriptionId,
    })
  }

  return {
    webhooks: webhooksQuery.data ?? [],
    isLoading: webhooksQuery.isLoading,
    error: webhooksQuery.error,
    createWebhook: createWebhookMutation.mutateAsync,
    updateWebhook: updateWebhookMutation.mutateAsync,
    deleteWebhook: deleteWebhookMutation.mutateAsync,
    isCreating: createWebhookMutation.isPending,
    isUpdating: updateWebhookMutation.isPending,
    isDeleting: deleteWebhookMutation.isPending,
    useWebhookLogs,
  }
}
