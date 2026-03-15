import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handleCors } from '../_shared/cors.ts'
import { normalizeApiError } from '../_shared/errors.ts'
import { requireInternalToken } from '../_shared/internalAuth.ts'

interface WebhookSubscription {
  id: string
  name: string
  url: string
  secret: string
  headers: Record<string, string> | null
  timeout_seconds: number
  retry_count: number
}

interface WebhookQueueItem {
  id: number
  event_type: string
  payload: Record<string, unknown>
  attempts: number
  webhook_subscriptions: WebhookSubscription | null
}

class WebhookHttpError extends Error {
  statusCode: number
  responseBody: string

  constructor(statusCode: number, responseBody: string) {
    super(`HTTP ${statusCode}`)
    this.name = 'WebhookHttpError'
    this.statusCode = statusCode
    this.responseBody = responseBody
  }
}

serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    requireInternalToken(req)

    const { data: queue, error } = await supabase
      .from('webhook_queue')
      .select('*, webhook_subscriptions(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error

    console.log(`Processing ${queue?.length || 0} webhooks...`)

    const results = []
    for (const item of (queue ?? []) as WebhookQueueItem[]) {
      const result = await processWebhook(supabase, item)
      results.push(result)
    }

    return new Response(
      JSON.stringify({
        processed: queue?.length || 0,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error: unknown) {
    const normalizedError = normalizeApiError(error)

    console.error('Error processing webhooks:', normalizedError.message)

    return new Response(JSON.stringify({ error: normalizedError.message }), {
      status: normalizedError.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function processWebhook(supabase: SupabaseClient, queueItem: WebhookQueueItem) {
  const subscription = queueItem.webhook_subscriptions
  if (!subscription) {
    throw new Error(`Webhook subscription not found for queue item ${queueItem.id}`)
  }

  const startTime = Date.now()

  try {
    console.log(`Processing webhook ${queueItem.id} for ${subscription.name}`)

    await supabase
      .from('webhook_queue')
      .update({
        status: 'processing',
        last_attempt_at: new Date().toISOString(),
        attempts: queueItem.attempts + 1,
      })
      .eq('id', queueItem.id)

    const encoder = new TextEncoder()
    const payloadString = JSON.stringify(queueItem.payload)

    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(subscription.secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payloadString)
    )

    const signatureHex = Array.from(new Uint8Array(signature))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signatureHex,
      'X-Webhook-Event': queueItem.event_type,
      'X-Webhook-Id': queueItem.id.toString(),
      'User-Agent': 'Kanban-Webhook/1.0',
      ...(subscription.headers ?? {}),
    }

    const response = await fetch(subscription.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(subscription.timeout_seconds * 1000),
    })

    const responseBody = await response.text()
    const durationMs = Date.now() - startTime

    if (!response.ok) {
      throw new WebhookHttpError(response.status, responseBody.substring(0, 1000))
    }

    console.log(`Webhook ${queueItem.id} sent: ${response.status}`)

    await supabase.from('webhook_logs').insert({
      subscription_id: subscription.id,
      event_type: queueItem.event_type,
      payload: queueItem.payload,
      status_code: response.status,
      response_body: responseBody.substring(0, 1000),
      duration_ms: durationMs,
      attempt_number: queueItem.attempts + 1,
    })

    await supabase
      .from('webhook_queue')
      .update({ status: 'sent' })
      .eq('id', queueItem.id)

    return {
      id: queueItem.id,
      status: 'sent',
      statusCode: response.status,
      duration: durationMs,
    }
  } catch (error: unknown) {
    const err = error as Error
    const durationMs = Date.now() - startTime
    const attempts = queueItem.attempts + 1

    const statusCode =
      error instanceof WebhookHttpError ? error.statusCode : null
    const responseBody =
      error instanceof WebhookHttpError ? error.responseBody : null

    console.error(`Webhook ${queueItem.id} failed:`, err.message)

    await supabase.from('webhook_logs').insert({
      subscription_id: subscription.id,
      event_type: queueItem.event_type,
      payload: queueItem.payload,
      status_code: statusCode,
      response_body: responseBody,
      error_message: err.message,
      attempt_number: attempts,
      duration_ms: durationMs,
    })

    const maxRetries = Math.max(1, subscription.retry_count)

    if (attempts >= maxRetries) {
      console.log(
        `Webhook ${queueItem.id} failed permanently after ${attempts} attempts`
      )
      await supabase
        .from('webhook_queue')
        .update({ status: 'failed', attempts })
        .eq('id', queueItem.id)

      return {
        id: queueItem.id,
        status: 'failed',
        error: err.message,
        attempts,
      }
    }

    console.log(
      `Webhook ${queueItem.id} will retry (attempt ${attempts}/${maxRetries})`
    )

    await supabase
      .from('webhook_queue')
      .update({ status: 'pending', attempts })
      .eq('id', queueItem.id)

    return {
      id: queueItem.id,
      status: 'retry',
      error: err.message,
      attempts,
    }
  }
}
