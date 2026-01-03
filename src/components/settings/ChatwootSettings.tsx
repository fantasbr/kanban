import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

export function ChatwootSettings() {
  const { settings, updateSetting } = useSettings()
  const [url, setUrl] = useState(settings.chatwoot_url || '')
  const [isSaving, setIsSaving] = useState(false)

  // Update local state when settings load from server
  // Only sync if we're not currently saving (to avoid overwriting user edits)
  useEffect(() => {
    if (settings.chatwoot_url && !isSaving) {
      setUrl(settings.chatwoot_url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.chatwoot_url])

  const handleSave = () => {
    setIsSaving(true)
    updateSetting(
      { key: 'chatwoot_url', value: url },
      {
        onSuccess: () => {
          // URL updated successfully
        },
        onError: (error) => {
          console.error('Erro ao atualizar URL:', error)
        },
        onSettled: () => setIsSaving(false),
      }
    )
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
        <CardTitle>Integração Chatwoot</CardTitle>
        <p className="text-sm text-slate-500 mt-1">
          Configure a URL base do seu Chatwoot para abrir conversas e contatos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <p className="text-sm text-red-500">URL inválida. Deve começar com http:// ou https://</p>
          )}
        </div>

        {isValid && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-sm text-blue-700 font-medium mb-2">Preview:</p>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <ExternalLink className="h-4 w-4" />
              <span className="truncate">{url}/app/accounts/1/conversations/12345</span>
            </div>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={!isValid || isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </CardContent>
    </Card>
  )
}
