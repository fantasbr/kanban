import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Buscar webhooks pendentes da fila
    const { data: queue, error } = await supabase
      .from('webhook_queue')
      .select('*, webhook_subscriptions(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error

    console.log(`Processing ${queue?.length || 0} webhooks...`)

    // Processar cada webhook
    const results = []
    for (const item of queue || []) {
      const result = await processWebhook(supabase, item)
      results.push(result)
    }

    return new Response(JSON.stringify({ 
      processed: queue?.length || 0,
      results 
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing webhooks:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function processWebhook(supabase: any, queueItem: any) {
  const subscription = queueItem.webhook_subscriptions
  const startTime = Date.now()

  try {
    console.log(`Processing webhook ${queueItem.id} for ${subscription.name}`)

    // Marcar como processando
    await supabase
      .from('webhook_queue')
      .update({ 
        status: 'processing', 
        last_attempt_at: new Date().toISOString(),
        attempts: queueItem.attempts + 1
      })
      .eq('id', queueItem.id)

    // Criar assinatura HMAC-SHA256
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
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signatureHex,
      'X-Webhook-Event': queueItem.event_type,
      'X-Webhook-Id': queueItem.id.toString(),
      'User-Agent': 'Kanban-Webhook/1.0',
      ...subscription.headers,
    }

    // Enviar webhook
    const response = await fetch(subscription.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(subscription.timeout_seconds * 1000),
    })

    const responseBody = await response.text()
    const durationMs = Date.now() - startTime

    console.log(`Webhook ${queueItem.id} sent: ${response.status}`)

    // Log sucesso
    await supabase.from('webhook_logs').insert({
      subscription_id: subscription.id,
      event_type: queueItem.event_type,
      payload: queueItem.payload,
      status_code: response.status,
      response_body: responseBody.substring(0, 1000), // Limitar tamanho
      duration_ms: durationMs,
      attempt_number: queueItem.attempts + 1,
    })

    // Marcar como enviado
    await supabase
      .from('webhook_queue')
      .update({ status: 'sent' })
      .eq('id', queueItem.id)

    return {
      id: queueItem.id,
      status: 'sent',
      statusCode: response.status,
      duration: durationMs
    }

  } catch (error) {
    const durationMs = Date.now() - startTime
    const attempts = queueItem.attempts + 1

    console.error(`Webhook ${queueItem.id} failed:`, error.message)

    // Log erro
    await supabase.from('webhook_logs').insert({
      subscription_id: subscription.id,
      event_type: queueItem.event_type,
      payload: queueItem.payload,
      error_message: error.message,
      attempt_number: attempts,
      duration_ms: durationMs,
    })

    // Atualizar fila
    if (attempts >= subscription.retry_count) {
      // Falhou após todas as tentativas
      console.log(`Webhook ${queueItem.id} failed permanently after ${attempts} attempts`)
      await supabase
        .from('webhook_queue')
        .update({ status: 'failed', attempts })
        .eq('id', queueItem.id)
      
      return {
        id: queueItem.id,
        status: 'failed',
        error: error.message,
        attempts
      }
    } else {
      // Tentar novamente
      console.log(`Webhook ${queueItem.id} will retry (attempt ${attempts}/${subscription.retry_count})`)
      await supabase
        .from('webhook_queue')
        .update({ status: 'pending', attempts })
        .eq('id', queueItem.id)
      
      return {
        id: queueItem.id,
        status: 'retry',
        error: error.message,
        attempts
      }
    }
  }
}
