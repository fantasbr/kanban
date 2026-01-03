import { useState } from 'react'
import { useAPIKeys } from '@/hooks/useAPIKeys'
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
import { Copy, Key, Trash2, Plus, AlertCircle } from 'lucide-react'

export function APIKeys() {
  const { apiKeys, isLoading, createAPIKey, deleteAPIKey, isDeleting } = useAPIKeys()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a API Key "${name}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    try {
      await deleteAPIKey(id)
      toast.success('API Key deletada com sucesso')
    } catch (error: any) {
      toast.error('Erro ao deletar API Key: ' + error.message)
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

  const formatDate = (date: string | null) => {
    if (!date) return 'Nunca'
    return new Date(date).toLocaleString('pt-BR')
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-gray-500 mt-1">
            Gerencie chaves de API para integração com sistemas externos
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova API Key
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Carregando...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma API Key criada</h3>
          <p className="text-gray-500 mb-4">
            Crie sua primeira API Key para começar a integrar com N8N e outros sistemas
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar API Key
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apiKeys.map((key) => (
            <Card key={key.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{key.name}</h3>
                    {!key.is_active && (
                      <Badge variant="secondary">Inativa</Badge>
                    )}
                    {key.expires_at && new Date(key.expires_at) < new Date() && (
                      <Badge variant="destructive">Expirada</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                      {key.key_prefix}••••••••••••••••••••
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(key.key_prefix)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {key.permissions.map((perm) => (
                      <Badge key={perm} variant="outline">
                        {perm}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Criada em: {formatDate(key.created_at)}</p>
                    <p>Último uso: {formatDate(key.last_used_at)}</p>
                    {key.expires_at && (
                      <p>Expira em: {formatDate(key.expires_at)}</p>
                    )}
                  </div>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(key.id, key.name)}
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
      <CreateAPIKeyModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setNewApiKey(null)
        }}
        onCreate={async (data) => {
          try {
            const result = await createAPIKey(data)
            setNewApiKey(result.api_key)
            toast.success('API Key criada com sucesso!')
          } catch (error: any) {
            toast.error('Erro ao criar API Key: ' + error.message)
          }
        }}
        newApiKey={newApiKey}
      />
    </div>
  )
}

function CreateAPIKeyModal({
  open,
  onClose,
  onCreate,
  newApiKey,
}: {
  open: boolean
  onClose: () => void
  onCreate: (data: any) => Promise<void>
  newApiKey: string | null
}) {
  const [name, setName] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [expiresInDays, setExpiresInDays] = useState<number | undefined>(undefined)
  const [isCreating, setIsCreating] = useState(false)

  const availablePermissions = [
    { value: 'crm:read', label: 'CRM - Leitura' },
    { value: 'crm:write', label: 'CRM - Escrita' },
    { value: 'erp:read', label: 'ERP - Leitura' },
    { value: 'erp:write', label: 'ERP - Escrita' },
    { value: '*', label: 'Acesso Total (Wildcard)' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (permissions.length === 0) {
      toast.error('Selecione pelo menos uma permissão')
      return
    }

    setIsCreating(true)
    try {
      await onCreate({ name, permissions, expiresInDays })
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setName('')
    setPermissions([])
    setExpiresInDays(undefined)
    onClose()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('API Key copiada!')
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
            {newApiKey ? 'API Key Criada!' : 'Criar Nova API Key'}
          </DialogTitle>
          <DialogDescription>
            {newApiKey
              ? 'Copie sua API Key agora. Ela não será exibida novamente.'
              : 'Configure as permissões e detalhes da nova API Key'}
          </DialogDescription>
        </DialogHeader>

        {newApiKey ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Importante!</p>
                <p>
                  Esta é a única vez que você verá esta API Key completa. 
                  Copie e armazene em um local seguro.
                </p>
              </div>
            </div>

            <div>
              <Label>Sua API Key</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={() => copyToClipboard(newApiKey)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da API Key</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Integração N8N"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Permissões</Label>
              <div className="space-y-2 mt-2">
                {availablePermissions.map((perm) => (
                  <div key={perm.value} className="flex items-center gap-2">
                    <Checkbox
                      id={perm.value}
                      checked={permissions.includes(perm.value)}
                      onCheckedChange={(checked) => {
                        if (perm.value === '*') {
                          // Se selecionar wildcard, limpar outras permissões
                          setPermissions(checked ? ['*'] : [])
                        } else {
                          // Se selecionar outra permissão, remover wildcard
                          const newPerms = permissions.filter(p => p !== '*')
                          if (checked) {
                            setPermissions([...newPerms, perm.value])
                          } else {
                            setPermissions(newPerms.filter((p) => p !== perm.value))
                          }
                        }
                      }}
                    />
                    <Label htmlFor={perm.value} className="cursor-pointer">
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="expires">Expiração (opcional)</Label>
              <select
                id="expires"
                value={expiresInDays || ''}
                onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Nunca expira</option>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
                <option value="180">180 dias</option>
                <option value="365">1 ano</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating} className="flex-1">
                {isCreating ? 'Criando...' : 'Criar API Key'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
