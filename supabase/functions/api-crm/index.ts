import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { authenticateRequest, requirePermission } from '../_shared/auth.ts'
import { logRequest } from '../_shared/logger.ts'
import { methodNotAllowed, normalizeApiError, notFound } from '../_shared/errors.ts'
import type { ApiResponse, ApiKey } from '../_shared/types.ts'

serve(async (req) => {
  const startTime = Date.now()

  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  let statusCode = 200
  let responseBody: ApiResponse = {}
  let errorMessage: string | null = null
  let path = 'unknown'
  const method = req.method
  let apiKey: ApiKey | null = null
  let supabaseClient: SupabaseClient | null = null

  try {
    const authData = await authenticateRequest(req)
    apiKey = authData.apiKey
    supabaseClient = authData.supabase
    const supabase = authData.supabase

    const url = new URL(req.url)
    path = url.pathname.replace('/api-crm', '')

    if (path.startsWith('/deals')) {
      responseBody = await handleDeals(req, supabase, apiKey, path, method)
    } else if (path.startsWith('/contacts')) {
      responseBody = await handleContacts(req, supabase, apiKey, path, method)
    } else if (path.startsWith('/pipelines')) {
      responseBody = await handlePipelines(req, supabase, apiKey, path, method)
    } else {
      notFound()
    }
  } catch (error) {
    const normalizedError = normalizeApiError(error)
    errorMessage = normalizedError.message
    statusCode = normalizedError.status
    responseBody = { error: normalizedError.message }
  }

  if (supabaseClient) {
    await logRequest(
      supabaseClient,
      apiKey?.id || null,
      path,
      method,
      statusCode,
      req,
      responseBody,
      errorMessage,
      Date.now() - startTime
    ).catch((logError: unknown) => {
      console.error('Failed to write API log:', logError)
    })
  }

  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})

// ============================================
// HANDLERS
// ============================================

async function handleDeals(req: Request, supabase: SupabaseClient, apiKey: ApiKey | null, path: string, method: string): Promise<ApiResponse> {
  const url = new URL(req.url)

  // GET /deals - Listar deals
  if (method === 'GET' && path === '/deals') {
    requirePermission(apiKey, 'crm:read')

    const pipelineId = url.searchParams.get('pipeline_id')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('crm_deals')
      .select('*, contacts:crm_contacts(*), crm_stages(id, name, position, is_won)')
      .eq('is_archived', false)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (pipelineId) {
      query = query.eq('pipeline_id', pipelineId)
    }

    const { data, error } = await query
    if (error) throw error

    return { data, total: data?.length || 0 }
  }

  // POST /deals - Criar deal
  if (method === 'POST' && path === '/deals') {
    requirePermission(apiKey, 'crm:write')

    const body = await req.json()
    const { data, error } = await supabase
      .from('crm_deals')
      .insert(body)
      .select('*, contacts:crm_contacts(*)')
      .single()

    if (error) throw error

    return { data, message: 'Deal created successfully' }
  }

  // PUT /deals/:id - Atualizar deal
  const updateMatch = path.match(/^\/deals\/([a-f0-9-]+)$/)
  if (method === 'PUT' && updateMatch) {
    requirePermission(apiKey, 'crm:write')

    const dealId = updateMatch[1]
    const body = await req.json()

    const { data, error } = await supabase
      .from('crm_deals')
      .update(body)
      .eq('id', dealId)
      .select('*, contacts:crm_contacts(*)')
      .single()

    if (error) throw error

    return { data, message: 'Deal updated successfully' }
  }

  // GET /deals/:id - Buscar deal especifico
  const getMatch = path.match(/^\/deals\/([a-f0-9-]+)$/)
  if (method === 'GET' && getMatch) {
    requirePermission(apiKey, 'crm:read')

    const dealId = getMatch[1]
    const { data, error } = await supabase
      .from('crm_deals')
      .select('*, contacts:crm_contacts(*), crm_stages(id, name, position, is_won)')
      .eq('id', dealId)
      .single()

    if (error) throw error

    return { data }
  }

  if (path === '/deals') {
    methodNotAllowed()
  }

  if (path.startsWith('/deals/')) {
    if (/^\/deals\/[a-f0-9-]+$/.test(path)) {
      methodNotAllowed()
    }
    notFound()
  }

  notFound()
}

async function handleContacts(req: Request, supabase: SupabaseClient, apiKey: ApiKey | null, path: string, method: string): Promise<ApiResponse> {
  const url = new URL(req.url)

  // GET /contacts - Listar contatos
  if (method === 'GET' && path === '/contacts') {
    requirePermission(apiKey, 'crm:read')

    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('crm_contacts')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return { data, total: data?.length || 0 }
  }

  // POST /contacts - Criar contato
  if (method === 'POST' && path === '/contacts') {
    requirePermission(apiKey, 'crm:write')

    const body = await req.json()
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return { data, message: 'Contact created successfully' }
  }

  // GET /contacts/:id - Buscar contato especifico
  const getMatch = path.match(/^\/contacts\/(\d+)$/)
  if (method === 'GET' && getMatch) {
    requirePermission(apiKey, 'crm:read')

    const contactId = parseInt(getMatch[1])
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (error) throw error

    return { data }
  }

  if (path === '/contacts') {
    methodNotAllowed()
  }

  if (path.startsWith('/contacts/')) {
    if (/^\/contacts\/\d+$/.test(path)) {
      methodNotAllowed()
    }
    notFound()
  }

  notFound()
}

async function handlePipelines(req: Request, supabase: SupabaseClient, apiKey: ApiKey | null, path: string, method: string): Promise<ApiResponse> {
  // GET /pipelines - Listar pipelines
  if (method === 'GET' && path === '/pipelines') {
    requirePermission(apiKey, 'crm:read')

    const { data, error } = await supabase
      .from('crm_pipelines')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    return { data, total: data?.length || 0 }
  }

  // GET /pipelines/:id - Buscar pipeline especifico
  const getMatch = path.match(/^\/pipelines\/([a-f0-9-]+)$/)
  if (method === 'GET' && getMatch) {
    requirePermission(apiKey, 'crm:read')

    const pipelineId = getMatch[1]
    const { data, error } = await supabase
      .from('crm_pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single()

    if (error) throw error

    return { data }
  }

  if (path === '/pipelines') {
    methodNotAllowed()
  }

  if (path.startsWith('/pipelines/')) {
    if (/^\/pipelines\/[a-f0-9-]+$/.test(path)) {
      methodNotAllowed()
    }
    notFound()
  }

  notFound()
}
