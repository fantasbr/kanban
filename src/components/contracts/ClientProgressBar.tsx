import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Client, Contract } from '@/types/database'

interface CategoryMetrics {
  category: string
  displayName: string
  totalLessons: number
  completedLessons: number
  scheduledLessons: number
  availableLessons: number
  percentage: number
}

interface ClientProgressBarProps {
  client: Client
  contract: Contract
  metrics: CategoryMetrics[]
  compact?: boolean
}

export function ClientProgressBar({ 
  client, 
  contract, 
  metrics,
  compact = false 
}: ClientProgressBarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          {/* Client Info Header - Compact */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(client.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{client.full_name}</p>
              <p className="text-xs text-muted-foreground">{contract.contract_number}</p>
            </div>
          </div>

          {/* Categories - Super Compact */}
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.category} className="space-y-1">
                {/* Inline metrics */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <span>{metric.displayName}:</span>
                    <span className="text-green-600">{metric.availableLessons} disponíveis</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-blue-600">{metric.scheduledLessons} agendadas</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-gray-600">{metric.completedLessons} concluídas</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {metric.completedLessons}/{metric.totalLessons} ({Math.round(metric.percentage)}%)
                  </span>
                </div>
                {/* Thin progress bar */}
                <Progress value={metric.percentage} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full version (for contract details)
  return (
    <div className="space-y-4">
      {metrics.map((metric) => (
        <Card key={metric.category}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Category Header */}
              <div>
                <h4 className="font-semibold text-lg">{metric.displayName}</h4>
                <p className="text-sm text-muted-foreground">
                  Total: {metric.totalLessons} aulas
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {metric.completedLessons}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ✅ Concluídas
                  </div>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {metric.scheduledLessons}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    📅 Agendadas
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {metric.availableLessons}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    🎯 Disponíveis
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={metric.percentage} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {Math.round(metric.percentage)}% concluído
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
