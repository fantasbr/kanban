import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { HttpError } from './errors.ts'

type UserPermissionRow = {
  is_admin?: boolean
}

function getExpectedInternalToken(): string {
  const token = Deno.env.get('INTERNAL_FUNCTION_TOKEN')
  if (!token) {
    throw new HttpError(
      500,
      'INTERNAL_FUNCTION_TOKEN is not configured on this environment'
    )
  }
  return token
}

function getOptionalInternalToken(): string | null {
  return Deno.env.get('INTERNAL_FUNCTION_TOKEN')
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7).trim()
}

export function hasValidInternalToken(request: Request): boolean {
  const expectedToken = getOptionalInternalToken()
  if (!expectedToken) {
    return false
  }
  const providedToken = request.headers.get('x-internal-token')

  return !!providedToken && providedToken === expectedToken
}

export function requireInternalToken(request: Request): void {
  getExpectedInternalToken()
  if (!hasValidInternalToken(request)) {
    throw new HttpError(401, 'Unauthorized')
  }
}

export async function requireAdminOrInternalToken(
  request: Request,
  supabase: SupabaseClient
): Promise<void> {
  if (hasValidInternalToken(request)) {
    return
  }

  const bearerToken = getBearerToken(request)
  if (!bearerToken) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(
    bearerToken
  )

  if (userError || !userData.user) {
    throw new HttpError(401, 'Unauthorized')
  }

  const { data: permissionRows, error: permissionError } = await supabase.rpc(
    'get_user_permissions',
    {
      p_user_id: userData.user.id,
    }
  )

  if (permissionError) {
    throw new HttpError(500, 'Failed to resolve user permissions')
  }

  const rows = (permissionRows ?? []) as UserPermissionRow[]
  const isAdmin = rows.some((row) => row.is_admin === true)

  if (!isAdmin) {
    throw new HttpError(403, 'Forbidden: admin required')
  }
}
