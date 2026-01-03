import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Trash2, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Deal, Priority } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { useChatwootUrl } from '@/hooks/useChatwootUrl'
import { useContracts } from '@/hooks/useContracts'

interface DealCardProps {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
}

const priorityConfig: Record<Priority, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
  low: { variant: 'success', label: 'Baixa' },
  medium: { variant: 'warning', label: 'Média' },
  high: { variant: 'danger', label: 'Alta' },
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
  const navigate = useNavigate()
  const { chatwootUrl } = useChatwootUrl()
  const { contracts } = useContracts()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priority = priorityConfig[deal.priority]

  const handleContractClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (deal.existing_client_id) {
      navigate(`/erp/contracts?clientId=${deal.existing_client_id}`)
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className="mb-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 border-slate-200 bg-white"
        onClick={() => onEdit(deal)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Contact Info */}
            <div className="flex items-center gap-2">
              {deal.contacts?.profile_url ? (
                <img 
                  src={deal.contacts.profile_url} 
                  alt={deal.contacts.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-slate-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  {deal.contacts?.name?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 font-medium truncate">
                  {deal.contacts?.name || 'Sem contato'}
                </p>
              </div>
              {deal.chatwoot_conversation_id && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 hover:bg-blue-50 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(
                      `${chatwootUrl}/app/accounts/1/conversations/${deal.chatwoot_conversation_id}`,
                      '_blank'
                    )
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 hover:bg-red-50 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(deal)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Deal Title */}
            <h3 className="font-semibold text-sm line-clamp-2 text-slate-900">
              {deal.title}
            </h3>
            
            {/* Value and Priority */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(deal.deal_value_negotiated)}
              </span>
              <div className="flex items-center gap-1">
                <Badge variant={priority.variant} className="font-medium">
                  {priority.label}
                </Badge>
                {deal.existing_client_id && contracts.some(c => c.client_id === deal.existing_client_id && c.status === 'active') && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <FileText className="h-3 w-3 mr-1" />
                    ERP
                  </Badge>
                )}
                {deal.needs_contract && deal.existing_client_id && (
                  <Badge 
                    variant="warning" 
                    className="bg-amber-50 text-amber-700 border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={handleContractClick}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Contrato Pendente
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
