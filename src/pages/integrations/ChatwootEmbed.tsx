import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'

export function ChatwootEmbed() {
  const { chatwootUrl } = useChatwootUrl()
  const [iframeError, setIframeError] = useState(false)
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    // Detectar se iframe não carregou após 3 segundos
    const timer = setTimeout(() => {
      setShowFallback(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setShowFallback(false)
    setIframeError(false)
    const iframe = document.getElementById('chatwoot-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.src = iframe.src
    }
  }

  const handleIframeError = () => {
    setIframeError(true)
  }

  const handleOpenNewTab = () => {
    window.open(chatwootUrl, '_blank', 'noopener,noreferrer')
  }

  if (!chatwootUrl) {
    return (
      <Card className="p-8 max-w-2xl mx-auto mt-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Chatwoot não configurado</h3>
          <p className="text-gray-600 mb-6">
            Configure a URL do Chatwoot em Configurações → Integrações → Chatwoot para começar a usar.
          </p>
          <Button onClick={() => window.location.href = '/settings'}>
            Ir para Configurações
          </Button>
        </div>
      </Card>
    )
  }

  if (iframeError || showFallback) {
    return (
      <div className="flex flex-col h-full">
        {/* Header com controles */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
              <span className="text-white text-xl">💬</span>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Chatwoot</h2>
              <p className="text-xs text-gray-500">Central de atendimento</p>
            </div>
          </div>
        </div>

        {/* Mensagem centralizada */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Card className="p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Abrir Chatwoot</h3>
              <p className="text-gray-600 mb-6">
                Por questões de segurança, o Chatwoot precisa ser aberto em uma nova aba.
              </p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleOpenNewTab} size="lg" className="w-full">
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Abrir Chatwoot em Nova Aba
                </Button>
                <Button variant="outline" onClick={handleRefresh} size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Carregar Novamente
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header com controles */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
            <span className="text-white text-xl">💬</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">Chatwoot</h2>
            <p className="text-xs text-gray-500">Central de atendimento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Nova Aba
          </Button>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative bg-gray-50">
        <iframe
          id="chatwoot-iframe"
          src={chatwootUrl}
          className="absolute inset-0 w-full h-full border-0"
          title="Chatwoot"
          allow="microphone; camera"
          onError={handleIframeError}
        />
      </div>
    </div>
  )
}
