import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  User,
  Mail,
  Phone,
  ExternalLink,
  Edit,
  FileText,
  TrendingUp,
  Archive,
  UserCircle,
  MapPin,
  Calendar,
  Building,
} from 'lucide-react'
import type { Contact } from '@/types/database'
import { useContactHistory } from '@/hooks/useContactHistory'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ContactDetailsModalProps {
  contact: Contact | null
  open: boolean
  onClose: () => void
  onEdit: (contact: Contact) => void
}

export function ContactDetailsModal({
  contact,
  open,
  onClose,
  onEdit,
}: ContactDetailsModalProps) {
  const navigate = useNavigate()
  const { chatwootUrl } = useChatwootUrl()
  const [activeTab, setActiveTab] = useState('info')
  const { activeDeals, archivedDeals, client, contracts, isLoading, hasClient, hasContracts } =
    useContactHistory(contact?.id)

  if (!contact) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700'
      case 'low':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'completed':
        return 'success'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {contact.profile_url ? (
              <img
                src={contact.profile_url}
                alt={contact.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {contact.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl">{contact.name}</DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {contact.email && (
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </div>
                )}
              </div>
              <Badge variant="secondary" className="mt-2">
                Chatwoot ID: {contact.chatwoot_id}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="deals">
              Deals ({activeDeals.length + archivedDeals.length})
            </TabsTrigger>
            <TabsTrigger value="client">Cliente ERP</TabsTrigger>
            <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
          </TabsList>

          {/* Aba Informações */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Nome</p>
                    <p className="font-medium">{contact.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Chatwoot ID</p>
                    <p className="font-medium">{contact.chatwoot_id}</p>
                  </div>
                  {contact.email && (
                    <div>
                      <p className="text-sm text-slate-500">Email</p>
                      <p className="font-medium">{contact.email}</p>
                    </div>
                  )}
                  {contact.phone && (
                    <div>
                      <p className="text-sm text-slate-500">Telefone</p>
                      <p className="font-medium">{contact.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Cadastrado em</p>
                    <p className="font-medium">
                      {format(parseISO(contact.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => {
                      onClose()
                      onEdit(contact)
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Contato
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      window.open(
                        `${chatwootUrl}/app/accounts/1/contacts/${contact.chatwoot_id}`,
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no Chatwoot
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba Deals */}
          <TabsContent value="deals" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-slate-500">Carregando deals...</p>
              </div>
            ) : (
              <>
                {/* Deals Ativos */}
                {activeDeals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Deals Ativos ({activeDeals.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {activeDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{deal.title}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{deal.crm_stages?.name || 'N/A'}</Badge>
                                <Badge className={getPriorityColor(deal.priority)}>
                                  {deal.priority === 'high'
                                    ? 'Alta'
                                    : deal.priority === 'medium'
                                    ? 'Média'
                                    : 'Baixa'}
                                </Badge>
                                {deal.needs_contract && (
                                  <Badge variant="warning" className="bg-amber-100 text-amber-700">
                                    Pendente Contrato
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(deal.deal_value_negotiated)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(parseISO(deal.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Deals Arquivados */}
                {archivedDeals.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Archive className="h-5 w-5 text-purple-600" />
                        Deals Arquivados ({archivedDeals.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {archivedDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="p-3 border border-slate-200 rounded-lg bg-slate-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{deal.title}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline">{deal.crm_stages?.name || 'N/A'}</Badge>
                                <Badge variant="secondary">Arquivado</Badge>
                              </div>
                              {deal.archived_reason && (
                                <p className="text-sm text-slate-600 mt-2">
                                  📦 {deal.archived_reason}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-600">
                                {formatCurrency(deal.deal_value_negotiated)}
                              </p>
                              {deal.archived_at && (
                                <p className="text-xs text-slate-500">
                                  Arquivado em{' '}
                                  {format(parseISO(deal.archived_at), 'dd/MM/yyyy', {
                                    locale: ptBR,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {activeDeals.length === 0 && archivedDeals.length === 0 && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">Nenhum deal encontrado para este contato</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Aba Cliente ERP */}
          <TabsContent value="client" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-slate-500">Carregando cliente...</p>
              </div>
            ) : hasClient && client ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Cliente ERP
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Nome Completo</p>
                      <p className="font-medium">{client.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">CPF</p>
                      <p className="font-medium">{client.cpf}</p>
                    </div>
                    {client.address && (
                      <div className="col-span-2">
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Endereço
                        </p>
                        <p className="font-medium">
                          {client.address}
                          {client.city && client.state && ` - ${client.city}, ${client.state}`}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-slate-500">Fonte</p>
                      <Badge variant={client.source === 'crm' ? 'default' : 'secondary'}>
                        {client.source === 'crm' ? 'CRM' : 'Balcão'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Status</p>
                      <Badge variant={client.is_active ? 'success' : 'destructive'}>
                        {client.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigate(`/erp/clients/${client.id}`)
                        onClose()
                      }}
                    >
                      <UserCircle className="h-4 w-4 mr-2" />
                      Ver Detalhes Completos do Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">
                    Nenhum cliente ERP vinculado
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Este contato ainda não foi convertido em cliente no sistema ERP
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aba Contratos */}
          <TabsContent value="contracts" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
                <p className="mt-2 text-sm text-slate-500">Carregando contratos...</p>
              </div>
            ) : hasContracts ? (
              <div className="space-y-3">
                {contracts.map((contract) => (
                  <Card key={contract.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <h4 className="font-bold text-lg">{contract.contract_number}</h4>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                {contract.companies?.name || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                {contract.contract_types?.name || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                Início:{' '}
                                {format(parseISO(contract.start_date), 'dd/MM/yyyy', {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <Badge variant={getStatusColor(contract.status)}>
                              {contract.status === 'active'
                                ? 'Ativo'
                                : contract.status === 'completed'
                                ? 'Concluído'
                                : contract.status === 'cancelled'
                                ? 'Cancelado'
                                : 'Rascunho'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatCurrency(contract.final_value)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {contract.installments}x de{' '}
                            {formatCurrency(contract.final_value / contract.installments)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              navigate('/erp/contracts')
                              onClose()
                            }}
                          >
                            Ver Contrato
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {hasClient
                      ? 'Nenhum contrato encontrado para este cliente'
                      : 'Este contato ainda não possui contratos'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
