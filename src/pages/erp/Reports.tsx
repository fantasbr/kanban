
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useLessonReports } from '@/hooks/useLessonReports'
import { ReportFilters } from '@/components/reports/ReportFilters'
import { ReportTypeSelector, ReportType } from '@/components/reports/ReportTypeSelector'
import { ReportChart } from '@/components/reports/ReportChart'
import { ExportButtons } from '@/components/reports/ExportButtons'
import { Loader2 } from 'lucide-react'

export function Reports() {
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date
  })
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [instructorId, setInstructorId] = useState<string | null>(null)
  const [vehicleId, setVehicleId] = useState<string | null>(null)
  const [reportType, setReportType] = useState<ReportType>('productivity')

  const {
    instructorReport,
    vehicleReport,
    financialReport,
    clientReport,
    isLoading
  } = useLessonReports({
    startDate,
    endDate,
    instructorId,
    vehicleId
  })

  // Helper to get columns for export
  const getColumns = () => {
    switch (reportType) {
      case 'productivity':
        return [
          { header: 'Instrutor', key: 'name' },
          { header: 'Aulas Concluídas', key: 'lessons_completed' },
          { header: 'Total Aulas', key: 'total_lessons' },
          { header: 'Horas Trabalhadas', key: 'hours_worked' },
          { header: 'Receita Est.', key: 'revenue' }
        ]
      case 'vehicle':
        return [
          { header: 'Veículo', key: 'model' },
          { header: 'Placa', key: 'plate' },
          { header: 'Qtd. Aulas', key: 'lessons_count' },
          { header: 'Horas Uso', key: 'hours_used' }
        ]
      case 'financial':
        return [
          { header: 'Data', key: 'date' },
          { header: 'Valor (R$)', key: 'amount' }
        ]
      case 'client':
        return [
          { header: 'Cliente', key: 'name' },
          { header: 'Taxa Presença (%)', key: 'attendance_rate' },
          { header: 'Aulas Realizadas', key: 'completed' }
        ]
      default:
        return []
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )
    }

    switch (reportType) {
      case 'productivity':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <ReportChart
              title="Aulas por Instrutor"
              description="Quantidade de aulas concluídas no período"
              data={instructorReport}
              type="bar"
              dataKey="lessons_completed"
              nameKey="name"
              height={400}
            />
            <Card>
              <CardHeader>
                <CardTitle>Detalhes de Produtividade</CardTitle>
                <CardDescription>Resumo de desempenho dos instrutores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instructorReport.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.total_lessons} aulas agendadas</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.lessons_completed} concluídas</p>
                        <p className="text-sm text-green-600">R$ {item.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {instructorReport.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum dado encontrado</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'vehicle':
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <ReportChart
              title="Utilização da Frota"
              description="Horas de uso por veículo"
              data={vehicleReport}
              type="bar"
              dataKey="hours_used"
              nameKey="model"
              color="#82ca9d"
            />
            <Card>
              <CardHeader>
                <CardTitle>Frota</CardTitle>
                <CardDescription>Detalhamento por veículo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleReport.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{item.model}</p>
                        <p className="text-xs text-muted-foreground">{item.plate}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.hours_used} horas</p>
                        <p className="text-sm text-muted-foreground">{item.lessons_count} aulas</p>
                      </div>
                    </div>
                  ))}
                  {vehicleReport.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum dado encontrado</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'financial':
        return (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Receita Total: R$ {financialReport.total_revenue.toFixed(2)}</CardTitle>
                <CardDescription>Baseado em pagamentos recebidos no período</CardDescription>
              </CardHeader>
              <CardContent>
                 <ReportChart
                  title="Evolução da Receita"
                  data={financialReport.chart_data}
                  type="bar" // Line chart would be better but ReportChart handles bar/pie. Using bar for now.
                  dataKey="amount"
                  nameKey="date"
                  color="#10b981"
                  height={300}
                />
              </CardContent>
            </Card>
          </div>
        )

      case 'client':
        return (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Clientes (Assiduidade)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clientReport.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>{item.completed} Concluídas</span>
                          <span className="text-red-500">{item.no_show} Faltas</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{item.attendance_rate}%</div>
                        <p className="text-xs text-muted-foreground">Presença</p>
                      </div>
                    </div>
                  ))}
                  {clientReport.length === 0 && <p className="text-muted-foreground text-center py-4">Nenhum dado encontrado</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return null
    }
  }

  const getCurrentData = () => {
    switch (reportType) {
      case 'productivity': return instructorReport
      case 'vehicle': return vehicleReport
      case 'financial': return financialReport.chart_data
      case 'client': return clientReport
      default: return []
    }
  }

  return (
    <div className="space-y-6 p-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">
            Análise detalhada de produtividade, frota e financeiro.
          </p>
        </div>
        <ExportButtons 
          data={getCurrentData()} 
          type={reportType} 
          columns={getColumns()} 
          fileName={`relatorio_${reportType}`}
        />
      </div>

      <ReportFilters
        startDate={startDate}
        endDate={endDate}
        instructorId={instructorId}
        vehicleId={vehicleId}
        onStartDateChange={(d) => d && setStartDate(d)}
        onEndDateChange={(d) => d && setEndDate(d)}
        onInstructorChange={setInstructorId}
        onVehicleChange={setVehicleId}
        showAdvancedFilters={reportType === 'productivity' || reportType === 'vehicle'}
      />

      <ReportTypeSelector
        currentType={reportType}
        onTypeChange={setReportType}
      />

      {renderContent()}
    </div>
  )
}
