import { supabase } from '@/lib/supabase'
import type { Receipt } from '@/types/database'

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
 * Queue payment.received event to be processed server-side by webhook-processor.
 */
export async function triggerPaymentReceivedWebhook(receipt: Receipt): Promise<{
  success: boolean
  message: string
  sentCount: number
}> {
  try {
    const payload: WebhookPayload = {
      event: 'payment.received',
      timestamp: new Date().toISOString(),
      data: {
        receipt,
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

    // @ts-expect-error - RPC type not generated yet for trigger_webhook
    const { error } = await supabase.rpc('trigger_webhook', {
      p_event_type: 'payment.received',
      p_payload: payload,
    })

    if (error) throw error

    return {
      success: true,
      message: 'Evento enviado para a fila de webhooks.',
      sentCount: 0,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro ao enviar webhook.'
    console.error('Error triggering webhook:', error)

    return {
      success: false,
      message: errorMessage,
      sentCount: 0,
    }
  }
}
