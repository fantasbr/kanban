import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { authenticateRequest, requirePermission } from '../_shared/auth.ts'
import { logRequest } from '../_shared/logger.ts'
import type { ApiResponse } from '../_shared/types.ts'

serve(async (req) => {
  const startTime = Date.now()
  
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  let statusCode = 200
  let responseBody: ApiResponse = {}
  let errorMessage: string | null = null

  try {
    const { apiKey, supabase } = await authenticateRequest(req)
    
    const url = new URL(req.url)
    const path = url.pathname.replace('/api-erp', '')
    const method = req.method

    // Roteamento
    if (path.startsWith('/clients')) {
      responseBody = await handleClients(req, supabase, apiKey, path, method)
    } else if (path.startsWith('/contracts')) {
      responseBody = await handleContracts(req, supabase, apiKey, path, method)
    } else if (path.startsWith('/receivables')) {
      responseBody = await handleReceivables(req, supabase, apiKey, path, method)
    } else {
      statusCode = 404
      responseBody = { error: 'Not found' }
    }

    await logRequest(
      supabase,
      apiKey?.id || null,
      path,
      method,
      statusCode,
      req,
      responseBody,
      errorMessage,
      Date.now() - startTime
    )

    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    errorMessage = error.message
    statusCode = error.message === 'Unauthorized' ? 401 : 
                 error.message.startsWith('Forbidden') ? 403 : 500
    
    responseBody = { error: error.message }

    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleClients(req: Request, supabase: any, apiKey: any, path: string, method: string): Promise<ApiResponse> {
  const url = new URL(req.url)

  // GET /clients - Listar clientes
  if (method === 'GET' && path === '/clients') {
    requirePermission(apiKey, 'erp:read')

    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('erp_clients')
      .select('*, contacts:crm_contacts(*)')
      .eq('is_active', true)
      .range(offset, offset + limit - 1)
      .order('full_name')

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) throw error

    return { data, total: data?.length || 0 }
  }

  // GET /clients/:id - Buscar cliente específico
  const getMatch = path.match(/^\/clients\/(\d+)$/)
  if (method === 'GET' && getMatch) {
    requirePermission(apiKey, 'erp:read')

    const clientId = parseInt(getMatch[1])
    const { data, error } = await supabase
      .from('erp_clients')
      .select('*, contacts:crm_contacts(*)')
      .eq('id', clientId)
      .single()

    if (error) throw error

    return { data }
  }

  // POST /clients - Criar cliente
  if (method === 'POST' && path === '/clients') {
    requirePermission(apiKey, 'erp:write')

    const body = await req.json()
    const { data, error } = await supabase
      .from('erp_clients')
      .insert(body)
      .select('*, contacts:crm_contacts(*)')
      .single()

    if (error) throw error

    return { data, message: 'Client created successfully' }
  }

  throw new Error('Method not allowed')
}

async function handleContracts(req: Request, supabase: any, apiKey: any, path: string, method: string): Promise<ApiResponse> {
  const url = new URL(req.url)

  // GET /contracts - Listar contratos
  if (method === 'GET' && path === '/contracts') {
    requirePermission(apiKey, 'erp:read')

    const clientId = url.searchParams.get('client_id')
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('erp_contracts')
      .select('*, clients:erp_clients(id, full_name, cpf), companies:erp_companies(*)')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (clientId) {
      query = query.eq('client_id', parseInt(clientId))
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return { data, total: data?.length || 0 }
  }

  // GET /contracts/:id - Buscar contrato específico
  const getMatch = path.match(/^\/contracts\/(\d+)$/)
  if (method === 'GET' && getMatch) {
    requirePermission(apiKey, 'erp:read')

    const contractId = parseInt(getMatch[1])
    const { data, error } = await supabase
      .from('erp_contracts')
      .select('*, clients:erp_clients(*), companies:erp_companies(*), contract_types:erp_contract_types(*)')
      .eq('id', contractId)
      .single()

    if (error) throw error

    return { data }
  }

  throw new Error('Method not allowed')
}

async function handleReceivables(req: Request, supabase: any, apiKey: any, path: string, method: string): Promise<ApiResponse> {
  const url = new URL(req.url)

  // GET /receivables - Listar parcelas
  if (method === 'GET' && path === '/receivables') {
    requirePermission(apiKey, 'erp:read')

    const status = url.searchParams.get('status')
    const clientId = url.searchParams.get('client_id')
    const contractId = url.searchParams.get('contract_id')
    const limit = parseInt(url.searchParams.get('limit') || '100')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabase
      .from('erp_receivables')
      .select('*, clients:erp_clients(id, full_name), contracts:erp_contracts(contract_number)')
      .range(offset, offset + limit - 1)
      .order('due_date', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    if (clientId) {
      query = query.eq('client_id', parseInt(clientId))
    }

    if (contractId) {
      query = query.eq('contract_id', parseInt(contractId))
    }

    const { data, error } = await query
    if (error) throw error

    return { data, total: data?.length || 0 }
  }

  // GET /receivables/:id - Buscar parcela específica
  const getMatch = path.match(/^\/receivables\/(\d+)$/)
  if (method === 'GET' && getMatch) {
    requirePermission(apiKey, 'erp:read')

    const receivableId = parseInt(getMatch[1])
    const { data, error } = await supabase
      .from('erp_receivables')
      .select('*, clients:erp_clients(*), contracts:erp_contracts(*)')
      .eq('id', receivableId)
      .single()

    if (error) throw error

    return { data }
  }

  throw new Error('Method not allowed')
}
