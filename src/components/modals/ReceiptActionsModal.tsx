import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquare, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PDFDownloadLink, pdf } from '@react-pdf/renderer'
import { ReceiptPDF } from '@/components/pdf/ReceiptPDF'
import { triggerPaymentReceivedWebhook } from '@/lib/webhookService'
import type { Receipt } from '@/types/database'

interface ReceiptActionsModalProps {
  open: boolean
  onClose: () => void
  receipt: Receipt | null
}

export function ReceiptActionsModal({ open, onClose, receipt }: ReceiptActionsModalProps) {
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)

  const handleSendWhatsApp = async () => {
    if (!receipt) return

    setIsSendingWhatsApp(true)
    try {
      const result = await triggerPaymentReceivedWebhook(receipt)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error sending via WhatsApp:', error)
      toast.error('Erro ao enviar recibo via WhatsApp')
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  const handlePrint = async () => {
    if (!receipt) return

    try {
      // Generate PDF blob
      const blob = await pdf(<ReceiptPDF receipt={receipt} />).toBlob()
      
      // Create URL and open in new window for printing
      const url = URL.createObjectURL(blob)
      const printWindow = window.open(url, '_blank')
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          // Clean up URL after a delay
          setTimeout(() => URL.revokeObjectURL(url), 1000)
        }
      } else {
        toast.error('Bloqueador de pop-ups ativado. Permita pop-ups para imprimir.')
      }
    } catch (error) {
      console.error('Error printing receipt:', error)
      toast.error('Erro ao preparar recibo para impressão')
    }
  }

  if (!receipt) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo Gerado com Sucesso!</DialogTitle>
          <DialogDescription>
            Recibo Nº {receipt.receipt_number} - {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(receipt.amount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Cliente</p>
            <p className="font-semibold">{receipt.clients?.full_name}</p>
            <p className="text-sm text-slate-500">{receipt.clients?.cpf}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleSendWhatsApp}
              disabled={isSendingWhatsApp}
              className="w-full"
              variant="default"
            >
              {isSendingWhatsApp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar WhatsApp
                </>
              )}
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              className="w-full"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>

          <div className="pt-2">
            <PDFDownloadLink
              document={<ReceiptPDF receipt={receipt} />}
              fileName={`recibo-${receipt.receipt_number}.pdf`}
              className="w-full"
            >
              {({ loading }) => (
                <Button variant="ghost" className="w-full" disabled={loading}>
                  {loading ? 'Preparando...' : 'Baixar PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
