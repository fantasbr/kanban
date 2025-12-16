import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DealCard } from './DealCard'
import type { Stage, Deal } from '@/types/database'

interface StageColumnProps {
  stage: Stage
  deals: Deal[]
  onEditDeal: (deal: Deal) => void
  onDeleteDeal: (deal: Deal) => void
}

export function StageColumn({ stage, deals, onEditDeal, onDeleteDeal }: StageColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  })

  const stageDeals = deals.filter((deal) => deal.stage_id === stage.id)

  return (
    <div className="shrink-0 w-[360px]">
      <Card className="h-full min-h-[600px] flex flex-col bg-slate-50 border-slate-200">
        <CardHeader className="pb-3 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">{stage.name}</CardTitle>
            <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-semibold">
              {stageDeals.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-3" ref={setNodeRef}>
          <SortableContext
            items={stageDeals.map((d) => d.id)}
            strategy={verticalListSortingStrategy}
          >
            {stageDeals.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white">
                <p className="text-sm text-slate-400">Nenhum card</p>
              </div>
            ) : (
              stageDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} onEdit={onEditDeal} onDelete={onDeleteDeal} />
              ))
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}
