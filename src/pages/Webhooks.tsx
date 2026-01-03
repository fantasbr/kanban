import { useState } from 'react'
import { useWebhooks } from '@/hooks/useWebhooks'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Copy, Webhook, Trash2, Plus, AlertCircle, ExternalLink, Activity } from 'lucide-react'

export function Webhooks() {
  const { webhooks, isLoading, createWebhook, deleteWebhook, updateWebhook, isDeleting } = useWebhooks()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState<string | null>(null)
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar o webhook "${name}"?`)) {
      return
    }

    try {
      await deleteWebhook(id)
      toast.success('Webhook deletado com sucesso')
    } catch (error: any) {
      toast.error('Erro ao deletar webhook: ' + error.message)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateWebhook({ id, updates: { is_active: !currentStatus } })
      toast.success(currentStatus ? 'Webhook desativado' : 'Webhook ativado')
    } catch (error: any) {
      toast.error('Erro ao atualizar webhook: ' + error.message)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copiado para área de transferência!')
    } catch (error) {
      toast.error('Erro ao copiar. Copie manualmente.')
      console.error('Clipboard error:', error)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-500 mt-1">
            Configure webhooks para receber notificações em tempo real
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Webhook
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <Webhook className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum webhook configurado</h3>
          <p className="text-gray-500 mb-4">
            Crie seu primeiro webhook para receber notificações de eventos do sistema
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Webhook
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{webhook.name}</h3>
                    <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                      {webhook.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                    <ExternalLink className="w-4 h-4" />
                    <a
                      href={webhook.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {webhook.url}
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Criado em: {formatDate(webhook.created_at)}</p>
                    <p>Tentativas: {webhook.retry_count} | Timeout: {webhook.timeout_seconds}s</p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(webhook.id, webhook.is_active)}
                    >
                      {webhook.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLogsModal(webhook.id)}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      Ver Logs
                    </Button>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(webhook.id, webhook.name)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <CreateWebhookModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setNewWebhookSecret(null)
        }}
        onCreate={async (data) => {
          try {
            const result = await createWebhook(data)
            setNewWebhookSecret(result.secret)
            toast.success('Webhook criado com sucesso!')
          } catch (error: any) {
            toast.error('Erro ao criar webhook: ' + error.message)
          }
        }}
        newSecret={newWebhookSecret}
      />

      {/* Modal de Logs */}
      {showLogsModal && (
        <WebhookLogsModal
          subscriptionId={showLogsModal}
          onClose={() => setShowLogsModal(null)}
        />
      )}
    </div>
  )
}

function CreateWebhookModal({
  open,
  onClose,
  onCreate,
  newSecret,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  newSecret: string | null
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [retryCount, setRetryCount] = useState(3)
  const [timeoutSeconds, setTimeoutSeconds] = useState(30)
  const [isCreating, setIsCreating] = useState(false)

  const availableEvents = [
    { value: 'deal.created', label: 'Deal Criado' },
    { value: 'contract.signed', label: 'Contrato Assinado' },
    { value: 'payment.received', label: 'Pagamento Recebido' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!url.trim()) {
      toast.error('URL é obrigatória')
      return
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('URL deve começar com http:// ou https://')
      return
    }

    if (events.length === 0) {
      toast.error('Selecione pelo menos um evento')
      return
    }

    setIsCreating(true)
    try {
      await onCreate({ name, url, events, retryCount, timeoutSeconds })
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setName('')
    setUrl('')
    setEvents([])
    setRetryCount(3)
    setTimeoutSeconds(30)
    onClose()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Secret copiado!')
    } catch (error) {
      toast.error('Erro ao copiar. Copie manualmente.')
      console.error('Clipboard error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {newSecret ? 'Webhook Criado!' : 'Criar Novo Webhook'}
          </DialogTitle>
          <DialogDescription>
            {newSecret
              ? 'Copie o secret HMAC agora. Ele não será exibido novamente.'
              : 'Configure a URL e eventos que dispararão este webhook'}
          </DialogDescription>
        </DialogHeader>

        {newSecret ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Importante!</p>
                <p>
                  Use este secret para validar a assinatura HMAC-SHA256 dos webhooks.
                  Armazene em um local seguro.
                </p>
              </div>
            </div>

            <div>
              <Label>Secret HMAC</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSecret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(newSecret)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-2 font-semibold">
                Como validar no N8N:
              </p>
              <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`const crypto = require('crypto');
const signature = $headers['x-webhook-signature'];
const secret = '${newSecret}';
const payload = JSON.stringify($body);

const expected = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expected) {
  throw new Error('Invalid signature');
}`}
              </pre>
            </div>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Webhook</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: N8N Production"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="url">URL de Destino</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://n8n.example.com/webhook/..."
                className="mt-1"
              />
            </div>

            <div>
              <Label>Eventos</Label>
              <div className="space-y-2 mt-2">
                {availableEvents.map((event) => (
                  <div key={event.value} className="flex items-center gap-2">
                    <Checkbox
                      id={event.value}
                      checked={events.includes(event.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEvents([...events, event.value])
                        } else {
                          setEvents(events.filter((e) => e !== event.value))
                        }
                      }}
                    />
                    <Label htmlFor={event.value} className="cursor-pointer">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="retry">Tentativas em Caso de Falha</Label>
                <Input
                  id="retry"
                  type="number"
                  min="1"
                  max="10"
                  value={retryCount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (!isNaN(value) && value >= 1 && value <= 10) {
                      setRetryCount(value)
                    }
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="5"
                  max="120"
                  value={timeoutSeconds}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (!isNaN(value) && value >= 5 && value <= 120) {
                      setTimeoutSeconds(value)
                    }
                  }}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating} className="flex-1">
                {isCreating ? 'Criando...' : 'Criar Webhook'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function WebhookLogsModal({
  subscriptionId,
  onClose,
}: {
  subscriptionId: string
  onClose: () => void
}) {
  const { useWebhookLogs } = useWebhooks()
  const { data: logs, isLoading } = useWebhookLogs(subscriptionId)

  const getStatusBadge = (log: any) => {
    if (log.error_message) {
      return <Badge variant="destructive">Erro</Badge>
    }
    if (log.status_code >= 200 && log.status_code < 300) {
      return <Badge variant="default">Sucesso</Badge>
    }
    if (log.status_code >= 400) {
      return <Badge variant="destructive">Falha</Badge>
    }
    return <Badge variant="secondary">Desconhecido</Badge>
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Logs do Webhook</DialogTitle>
          <DialogDescription>
            Últimas 50 tentativas de envio
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando logs...</p>
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log: any) => (
              <Card key={log.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{log.event_type}</span>
                      {getStatusBadge(log)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {log.status_code && (
                      <p className="font-mono">Status: {log.status_code}</p>
                    )}
                    {log.duration_ms && (
                      <p className="text-gray-500">{log.duration_ms}ms</p>
                    )}
                    <p className="text-gray-500">Tentativa #{log.attempt_number}</p>
                  </div>
                </div>

                {log.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                    <p className="text-sm text-red-800 font-mono">{log.error_message}</p>
                  </div>
                )}

                {log.response_body && (
                  <details className="mt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                      Ver resposta
                    </summary>
                    <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {log.response_body}
                    </pre>
                  </details>
                )}
              </Card>
            ))}
          </div>
        )}

        <Button onClick={onClose} className="w-full mt-4">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
