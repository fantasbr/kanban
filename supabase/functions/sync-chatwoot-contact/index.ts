import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { HttpError, normalizeApiError } from '../_shared/errors.ts'
import { requireAdminOrInternalToken } from '../_shared/internalAuth.ts'

type ChatwootSearchResponse = {
  payload?: Array<{ id?: number }>
}

type ChatwootCreateResponse = {
  payload?: { contact?: { id?: number } }
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    await requireAdminOrInternalToken(req, supabaseClient)

    const body = await req.json()
    const contactId = Number(body?.contact_id)

    if (!Number.isInteger(contactId) || contactId <= 0) {
      throw new HttpError(400, 'Contact ID is required')
    }

    const { data: settingsData, error: settingsError } = await supabaseClient
      .from('app_settings')
      .select('key, value')
      .in('key', ['chatwoot_url', 'chatwoot_account_id', 'chatwoot_access_token'])

    if (settingsError) throw settingsError

    const settings = (settingsData ?? []).reduce<Record<string, string>>(
      (acc, current) => {
        if (current.key && current.value) {
          acc[current.key] = current.value
        }
        return acc
      },
      {}
    )

    const chatwootUrl = settings.chatwoot_url
    const accountId = settings.chatwoot_account_id
    const token = settings.chatwoot_access_token

    if (!chatwootUrl || !accountId || !token) {
      throw new HttpError(400, 'Chatwoot settings not configured')
    }

    const { data: contact, error: contactError } = await supabaseClient
      .from('crm_contacts')
      .select('name, phone, email')
      .eq('id', contactId)
      .single()

    if (contactError || !contact) {
      throw new HttpError(404, 'Contact not found')
    }

    if (!contact.phone) {
      throw new HttpError(400, 'Contact phone is required')
    }

    const baseUrl = chatwootUrl.endsWith('/')
      ? chatwootUrl.slice(0, -1)
      : chatwootUrl

    const searchUrl = `${baseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${encodeURIComponent(contact.phone)}`

    const searchRes = await fetch(searchUrl, {
      headers: {
        api_access_token: token,
      },
    })

    if (!searchRes.ok) {
      const text = await searchRes.text()
      throw new HttpError(400, `Chatwoot API error (search): ${text}`)
    }

    const searchData = (await searchRes.json()) as ChatwootSearchResponse
    let chatwootId: number | null = null

    if (Array.isArray(searchData.payload) && searchData.payload.length > 0) {
      chatwootId = searchData.payload[0]?.id ?? null
    } else {
      const createRes = await fetch(
        `${baseUrl}/api/v1/accounts/${accountId}/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            api_access_token: token,
          },
          body: JSON.stringify({
            name: contact.name,
            phone_number: contact.phone,
            email: contact.email,
          }),
        }
      )

      if (!createRes.ok) {
        const text = await createRes.text()
        throw new HttpError(400, `Chatwoot API error (create): ${text}`)
      }

      const createData = (await createRes.json()) as ChatwootCreateResponse
      chatwootId = createData.payload?.contact?.id ?? null
    }

    if (!chatwootId) {
      throw new HttpError(400, 'Failed to obtain Chatwoot ID')
    }

    const { error: updateError } = await supabaseClient
      .from('crm_contacts')
      .update({ chatwoot_id: chatwootId } as never)
      .eq('id', contactId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({
        success: true,
        chatwoot_id: chatwootId,
        message: 'Contact synced successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    const normalizedError = normalizeApiError(error)

    return new Response(
      JSON.stringify({
        success: false,
        error: normalizedError.message,
      }),
      {
        status: normalizedError.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
