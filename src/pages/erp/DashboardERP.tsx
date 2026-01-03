import { BarChart, Calendar, TrendingUp, Users, FileText, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function DashboardERP() {
  const { 
    scheduledLessons, 
    attendanceRate, 
    lessonsByInstructor, 
    lessonsByVehicle,
    activeContracts,
    contractsOpenedThisMonth,
    contractsCompletedThisMonth
  } = useDashboardStats()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de contratos e aulas
        </p>
      </div>

      {/* Contract KPI Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Contratos</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Contratos Ativos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {activeContracts.isLoading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{activeContracts.data}</div>
                  <p className="text-xs text-muted-foreground">contratos em andamento</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contratos Abertos no Mês */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertos este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {contractsOpenedThisMonth.isLoading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{contractsOpenedThisMonth.data}</div>
                  <p className="text-xs text-muted-foreground">novos contratos</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contratos Concluídos no Mês */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos este Mês</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {contractsCompletedThisMonth.isLoading ? (
                <div className="text-2xl font-bold">Carregando...</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{contractsCompletedThisMonth.data}</div>
                  <p className="text-xs text-muted-foreground">contratos finalizados</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lesson KPI Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Aulas</h2>
        <div className="grid gap-4 md:grid-cols-2">
        {/* 1. Quantidade de Aulas Agendadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {scheduledLessons.isLoading ? (
              <div className="text-2xl font-bold">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{scheduledLessons.data}</div>
                <p className="text-xs text-muted-foreground">aulas pendentes</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2. Taxa de Presença */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {attendanceRate.isLoading ? (
              <div className="text-2xl font-bold">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{attendanceRate.data?.rate}%</div>
                <p className="text-xs text-muted-foreground">
                  {attendanceRate.data?.completed} de {attendanceRate.data?.total} aulas (últimos 30 dias)
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 3. Gráfico de Aulas por Instrutor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Aulas por Instrutor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessonsByInstructor.isLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando gráfico...
              </div>
            ) : lessonsByInstructor.data && lessonsByInstructor.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBar data={lessonsByInstructor.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="aulas" fill="#8884d8" />
                </RechartsBar>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* 4. Gráfico de Aulas por Veículo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Aulas por Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessonsByVehicle.isLoading ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Carregando gráfico...
              </div>
            ) : lessonsByVehicle.data && lessonsByVehicle.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBar data={lessonsByVehicle.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="aulas" fill="#82ca9d" />
                </RechartsBar>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
