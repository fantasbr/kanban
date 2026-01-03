import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import type { ApiKey } from './types.ts'

export async function authenticateRequest(
  request: Request
): Promise<{ apiKey: ApiKey | null; supabase: any }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { apiKey: null, supabase }
  }

  const apiKeyString = authHeader.substring(7)
  
  // Hash da API key (SHA-256)
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKeyString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Buscar API key no banco
  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('id, permissions, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single()

  if (error || !apiKeyData || !apiKeyData.is_active) {
    return { apiKey: null, supabase }
  }

  // Verificar expiração
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    return { apiKey: null, supabase }
  }

  // Atualizar last_used_at (async, não esperar)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyData.id)
    .then()

  return { apiKey: apiKeyData as ApiKey, supabase }
}

export function hasPermission(apiKey: ApiKey, permission: string): boolean {
  return apiKey.permissions.includes('*') || apiKey.permissions.includes(permission)
}

export function requirePermission(apiKey: ApiKey | null, permission: string): void {
  if (!apiKey) {
    throw new Error('Unauthorized')
  }
  if (!hasPermission(apiKey, permission)) {
    throw new Error('Forbidden: Missing permission ' + permission)
  }
}
