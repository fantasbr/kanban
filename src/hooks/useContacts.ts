import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Contact } from '@/types/database'
import { useState } from 'react'

export function useContacts() {
  const [searchQuery, setSearchQuery] = useState('')
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('')
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

  // Query para buscar contato por telefone
  const contactByPhoneQuery = useQuery({
    queryKey: ['contact-by-phone', phoneSearchQuery],
    queryFn: async () => {
      if (!phoneSearchQuery) return null
      
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .eq('phone', phoneSearchQuery)
        .maybeSingle()
      
      if (error) throw error
      return data as Contact | null
    },
    enabled: !!phoneSearchQuery,
  })

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, updates }: { contactId: number; updates: Partial<Contact> }) => {
      const { error } = await supabase
        .from('crm_contacts')
        // @ts-expect-error - Supabase type inference issue with Partial
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
      chatwoot_id?: number | null // Agora opcional
      name: string
      phone?: string | null
      email?: string | null
      profile_url?: string | null
    }) => {
      const { error, data } = await supabase
        .from('crm_contacts')
        // @ts-expect-error - Supabase type inference issue with insert
        .insert({
          chatwoot_id: chatwoot_id || null, // NULL se não fornecido
          name,
          phone: phone || null,
          email: email || null,
          profile_url: profile_url || null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Contact // Return the created contact with ID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact-by-phone'] })
    },
  })

  return {
    contacts: contactsQuery.data ?? [],
    isLoading: contactsQuery.isLoading,
    error: contactsQuery.error,
    searchQuery,
    setSearchQuery,
    // Phone search
    phoneSearchQuery,
    setPhoneSearchQuery,
    contactByPhone: contactByPhoneQuery.data,
    isSearchingByPhone: contactByPhoneQuery.isLoading,
    // Mutations
    updateContact: updateContactMutation.mutate,
    createContact: createContactMutation.mutateAsync, // Usar mutateAsync para permitir await
    isCreating: createContactMutation.isPending,
    isCreatingContact: createContactMutation.isPending,
    createContactResult: createContactMutation.data,
  }
}
