import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'
import { useDashboard } from '@/hooks/useDashboard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const { metrics, isLoading } = useDashboard({ month: selectedMonth })

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  // Month navigation
  const previousMonth = () => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setSelectedMonth(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(selectedMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setSelectedMonth(newDate)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-2 text-sm text-slate-500">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral do desempenho comercial
          </p>
        </div>
        
        {/* Month Filter */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <Button variant="ghost" size="icon" onClick={previousMonth}>
            <span className="sr-only">Anterior</span>
            <span className="text-lg">←</span>
          </Button>
          <div className="w-40 text-center font-medium">
            {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth} disabled={selectedMonth > new Date()}>
            <span className="sr-only">Próximo</span>
            <span className="text-lg">→</span>
          </Button>
        </div>
      </div>

      {/* Global Stats (Not filtered by month) */}
      <h2 className="text-lg font-semibold text-slate-700">Visão Geral (Total)</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalActiveLeads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads em andamento no pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor em Leads Ativos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.totalActiveValue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Potencial de fechamento atual
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Stats */}
      <h2 className="text-lg font-semibold text-slate-700 mt-6">Desempenho Mensal</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.newLeadsMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Criados neste mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Convertidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.convertedLeadsMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ganhos neste mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics?.conversionRateMonth || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Sobre novos leads do mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.averageTicketMonth || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Média das vendas do mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts (Placeholder for future) */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Vendas</CardTitle>
            <CardDescription>Comparativo mensal (Em Breve)</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-slate-400 text-sm">
                Gráfico de evolução
             </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Funil de Vendas</CardTitle>
            <CardDescription>Conversão por etapa (Em Breve)</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed text-slate-400 text-sm">
                Gráfico de funil
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
