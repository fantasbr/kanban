import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ReportFilters {
  startDate: Date
  endDate: Date
  instructorId?: string | null
  vehicleId?: string | null
}

export interface InstructorReportItem {
  id: number
  name: string
  lessons_completed: number
  lessons_no_show: number
  lessons_scheduled: number
  total_lessons: number
  hours_worked: number
  revenue: number
}

export interface VehicleReportItem {
  id: number
  plate: string
  model: string
  category: string
  lessons_count: number
  hours_used: number
}

export interface FinancialReportData {
  total_revenue: number
  chart_data: { date: string; amount: number }[]
  transaction_count: number
}

export interface ClientReportItem {
  id: number
  name: string
  total: number
  completed: number
  no_show: number
  cancelled: number
  attendance_rate: number
}

export function useLessonReports(filters: ReportFilters) {
  const { startDate, endDate, instructorId, vehicleId } = filters
  
  // Format dates for Supabase queries
  const startIso = startDate.toISOString().split('T')[0]
  const endIso = endDate.toISOString().split('T')[0]

  // 1. Relatório de Produtividade (Instrutores)
  const instructorReportQuery = useQuery({
    queryKey: ['report-instructor', startIso, endIso, instructorId],
    queryFn: async () => {
      let query = supabase
        .from('erp_instructors')
        .select('id, full_name, hourly_rate')
        .eq('is_active', true)

      if (instructorId) {
        query = query.eq('id', instructorId)
      }

      const { data: instructors, error } = await query
      if (error) throw error

      interface InstructorRow {
        id: number
        full_name: string
        hourly_rate: number
      }

      const reportData = await Promise.all(
        ((instructors || []) as unknown as InstructorRow[]).map(async (instructor) => {
          const { data: lessons } = await supabase
            .from('erp_lessons')
            .select('status, duration_minutes, lesson_date')
            .eq('instructor_id', instructor.id)
            .gte('lesson_date', startIso)
            .lte('lesson_date', endIso)

          interface LessonRow {
            status: string
            duration_minutes: number
            lesson_date: string
          }

          const lessonsList = (lessons || []) as LessonRow[]

          const completed = lessonsList.filter(l => l.status === 'completed').length
          const noShow = lessonsList.filter(l => l.status === 'no_show').length
          const scheduled = lessonsList.filter(l => l.status === 'scheduled').length
          const total = completed + noShow + scheduled

          const hoursWorked = lessonsList
            .filter(l => l.status === 'completed')
            .reduce((sum, l) => sum + l.duration_minutes, 0) / 60

          const estimatedRevenue = hoursWorked * instructor.hourly_rate

          return {
            id: instructor.id,
            name: instructor.full_name,
            lessons_completed: completed,
            lessons_no_show: noShow,
            lessons_scheduled: scheduled,
            total_lessons: total,
            hours_worked: Math.round(hoursWorked * 10) / 10,
            revenue: estimatedRevenue
          }
        })
      )

      return reportData.sort((a, b) => b.lessons_completed - a.lessons_completed) as InstructorReportItem[]
    }
  })

  // 2. Relatório de Veículos
  const vehicleReportQuery = useQuery({
    queryKey: ['report-vehicle', startIso, endIso, vehicleId],
    queryFn: async () => {
      let query = supabase
        .from('erp_vehicles')
        .select('id, plate, model, category')
        .eq('is_active', true)

      if (vehicleId) {
        query = query.eq('id', vehicleId)
      }

      const { data: vehicles, error } = await query
      if (error) throw error

      interface VehicleRow {
        id: number
        plate: string
        model: string
        category: string
      }

      const reportData = await Promise.all(
        ((vehicles || []) as unknown as VehicleRow[]).map(async (vehicle) => {
          const { data: lessons } = await supabase
            .from('erp_lessons')
            .select('status, duration_minutes')
            .eq('vehicle_id', vehicle.id)
            .gte('lesson_date', startIso)
            .lte('lesson_date', endIso)
            .eq('status', 'completed')

          interface LessonRow {
            status: string
            duration_minutes: number
          }

          const lessonsList = (lessons || []) as LessonRow[]
          const lessonsCount = lessonsList.length
          const hoursUsed = lessonsList.reduce((sum, l) => sum + l.duration_minutes, 0) / 60

          return {
            id: vehicle.id,
            plate: vehicle.plate,
            model: vehicle.model,
            category: vehicle.category,
            lessons_count: lessonsCount,
            hours_used: Math.round(hoursUsed * 10) / 10
          }
        })
      )

      return reportData.sort((a, b) => b.lessons_count - a.lessons_count) as VehicleReportItem[]
    }
  })

  // 3. Relatório Financeiro
  const financialReportQuery = useQuery({
    queryKey: ['report-financial', startIso, endIso],
    queryFn: async () => {
      const { data: receivables, error } = await supabase
        .from('erp_receivables')
        .select(`
          amount,
          paid_amount,
          paid_date,
          status,
          payment_method_id,
          description
        `)
        .gte('paid_date', startIso)
        .lte('paid_date', endIso)
        .eq('status', 'paid')

      if (error) throw error

      interface ReceivableRow {
        amount: number
        paid_amount: number | null
        paid_date: string | null
        status: string
        payment_method_id: number | null
        description: string | null
      }

      const receivablesList = (receivables || []) as ReceivableRow[]

      const totalRevenue = receivablesList.reduce((sum, r) => sum + (r.paid_amount || 0), 0)
      
      const revenueByDate = receivablesList.reduce((acc: Record<string, number>, r) => {
        const date = r.paid_date
        if (date) {
            acc[date] = (acc[date] || 0) + (r.paid_amount || 0)
        }
        return acc
      }, {})

      const chartData = Object.entries(revenueByDate).map(([date, amount]) => ({
        date,
        amount
      })).sort((a, b) => a.date.localeCompare(b.date))

      return {
        total_revenue: totalRevenue,
        chart_data: chartData,
        transaction_count: receivablesList.length
      } as FinancialReportData
    }
  })

  // 4. Relatório de Clientes
  const clientReportQuery = useQuery({
    queryKey: ['report-client', startIso, endIso],
    queryFn: async () => {
      const { data: lessons, error } = await supabase
        .from('erp_lessons')
        .select(`
          status,
          contract_items:erp_contract_items(
            contracts:erp_contracts(
              client_id,
              clients:erp_clients(id, full_name)
            )
          )
        `)
        .gte('lesson_date', startIso)
        .lte('lesson_date', endIso)

      if (error) throw error

      interface ClientStat {
        id: number
        name: string
        total: number
        completed: number
        no_show: number
        cancelled: number
      }

      const clientStats: Record<string, ClientStat> = {}

      interface LessonWithClient {
        status: string
        contract_items: {
          contracts: {
            client_id: number
            clients: {
              id: number
              full_name: string
            } | null
          } | null
        } | null
      }

      const lessonsList = (lessons || []) as unknown as LessonWithClient[]

      lessonsList.forEach((lesson) => {
        const client = lesson.contract_items?.contracts?.clients
        if (!client) return

        if (!clientStats[client.id]) {
          clientStats[client.id] = {
            id: client.id,
            name: client.full_name,
            total: 0,
            completed: 0,
            no_show: 0,
            cancelled: 0
          }
        }

        clientStats[client.id].total++
        if (lesson.status === 'completed') clientStats[client.id].completed++
        if (lesson.status === 'no_show') clientStats[client.id].no_show++
        if (lesson.status === 'cancelled') clientStats[client.id].cancelled++
      })

      return Object.values(clientStats).map((stat) => ({
        ...stat,
        attendance_rate: stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0
      })).sort((a, b) => b.completed - a.completed).slice(0, 50) as ClientReportItem[]
    }
  })

  return {
    instructorReport: instructorReportQuery.data ?? [],
    vehicleReport: vehicleReportQuery.data ?? [],
    financialReport: financialReportQuery.data ?? { total_revenue: 0, chart_data: [], transaction_count: 0 },
    clientReport: clientReportQuery.data ?? [],
    
    isLoading: 
      instructorReportQuery.isLoading || 
      vehicleReportQuery.isLoading || 
      financialReportQuery.isLoading || 
      clientReportQuery.isLoading
  }
}

