import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineManager } from '@/components/settings/PipelineManager'
import { ChatwootSettings } from '@/components/settings/ChatwootSettings'
import { DealTitlesManager } from '@/components/settings/DealTitlesManager'
import { Settings as SettingsIcon } from 'lucide-react'

export function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie pipelines, etapas e integrações</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pipelines" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
          <TabsTrigger value="deal-titles">Títulos de Negócios</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="mt-6">
          <PipelineManager />
        </TabsContent>

        <TabsContent value="deal-titles" className="mt-6">
          <DealTitlesManager />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <ChatwootSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
