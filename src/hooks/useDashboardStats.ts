import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDashboardStats() {
  // 1. Quantidade de Aulas Agendadas
  const scheduledLessons = useQuery({
    queryKey: ['dashboard-scheduled-lessons'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('erp_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')

      if (error) throw error
      return count || 0
    },
  })

  // 2. Taxa de Presença (últimos 30 dias)
  const attendanceRate = useQuery({
    queryKey: ['dashboard-attendance-rate'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('erp_lessons')
        .select('status')
        .gte('lesson_date', thirtyDaysAgo.toISOString().split('T')[0])
        .in('status', ['completed', 'no_show', 'cancelled'])

      if (error) throw error

      const total = data?.length || 0
      const completed = data?.filter((l) => l.status === 'completed').length || 0
      const rate = total > 0 ? (completed / total) * 100 : 0

      return {
        rate: Math.round(rate * 10) / 10,
        completed,
        total,
      }
    },
  })

  // 3. Aulas por Instrutor
  const lessonsByInstructor = useQuery({
    queryKey: ['dashboard-lessons-by-instructor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_lessons')
        .select('instructor_id, instructors(full_name)')
        .eq('status', 'completed')

      if (error) throw error

      // Group by instructor
      const grouped = (data || []).reduce((acc: any, lesson: any) => {
        const instructorName = lesson.instructors?.full_name || 'Sem instrutor'
        if (!acc[instructorName]) {
          acc[instructorName] = 0
        }
        acc[instructorName]++
        return acc
      }, {})

      // Convert to array for recharts
      return Object.entries(grouped)
        .map(([name, count]) => ({
          name,
          aulas: count,
        }))
        .sort((a: any, b: any) => b.aulas - a.aulas)
        .slice(0, 10) // Top 10
    },
  })

  // 4. Aulas por Veículo
  const lessonsByVehicle = useQuery({
    queryKey: ['dashboard-lessons-by-vehicle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_lessons')
        .select('vehicle_id, vehicles(model, plate)')
        .eq('status', 'completed')

      if (error) throw error

      // Group by vehicle
      const grouped = (data || []).reduce((acc: any, lesson: any) => {
        const vehicleName = lesson.vehicles
          ? `${lesson.vehicles.model} (${lesson.vehicles.plate})`
          : 'Sem veículo'
        if (!acc[vehicleName]) {
          acc[vehicleName] = 0
        }
        acc[vehicleName]++
        return acc
      }, {})

      // Convert to array for recharts
      return Object.entries(grouped)
        .map(([name, count]) => ({
          name,
          aulas: count,
        }))
        .sort((a: any, b: any) => b.aulas - a.aulas)
        .slice(0, 10) // Top 10
    },
  })

  // 5. Contratos Ativos
  const activeContracts = useQuery({
    queryKey: ['dashboard-active-contracts'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('erp_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (error) throw error
      return count || 0
    },
  })

  // 6. Contratos Abertos no Mês Atual
  const contractsOpenedThisMonth = useQuery({
    queryKey: ['dashboard-contracts-opened-month'],
    queryFn: async () => {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { count, error } = await supabase
        .from('erp_contracts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', firstDayOfMonth.toISOString())
        .lte('created_at', lastDayOfMonth.toISOString())

      if (error) throw error
      return count || 0
    },
  })

  // 7. Contratos Concluídos no Mês Atual
  const contractsCompletedThisMonth = useQuery({
    queryKey: ['dashboard-contracts-completed-month'],
    queryFn: async () => {
      const now = new Date()
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { count, error } = await supabase
        .from('erp_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', firstDayOfMonth.toISOString())
        .lte('updated_at', lastDayOfMonth.toISOString())

      if (error) throw error
      return count || 0
    },
  })

  return {
    scheduledLessons,
    attendanceRate,
    lessonsByInstructor,
    lessonsByVehicle,
    activeContracts,
    contractsOpenedThisMonth,
    contractsCompletedThisMonth,
  }
}
