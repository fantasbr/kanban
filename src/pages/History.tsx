import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Users, Building2, FileText, DollarSign, GraduationCap } from 'lucide-react'
import { useCrmAudit } from '@/hooks/useCrmAudit'
import { useErpAudit } from '@/hooks/useErpAudit'
import { useContractsAudit } from '@/hooks/useContractsAudit'
import { useFinancialAudit } from '@/hooks/useFinancialAudit'
import { useLessonsAudit } from '@/hooks/useLessonsAudit'
import { AuditTimeline } from '@/components/audit/AuditTimeline'

export function History() {
  const [activeTab, setActiveTab] = useState('crm')

  const crmAudit = useCrmAudit({ limit: 100 })
  const erpAudit = useErpAudit({ limit: 100 })
  const contractsAudit = useContractsAudit({ limit: 100 })
  const financialAudit = useFinancialAudit({ limit: 100 })
  const lessonsAudit = useLessonsAudit({ limit: 100 })

  const handleRefresh = () => {
    switch (activeTab) {
      case 'crm':
        crmAudit.refetch()
        break
      case 'erp':
        erpAudit.refetch()
        break
      case 'contracts':
        contractsAudit.refetch()
        break
      case 'financial':
        financialAudit.refetch()
        break
      case 'lessons':
        lessonsAudit.refetch()
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Atividades</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe todas as ações realizadas no sistema
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="crm" className="gap-2">
            <Users className="h-4 w-4" />
            CRM
            {crmAudit.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {crmAudit.items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="erp" className="gap-2">
            <Building2 className="h-4 w-4" />
            ERP
            {erpAudit.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {erpAudit.items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="gap-2">
            <FileText className="h-4 w-4" />
            Contratos
            {contractsAudit.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {contractsAudit.items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
            {financialAudit.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {financialAudit.items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="lessons" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Aulas
            {lessonsAudit.items.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {lessonsAudit.items.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* CRM Tab */}
        <TabsContent value="crm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria CRM</CardTitle>
              <CardDescription>
                Histórico de contatos, deals, pipelines e stages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {crmAudit.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <AuditTimeline
                  items={crmAudit.items}
                  renderBadge={(item) => (
                    <Badge className="bg-blue-100 text-blue-700">
                      {item.action} - {item.entity_type}
                    </Badge>
                  )}
                  renderContent={(item) => {
                    const pipelineName = item.metadata?.pipeline_name ? String(item.metadata.pipeline_name) : null;
                    const oldStageName = item.metadata?.old_stage_name ? String(item.metadata.old_stage_name) : null;
                    const newStageName = item.metadata?.new_stage_name ? String(item.metadata.new_stage_name) : null;
                    
                    return (
                      <div className="space-y-1">
                        <p className="font-medium">
                          {String(item.metadata?.contact_name || item.metadata?.deal_title || 'Sem título')}
                        </p>
                        {pipelineName && (
                          <div className="text-sm text-slate-600">
                            📊 Pipeline: {pipelineName}
                          </div>
                        )}
                        {oldStageName && newStageName && (
                          <div className="text-sm text-slate-600">
                            {oldStageName} → {newStageName}
                          </div>
                        )}
                      </div>
                    );
                  }}
                  emptyMessage="Nenhuma atividade CRM encontrada"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ERP Tab */}
        <TabsContent value="erp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria ERP</CardTitle>
              <CardDescription>
                Histórico de clientes e fornecedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {erpAudit.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <AuditTimeline
                  items={erpAudit.items}
                  renderBadge={(item) => (
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {item.action} - {item.entity_type}
                    </Badge>
                  )}
                  renderContent={(item) => {
                    const cpf = item.metadata?.cpf ? String(item.metadata.cpf) : null;
                    
                    return (
                      <div className="space-y-1">
                        <p className="font-medium">
                          {String(item.metadata?.client_name || 'Sem nome')}
                        </p>
                        {cpf && (
                          <div className="text-sm text-slate-600">
                            📄 CPF: {cpf}
                          </div>
                        )}
                      </div>
                    );
                  }}
                  emptyMessage="Nenhuma atividade ERP encontrada"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria de Contratos</CardTitle>
              <CardDescription>
                Histórico de criação e alterações de contratos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contractsAudit.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <AuditTimeline
                  items={contractsAudit.items}
                  renderBadge={(item) => (
                    <Badge className="bg-indigo-100 text-indigo-700">
                      {item.action}
                    </Badge>
                  )}
                  renderContent={(item) => {
                    const clientName = item.metadata?.client_name ? String(item.metadata.client_name) : null;
                    
                    return (
                      <div className="space-y-1">
                        <p className="font-medium">
                          Contrato #{String(item.metadata?.contract_number || item.entity_id)}
                        </p>
                        {clientName && (
                          <div className="text-sm text-slate-600">
                            👤 Cliente: {clientName}
                          </div>
                        )}
                      </div>
                    );
                  }}
                  emptyMessage="Nenhuma atividade de contratos encontrada"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria Financeira</CardTitle>
              <CardDescription>
                Histórico de pagamentos e recebimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financialAudit.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <AuditTimeline
                  items={financialAudit.items}
                  renderBadge={(item) => (
                    <Badge className="bg-green-100 text-green-700">
                      {item.action} - {item.entity_type}
                    </Badge>
                  )}
                  renderContent={(item) => {
                    const amount = item.metadata?.amount ? String(item.metadata.amount) : null;
                    const dueDate = item.metadata?.due_date ? String(item.metadata.due_date) : null;
                    const status = item.metadata?.status ? String(item.metadata.status) : null;
                    const installmentNumber = item.metadata?.installment_number ? String(item.metadata.installment_number) : null;
                    const contractNumber = item.metadata?.contract_number ? String(item.metadata.contract_number) : null;
                    const receiptNumber = item.metadata?.receipt_number ? String(item.metadata.receipt_number) : null;
                    const receiptDate = item.metadata?.receipt_date ? String(item.metadata.receipt_date) : null;
                    
                    return (
                      <div className="space-y-1">
                        <p className="font-medium">
                          {item.entity_type === 'receivable' && installmentNumber && (
                            <>Parcela #{installmentNumber}</>
                          )}
                          {item.entity_type === 'receipt' && receiptNumber && (
                            <>Recibo {receiptNumber}</>
                          )}
                          {!installmentNumber && !receiptNumber && (
                            <>{item.entity_type} - {item.action}</>
                          )}
                        </p>
                        {contractNumber && (
                          <div className="text-sm text-slate-600">
                            📄 Contrato: {contractNumber}
                          </div>
                        )}
                        {amount && (
                          <div className="text-sm text-slate-600">
                            💰 Valor: R$ {parseFloat(amount).toFixed(2)}
                          </div>
                        )}
                        {dueDate && (
                          <div className="text-sm text-slate-600">
                            📅 Vencimento: {new Date(dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {receiptDate && (
                          <div className="text-sm text-slate-600">
                            📅 Data: {new Date(receiptDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {status && (
                          <div className="text-sm text-slate-600">
                            🏷️ Status: {status === 'pending' ? 'Pendente' : status === 'paid' ? 'Pago' : status}
                          </div>
                        )}
                      </div>
                    );
                  }}
                  emptyMessage="Nenhuma atividade financeira encontrada"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Auditoria de Aulas</CardTitle>
              <CardDescription>
                Histórico de agendamentos e realizações de aulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lessonsAudit.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <AuditTimeline
                  items={lessonsAudit.items}
                  renderBadge={(item) => (
                    <Badge className="bg-purple-100 text-purple-700">
                      {item.action}
                    </Badge>
                  )}
                  renderContent={(item) => (
                    <div className="space-y-1">
                      <p className="font-medium">
                        Aula {item.action}
                      </p>
                    </div>
                  )}
                  emptyMessage="Nenhuma atividade de aulas encontrada"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
