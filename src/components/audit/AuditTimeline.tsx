import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

interface AuditTimelineProps<T extends { id: number; created_at: string; user_email?: string | null }> {
  items: T[]
  renderContent: (item: T) => React.ReactNode
  renderBadge?: (item: T) => React.ReactNode
  emptyMessage?: string
}

export function AuditTimeline<T extends { id: number; created_at: string; user_email?: string | null }>({
  items,
  renderContent,
  renderBadge,
  emptyMessage = 'Nenhuma atividade encontrada',
}: AuditTimelineProps<T>) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex gap-4 pb-6 border-l-2 border-slate-200 pl-6 relative last:pb-0"
        >
          {/* Timeline dot */}
          <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-white border-2 border-slate-300" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {renderBadge && renderBadge(item)}
                {item.user_email && (
                  <Badge variant="outline" className="text-xs">
                    {item.user_email}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
            </div>

            {/* Content */}
            {renderContent(item)}
          </div>
        </div>
      ))}
    </div>
  )
}
