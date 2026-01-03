import { User, FileText, Award, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Client, Contract } from '@/types/database'

interface ClientHeaderProps {
  client: Client
  contract: Contract & {
    total_lessons: number
    completed_lessons: number
  }
}

const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatPhone = (phone: string) => {
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
}

export function ClientHeader({ client, contract }: ClientHeaderProps) {
  const remainingLessons = contract.total_lessons - contract.completed_lessons
  const progressPercentage = (contract.completed_lessons / contract.total_lessons) * 100

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Client Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{client.full_name}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>CPF: {formatCPF(client.cpf)}</span>
                  <span>•</span>
                  <span>{formatPhone(client.phone)}</span>
                  {client.email && (
                    <>
                      <span>•</span>
                      <span>{client.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Contract Number */}
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Contrato</p>
                <p className="font-semibold">#{contract.contract_number}</p>
              </div>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Categoria</p>
                <Badge variant="secondary">{contract.category}</Badge>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-sm font-semibold">
                  {contract.completed_lessons} de {contract.total_lessons} aulas
                  <span className="text-xs text-muted-foreground ml-1">
                    ({remainingLessons} restantes)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-right text-muted-foreground">
              {progressPercentage.toFixed(0)}% concluído
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
