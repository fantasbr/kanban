
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contact_id } = await req.json()

    if (!contact_id) {
      throw new Error('Contact ID is required')
    }

    // 1. Buscar configurações
    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('key, value')
      .in('key', ['chatwoot_url', 'chatwoot_account_id', 'chatwoot_access_token'])

    if (settingsError) throw settingsError

    const settings = settingsData.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {})
    
    const chatwootUrl = settings.chatwoot_url
    const accountId = settings.chatwoot_account_id
    const token = settings.chatwoot_access_token

    if (!chatwootUrl || !accountId || !token) {
      throw new Error('Chatwoot settings not configured')
    }

    // 2. Buscar contato
    const { data: contact, error: contactError } = await supabaseClient
      .from('crm_contacts')
      .select('name, phone, email')
      .eq('id', contact_id)
      .single()

    if (contactError || !contact) throw new Error('Contact not found')
    if (!contact.phone) throw new Error('Contact phone is required')

    // Limpar telefone para formato aceito (apenas números ou +)
    // Chatwoot espera +5511999999999
    // Se o telefone já estiver formatado, ótimo. Se não, tentar limpar.
    // Assumindo que o banco guarda formatado ou raw.
    // Vamos garantir o formato E.164 se possível, ou enviar como está se já tiver o +.
    
    // Normalizar URL (remover slash final)
    const baseUrl = chatwootUrl.endsWith('/') ? chatwootUrl.slice(0, -1) : chatwootUrl

    // 3. Buscar no Chatwoot
    const searchUrl = `${baseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(contact.phone)}`
    
    const searchRes = await fetch(searchUrl, {
      headers: {
        'api_access_token': token
      }
    })

    if (!searchRes.ok) {
      const text = await searchRes.text()
      throw new Error(`Chatwoot API error (search): ${text}`)
    }

    const searchData = await searchRes.json()
    let chatwootId: number | null = null

    if (searchData.payload && searchData.payload.length > 0) {
      // Encontrou
      chatwootId = searchData.payload[0].id
    } else {
      // 4. Criar se não encontrou
      const createRes = await fetch(`${baseUrl}/api/v1/accounts/${accountId}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': token
        },
        body: JSON.stringify({
          name: contact.name,
          phone_number: contact.phone,
          email: contact.email
        })
      })

      if (!createRes.ok) {
        // Se falhar, pode ser que o telefone já exista mas a busca falhou ou formato inválido
        // Tentar buscar por email se falhar por telefone? Por enquanto vamos retornar o erro.
        const text = await createRes.text()
        throw new Error(`Chatwoot API error (create): ${text}`)
      }

      const createData = await createRes.json()
      chatwootId = createData.payload.contact.id
    }

    if (!chatwootId) {
      throw new Error('Failed to obtain Chatwoot ID')
    }

    // 5. Atualizar contato no Supabase
    const { error: updateError } = await supabaseClient
      .from('crm_contacts')
      .update({ chatwoot_id: chatwootId } as never)
      .eq('id', contact_id)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ 
        success: true, 
        chatwoot_id: chatwootId,
        message: 'Contact synced successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
