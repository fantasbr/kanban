import { BarChart, Calendar, TrendingUp, Users, FileText, CheckCircle, ShoppingCart, Plus, Building } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function DashboardERP() {
  // Generate last 12 months options
  const monthOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'Todos os tempos' }]
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      const value = `${year}-${String(month + 1).padStart(2, '0')}`
      
      options.push({
        value,
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1)
      })
    }
    
    return options
  }, [])

  // Current month as default
  const currentMonth = useMemo(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const [selectedPeriod, setSelectedPeriod] = useState(currentMonth)
  const [selectedCompany, setSelectedCompany] = useState<string>('all')

  // Fetch companies
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data as { id: number; name: string }[]
    },
  })

  // Calculate date range based on selected period
  const dateFilters = useMemo(() => {
    const filters: { startDate?: string; endDate?: string; companyId?: number } = {}
    
    if (selectedPeriod !== 'all') {
      const [year, month] = selectedPeriod.split('-').map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      filters.startDate = startDate.toISOString().split('T')[0]
      filters.endDate = endDate.toISOString().split('T')[0]
    }

    if (selectedCompany !== 'all') {
      filters.companyId = Number(selectedCompany)
    }

    return filters
  }, [selectedPeriod, selectedCompany])

  const {
    scheduledLessons, 
    attendanceRate, 
    lessonsByInstructor, 
    lessonsByVehicle,
    activeContracts,
    contractsOpenedThisMonth,
    contractsCompletedThisMonth,
    purchasedLessons,
    extraLessonsPurchased,
  } = useDashboardStats(dateFilters)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart className="h-8 w-8" />
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral de contratos e aulas
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-4">
          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={String(company.id)}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
        <div className="grid gap-4 md:grid-cols-4">
        {/* 1. Aulas Compradas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Compradas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {purchasedLessons.isLoading ? (
              <div className="text-2xl font-bold">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{purchasedLessons.data}</div>
                <p className="text-xs text-muted-foreground">aulas de contratos</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 2. Aulas Extras Compradas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aulas Extras</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {extraLessonsPurchased.isLoading ? (
              <div className="text-2xl font-bold">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{extraLessonsPurchased.data}</div>
                <p className="text-xs text-muted-foreground">aulas extras adquiridas</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 3. Quantidade de Aulas Agendadas */}
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

        {/* 4. Taxa de Presença */}
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
