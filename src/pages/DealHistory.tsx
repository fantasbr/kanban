import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, Search, Calendar, FileText, ExternalLink, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useArchivedDeals } from '@/hooks/useArchivedDeals'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function DealHistory() {
  const navigate = useNavigate()
  const { archivedDeals, isLoading } = useArchivedDeals()
  const [searchTerm, setSearchTerm] = useState('')

  // Filter deals by search term
  const filteredDeals = archivedDeals.filter((deal) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      deal.title.toLowerCase().includes(searchLower) ||
      deal.contacts?.name.toLowerCase().includes(searchLower) ||
      deal.erp_contracts?.contract_number.toLowerCase().includes(searchLower) ||
      deal.archived_reason?.toLowerCase().includes(searchLower)
    )
  })

  // Calculate statistics
  const totalArchived = archivedDeals.length
  
  // Separar convertidos (com contrato) de arquivados (sem contrato)
  const convertedDeals = archivedDeals.filter((deal) => deal.contract_id && deal.erp_contracts)
  
  const thisMonth = archivedDeals.filter((deal) => {
    if (!deal.archived_at) return false
    const archivedDate = parseISO(deal.archived_at)
    const now = new Date()
    return (
      archivedDate.getMonth() === now.getMonth() &&
      archivedDate.getFullYear() === now.getFullYear()
    )
  }).length

  const totalValue = archivedDeals.reduce((sum, deal) => {
    return sum + (deal.erp_contracts?.final_value || deal.deal_value_negotiated)
  }, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-slate-500">Carregando histórico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="h-8 w-8 text-purple-600" />
            Histórico de Deals
          </h1>
          <p className="text-slate-500 mt-1">
            Deals arquivados e convertidos em contratos
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Arquivados</CardTitle>
            <Archive className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalArchived}</div>
            <p className="text-xs text-slate-500">deals concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonth}</div>
            <p className="text-xs text-slate-500">novos arquivamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-slate-500">em contratos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{convertedDeals.length}</div>
            <p className="text-xs text-slate-500">com contrato gerado</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por cliente, título, contrato ou motivo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Deals List */}
      <div className="space-y-4">
        {filteredDeals.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Archive className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchTerm
                  ? 'Nenhum deal encontrado com esse critério'
                  : 'Nenhum deal arquivado ainda'}
              </p>
            </div>
          </Card>
        ) : (
          filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        {deal.contacts?.profile_url ? (
                          <img
                            src={deal.contacts.profile_url}
                            alt={deal.contacts.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-purple-600 font-bold">
                            {deal.contacts?.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-slate-900">
                          {deal.contacts?.name || 'Sem contato'}
                        </h3>
                        <p className="text-slate-600">{deal.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(deal.erp_contracts?.final_value || deal.deal_value_negotiated)}
                        </p>
                        {deal.contract_id && deal.erp_contracts ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Convertido
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Archive className="h-3 w-3 mr-1" />
                            Arquivado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-xs text-slate-500">Arquivado em</p>
                        <p className="text-sm font-medium">
                          {deal.archived_at
                            ? format(parseISO(deal.archived_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Motivo</p>
                        <p className="text-sm font-medium">{deal.archived_reason || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Stage</p>
                        <p className="text-sm font-medium">{deal.crm_stages?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Status Contrato</p>
                        <Badge
                          variant={
                            deal.erp_contracts?.status === 'active'
                              ? 'default'
                              : deal.erp_contracts?.status === 'completed'
                              ? 'success'
                              : 'secondary'
                          }
                        >
                          {deal.erp_contracts?.status === 'active'
                            ? 'Ativo'
                            : deal.erp_contracts?.status === 'completed'
                            ? 'Concluído'
                            : deal.erp_contracts?.status === 'cancelled'
                            ? 'Cancelado'
                            : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    {deal.contract_id && deal.erp_contracts && (
                      <div className="flex gap-2 pt-3 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => navigate(`/erp/contracts`)}
                        >
                          <FileText className="h-4 w-4" />
                          Ver Contrato {deal.erp_contracts.contract_number}
                        </Button>
                        {deal.contacts?.chatwoot_id && deal.contacts.chatwoot_id > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              // Link para Chatwoot se necessário
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver no CRM
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredDeals.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">
              Mostrando <strong>{filteredDeals.length}</strong> de{' '}
              <strong>{totalArchived}</strong> deals arquivados
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
