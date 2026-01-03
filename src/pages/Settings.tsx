import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineManager } from '@/components/settings/PipelineManager'
import { ChatwootSettings } from '@/components/settings/ChatwootSettings'
import { DealTitlesManager } from '@/components/settings/DealTitlesManager'
import { Companies } from './erp/Companies'
import { ERPSettingsManager } from '@/components/settings/ERPSettingsManager'
import { PDFTemplateSettings } from '@/components/settings/PDFTemplateSettings'
import { BrandingSettings } from '@/components/settings/BrandingSettings'
import { ContractItemsCatalogManager } from '@/components/settings/ContractItemsCatalogManager'
import { ContractTemplatesManager } from '@/components/settings/ContractTemplatesManager'
import { LayoutDashboard, Building2, Plug, Settings as SettingsIcon } from 'lucide-react'

export function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-linear-to-br from-purple-500 to-blue-600 flex items-center justify-center">
          <SettingsIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-sm text-slate-600 mt-1">Gerencie configurações do CRM, ERP e Integrações</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="crm" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="crm" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            CRM
          </TabsTrigger>
          <TabsTrigger value="erp" className="gap-2">
            <Building2 className="h-4 w-4" />
            ERP
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* CRM Tab */}
        <TabsContent value="crm" className="mt-6">
          <Tabs defaultValue="pipelines" className="w-full">
            <TabsList className="grid w-full max-w-xl grid-cols-2">
              <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
              <TabsTrigger value="deal-titles">Títulos de Negócios</TabsTrigger>
            </TabsList>

            <TabsContent value="pipelines" className="mt-6">
              <PipelineManager />
            </TabsContent>

            <TabsContent value="deal-titles" className="mt-6">
              <DealTitlesManager />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ERP Tab */}
        <TabsContent value="erp" className="mt-6">
          <Tabs defaultValue="companies" className="w-full">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="contract-settings">Contratos</TabsTrigger>
              <TabsTrigger value="catalog-items">Itens</TabsTrigger>
              <TabsTrigger value="contract-templates">Templates</TabsTrigger>
              <TabsTrigger value="pdf-templates">PDF</TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="mt-6">
              <Companies />
            </TabsContent>

            <TabsContent value="contract-settings" className="mt-6">
              <ERPSettingsManager />
            </TabsContent>

            <TabsContent value="catalog-items" className="mt-6">
              <ContractItemsCatalogManager />
            </TabsContent>

            <TabsContent value="contract-templates" className="mt-6">
              <ContractTemplatesManager />
            </TabsContent>

            <TabsContent value="pdf-templates" className="mt-6">
              <PDFTemplateSettings />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <Tabs defaultValue="chatwoot" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="chatwoot">Chatwoot</TabsTrigger>
              <TabsTrigger value="api-keys">API Keys</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="chatwoot" className="mt-6">
              <ChatwootSettings />
            </TabsContent>

            <TabsContent value="api-keys" className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">API Keys</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Gerencie chaves de API para integração com sistemas externos como N8N, Zapier e outros.
                </p>
                <a
                  href="/integrations/api-keys"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Gerenciar API Keys →
                </a>
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="mt-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Webhooks</h3>
                <p className="text-sm text-purple-700 mb-4">
                  Configure webhooks para receber notificações em tempo real de eventos do sistema.
                </p>
                <a
                  href="/integrations/webhooks"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Gerenciar Webhooks →
                </a>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Sistema Tab */}
        <TabsContent value="system" className="mt-6">
          <div className="space-y-6">
            {/* User Management Card */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Gerenciamento de Usuários</h3>
              <p className="text-sm text-indigo-700 mb-4">
                Gerencie usuários do sistema e suas permissões de acesso (visualizar, criar, editar).
              </p>
              <a
                href="/system/users"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Gerenciar Usuários →
              </a>
            </div>

            {/* Branding Settings */}
            <BrandingSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
