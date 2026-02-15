import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
export async function logRequest(
  supabase: SupabaseClient,
  apiKeyId: string | null,
  endpoint: string,
  method: string,
  statusCode: number,
  request: Request,
  responseBody: unknown,
  error: string | null,
  durationMs: number
) {
  try {
    let requestBody = null
    if (method !== 'GET') {
      try {
        requestBody = await request.clone().json()
      } catch {
        // Ignore se não for JSON
      }
    }

    await supabase.from('api_logs').insert({
      api_key_id: apiKeyId,
      endpoint,
      method,
      status_code: statusCode,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
      request_body: requestBody,
      response_body: responseBody,
      error_message: error,
      duration_ms: durationMs,
    })
  } catch (e) {
    console.error('Failed to log request:', e)
  }
}
