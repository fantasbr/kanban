import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface DashboardFilters {
  startDate?: string
  endDate?: string
  companyId?: number
}

export function useDashboardStats(filters: DashboardFilters = {}) {
  const { startDate, endDate, companyId } = filters
  // 1. Quantidade de Aulas Agendadas
  const scheduledLessons = useQuery({
    queryKey: ['dashboard-scheduled-lessons', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate) query = query.gte('lesson_date', startDate)
      if (endDate) query = query.lte('lesson_date', endDate)

      const { count, error } = await query

      if (error) throw error
      return count || 0
    },
  })

  // 2. Taxa de Presença
  const attendanceRate = useQuery({
    queryKey: ['dashboard-attendance-rate', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_lessons')
        .select('status')
        .in('status', ['completed', 'no_show', 'cancelled'])

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate) {
        query = query.gte('lesson_date', startDate)
      } else {
        // Se não tem filtro, usar últimos 30 dias como padrão
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        query = query.gte('lesson_date', thirtyDaysAgo.toISOString().split('T')[0])
      }
      
      if (endDate) query = query.lte('lesson_date', endDate)

      const { data, error } = await query

      if (error) throw error

      const typedData = data as { status: string }[]
      const total = typedData?.length || 0
      const completed = typedData?.filter(l => l.status === 'completed').length || 0
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
    queryKey: ['dashboard-lessons-by-instructor', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_lessons')
        .select('instructor_id, erp_instructors(full_name)')
        .eq('status', 'completed')

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate) query = query.gte('lesson_date', startDate)
      if (endDate) query = query.lte('lesson_date', endDate)

      const { data, error } = await query

      if (error) throw error

      interface InstructorLessonRow {
        instructor_id: number
        erp_instructors: { full_name: string } | null
      }

      // Group by instructor
      const grouped = ((data as unknown as InstructorLessonRow[]) || []).reduce((acc: Record<string, number>, lesson) => {
        const instructorName = lesson.erp_instructors?.full_name || 'Sem instrutor'
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
        .sort((a, b) => b.aulas - a.aulas)
        .slice(0, 10) // Top 10
    },
  })

  // 4. Aulas por Veículo
  const lessonsByVehicle = useQuery({
    queryKey: ['dashboard-lessons-by-vehicle', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_lessons')
        .select('vehicle_id, erp_vehicles(model, plate)')
        .eq('status', 'completed')

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate) query = query.gte('lesson_date', startDate)
      if (endDate) query = query.lte('lesson_date', endDate)

      const { data, error } = await query

      if (error) throw error

      interface VehicleLessonRow {
        vehicle_id: number
        erp_vehicles: { model: string; plate: string } | null
      }

      // Group by vehicle
      const grouped = ((data as unknown as VehicleLessonRow[]) || []).reduce((acc: Record<string, number>, lesson) => {
        const vehicleName = lesson.erp_vehicles
          ? `${lesson.erp_vehicles.model} (${lesson.erp_vehicles.plate})`
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
        .sort((a, b) => b.aulas - a.aulas)
        .slice(0, 10) // Top 10
    },
  })

  // 5. Contratos Ativos
  const activeContracts = useQuery({
    queryKey: ['dashboard-active-contracts', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate) query = query.gte('start_date', startDate)
      if (endDate) query = query.lte('start_date', endDate)

      const { count, error } = await query

      if (error) throw error
      return count || 0
    },
  })

  // 6. Contratos Abertos no Mês
  const contractsOpenedThisMonth = useQuery({
    queryKey: ['dashboard-contracts-opened-month', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_contracts')
        .select('*', { count: 'exact', head: true })

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate)
      } else {
        // Se não tem filtro, usar mês atual como padrão
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        query = query.gte('created_at', firstDayOfMonth.toISOString()).lte('created_at', lastDayOfMonth.toISOString())
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    },
  })

  // 7. Contratos Concluídos no Mês
  const contractsCompletedThisMonth = useQuery({
    queryKey: ['dashboard-contracts-completed-month', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      if (companyId) query = query.eq('company_id', companyId)
      if (startDate && endDate) {
        query = query.gte('updated_at', startDate).lte('updated_at', endDate)
      } else {
        // Se não tem filtro, usar mês atual como padrão
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        query = query.gte('updated_at', firstDayOfMonth.toISOString()).lte('updated_at', lastDayOfMonth.toISOString())
      }

      const { count, error } = await query

      if (error) throw error
      return count || 0
    },
  })

  // 8. Aulas Compradas (do contrato)
  const purchasedLessons = useQuery({
    queryKey: ['dashboard-purchased-lessons', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_contract_items')
        .select('quantity, erp_contracts!inner(created_at, company_id)')
        .eq('is_extra', false)

      if (companyId) query = query.eq('erp_contracts.company_id', companyId)
      if (startDate) query = query.gte('erp_contracts.created_at', startDate)
      if (endDate) query = query.lte('erp_contracts.created_at', endDate)

      const { data, error } = await query

      if (error) throw error
      
      interface ContractItemRow {
        quantity: number
        erp_contracts: {
          created_at: string
          company_id: number
        }
      }

      // Somar todas as quantidades
      const total = ((data as unknown as ContractItemRow[]) || []).reduce((sum, item) => sum + item.quantity, 0)
      return total
    },
  })

  // 9. Aulas Extras Compradas
  const extraLessonsPurchased = useQuery({
    queryKey: ['dashboard-extra-lessons', startDate, endDate, companyId],
    queryFn: async () => {
      let query = supabase
        .from('erp_contract_items')
        .select('quantity, erp_contracts!inner(created_at, company_id)')
        .eq('is_extra', true)

      if (companyId) query = query.eq('erp_contracts.company_id', companyId)
      if (startDate) query = query.gte('erp_contracts.created_at', startDate)
      if (endDate) query = query.lte('erp_contracts.created_at', endDate)

      const { data, error } = await query

      if (error) throw error
      
      interface ContractItemRow {
        quantity: number
        erp_contracts: {
          created_at: string
          company_id: number
        }
      }

      // Somar todas as quantidades
      const total = ((data as unknown as ContractItemRow[]) || []).reduce((sum, item) => sum + item.quantity, 0)
      return total
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
    purchasedLessons,
    extraLessonsPurchased,
  }
}
