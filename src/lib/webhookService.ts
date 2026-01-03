import { supabase } from '@/lib/supabase'
import type { Receipt } from '@/types/database'

interface WebhookSubscription {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  is_active: boolean
  retry_count: number
  timeout_seconds: number
  headers: Record<string, string>
}

interface WebhookPayload {
  event: string
  timestamp: string
  data: {
    receipt: Receipt
    client: {
      id: number
      full_name: string
      cpf: string
      phone?: string
    }
    payment: {
      amount: number
      payment_method: string
      payment_date: string
    }
  }
}

/**
 * Trigger webhook for payment.received event
 * Sends receipt data to all active webhooks configured for this event
 */
export async function triggerPaymentReceivedWebhook(receipt: Receipt): Promise<{
  success: boolean
  message: string
  sentCount: number
}> {
  try {
    // 1. Fetch active webhooks with payment.received event
    const { data: webhooks, error: webhookError } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('is_active', true)
      .contains('events', ['payment.received'])

    if (webhookError) throw webhookError

    if (!webhooks || webhooks.length === 0) {
      return {
        success: false,
        message: 'Webhook não configurado.',
        sentCount: 0,
      }
    }

    // Cast to proper type
    const typedWebhooks = webhooks as unknown as WebhookSubscription[]

    // 2. Prepare payload
    const payload: WebhookPayload = {
      event: 'payment.received',
      timestamp: new Date().toISOString(),
      data: {
        receipt: receipt,
        client: {
          id: receipt.clients?.id || 0,
          full_name: receipt.clients?.full_name || '',
          cpf: receipt.clients?.cpf || '',
          // @ts-expect-error - phone may not exist on Client type
          phone: receipt.clients?.phone || undefined,
        },
        payment: {
          amount: receipt.amount,
          payment_method: receipt.payment_methods?.name || '',
          payment_date: receipt.receipt_date,
        },
      },
    }

    // 3. Send to all webhooks
    let successCount = 0
    const sendPromises = typedWebhooks.map(async (webhook) => {
      try {
        // Generate HMAC signature
        const secret = webhook.secret
        const payloadString = JSON.stringify(payload)
        
        const encoder = new TextEncoder()
        const keyData = encoder.encode(secret)
        const messageData = encoder.encode(payloadString)
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        )
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')

        // Send webhook
        const startTime = Date.now()
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signatureHex,
            'X-Webhook-Event': 'payment.received',
            ...webhook.headers,
          },
          body: payloadString,
          signal: AbortSignal.timeout(webhook.timeout_seconds * 1000),
        })

        const duration = Date.now() - startTime
        const responseBody = await response.text()

        // Log webhook attempt
        // @ts-expect-error - Supabase type inference issue
        await supabase.from('webhook_logs').insert({
          subscription_id: webhook.id,
          event_type: 'payment.received',
          status_code: response.status,
          response_body: responseBody.substring(0, 1000), // Limit to 1000 chars
          duration_ms: duration,
          attempt_number: 1,
          error_message: response.ok ? null : `HTTP ${response.status}`,
        })

        if (response.ok) {
          successCount++
        }

        return response.ok
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        // Log error
        // @ts-expect-error - Supabase type inference issue
        await supabase.from('webhook_logs').insert({
          subscription_id: webhook.id,
          event_type: 'payment.received',
          status_code: null,
          response_body: null,
          duration_ms: null,
          attempt_number: 1,
          error_message: errorMessage,
        })
        return false
      }
    })

    await Promise.all(sendPromises)

    return {
      success: successCount > 0,
      message: successCount > 0 
        ? `Recibo enviado com sucesso para ${successCount} webhook(s)!`
        : 'Falha ao enviar para todos os webhooks.',
      sentCount: successCount,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar webhook.'
    console.error('Error triggering webhook:', error)
    return {
      success: false,
      message: errorMessage,
      sentCount: 0,
    }
  }
}
