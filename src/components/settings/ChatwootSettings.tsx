import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ExternalLink, Key, Hash } from 'lucide-react'
import { toast } from 'sonner'

export function ChatwootSettings() {
  const { settings, updateSetting } = useSettings()
  const [url, setUrl] = useState(settings.chatwoot_url || '')
  const [accountId, setAccountId] = useState(settings.chatwoot_account_id || '')
  const [accessToken, setAccessToken] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when settings load from server
  useEffect(() => {
    if (!isSaving) {
      if (settings.chatwoot_url) setUrl(settings.chatwoot_url)
      if (settings.chatwoot_account_id) setAccountId(settings.chatwoot_account_id)
    }
  }, [settings, isSaving])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (url) await updateSetting({ key: 'chatwoot_url', value: url })
      if (accountId) await updateSetting({ key: 'chatwoot_account_id', value: accountId })
      if (accessToken) await updateSetting({ key: 'chatwoot_access_token', value: accessToken })

      toast.success('Configuracoes do Chatwoot salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar configuracoes')
    } finally {
      setIsSaving(false)
    }
  }

  const isValidUrl = (str: string) => {
    try {
      const urlObj = new URL(str)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const isValid = isValidUrl(url)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integracao Chatwoot</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Configure a integracao com o Chatwoot para sincronizacao de contatos
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Configuration */}
        <div className="space-y-2">
          <Label htmlFor="chatwoot-url">URL do Chatwoot</Label>
          <Input
            id="chatwoot-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://app.chatwoot.com"
            className="h-11"
          />
          {!isValid && url && (
            <p className="text-sm text-red-500">URL invalida. Deve comecar com http:// ou https://</p>
          )}
          <p className="text-xs text-slate-500">
            URL base da sua instalacao do Chatwoot
          </p>
        </div>

        {/* Account ID Configuration */}
        <div className="space-y-2">
          <Label htmlFor="chatwoot-account-id" className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-slate-400" />
            Account ID
          </Label>
          <Input
            id="chatwoot-account-id"
            type="number"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Ex: 1"
            className="h-11"
          />
          <p className="text-xs text-slate-500">
            ID da conta no Chatwoot (geralmente visivel na URL apos /app/accounts/&lt;ID&gt;/...)
          </p>
        </div>

        {/* Access Token Configuration */}
        <div className="space-y-2">
          <Label htmlFor="chatwoot-token" className="flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-400" />
            Access Token
          </Label>
          <Input
            id="chatwoot-token"
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Digite seu token de acesso"
            className="h-11 font-mono"
          />
          <p className="text-xs text-slate-500">
            Token de acesso da API do Chatwoot (Configuracoes de Perfil {'>'} Token de Acesso)
          </p>
          <p className="text-xs text-amber-600">
            Por seguranca, o token atual nao e exibido. Preencha apenas para atualizar.
          </p>
        </div>

        {isValid && url && accountId && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-medium mb-2">Preview de Link:</p>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <ExternalLink className="h-4 w-4" />
              <span className="truncate">{url}/app/accounts/{accountId}/conversations/12345</span>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? 'Salvando...' : 'Salvar Configuracao'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}