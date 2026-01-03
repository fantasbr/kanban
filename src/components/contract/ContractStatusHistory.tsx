import { Clock, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_STATUS_LABELS } from '@/types/contract'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface StatusHistoryEntry {
  id: number
  old_status: string | null
  new_status: string
  reason: string
  changed_by: string
  changed_at: string
}

interface ContractStatusHistoryProps {
  history: StatusHistoryEntry[]
  isLoading?: boolean
}

export function ContractStatusHistory({ history, isLoading }: ContractStatusHistoryProps) {
  if (isLoading) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-4">Histórico de Status</h3>
        <div className="text-center py-8 text-slate-500">Carregando histórico...</div>
      </Card>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-4">Histórico de Status</h3>
        <div className="text-center py-8 text-slate-500">
          Nenhuma mudança de status registrada
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      <h3 className="font-semibold text-lg mb-4">Histórico de Status</h3>
      <div className="space-y-4">
        {history.map((entry, index) => (
          <div
            key={entry.id}
            className={`border-l-2 border-purple-200 pl-4 pb-4 relative ${
              index === history.length - 1 ? '' : 'pb-4'
            }`}
          >
            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500 border-2 border-white" />
            
            <div className="space-y-2">
              {/* Status Change */}
              <div className="flex items-center gap-2 flex-wrap">
                {entry.old_status && (
                  <>
                    <Badge variant="outline" className="text-xs">
                      {CONTRACT_STATUS_LABELS[entry.old_status as keyof typeof CONTRACT_STATUS_LABELS] || entry.old_status}
                    </Badge>
                    <span className="text-slate-400">→</span>
                  </>
                )}
                <Badge className="text-xs bg-purple-100 text-purple-700">
                  {CONTRACT_STATUS_LABELS[entry.new_status as keyof typeof CONTRACT_STATUS_LABELS] || entry.new_status}
                </Badge>
              </div>

              {/* Reason */}
              <p className="text-sm text-slate-700 italic">
                "{entry.reason}"
              </p>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{entry.changed_by}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {format(parseISO(entry.changed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
