import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'

export function History() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe as atividades recentes do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Log de movimentações e alterações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed">
            <div className="text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Funcionalidade em desenvolvimento
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                O histórico de atividades será exibido aqui
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
