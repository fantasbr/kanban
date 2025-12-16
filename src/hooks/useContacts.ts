import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types/database'
import { useState } from 'react'

export function useContacts() {
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const contactsQuery = useQuery({
    queryKey: ['contacts', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply search filter if exists
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Contact[]
    },
  })

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: number; updates: Partial<Contact> }) => {
      const { error } = await supabase
        .from('crm_contacts')
        .update(updates)
        .eq('id', contactId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  const createContactMutation = useMutation({
    mutationFn: async ({
      chatwoot_id,
      name,
      phone,
      email,
      profile_url,
    }: {
      chatwoot_id: number
      name: string
      phone?: string | null
      email?: string | null
      profile_url?: string | null
    }) => {
      const { error } = await supabase
        .from('crm_contacts')
        // @ts-expect-error - Supabase type inference issue with insert
        .insert({
          chatwoot_id,
          name,
          phone: phone || null,
          email: email || null,
          profile_url: profile_url || null,
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    searchQuery,
    setSearchQuery,
    updateContact: updateContactMutation.mutate,
    createContact: createContactMutation.mutate,
    isCreating: createContactMutation.isPending,
  }
}
