import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { LessonAudit } from '@/types/database'

export function useLessonReports() {
  // Get lesson audit logs
  const auditLogsQuery = useQuery({
    queryKey: ['lesson-audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_lesson_audit')
        .select(`
          *,
          lessons:erp_lessons(
            *,
            contract_items:erp_contract_items(
              contracts:erp_contracts(
                clients:erp_clients(*)
              )
            )
          )
        `)
        .order('performed_at', { ascending: false })
        .limit(100)

      if (error) throw error
      return (data || []) as LessonAudit[]
    },
  })

  // Get contract lesson summary (hours used vs contracted)
  const contractSummaryQuery = useQuery({
    queryKey: ['contract-lesson-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_items')
        .select(`
          id,
          contract_id,
          description,
          quantity,
          contracts:erp_contracts(
            contract_number,
            clients:erp_clients(name)
          )
        `)

      if (error) throw error

      // For each contract item, get lesson statistics
      const summaries = await Promise.all(
        (data || []).map(async (item: any) => {
          const { data: lessons } = await supabase
            .from('erp_lessons')
            .select('status, duration_minutes')
            .eq('contract_item_id', item.id)

          const scheduled = lessons?.filter(l => l.status === 'scheduled').length || 0
          const completed = lessons?.filter(l => l.status === 'completed').length || 0
          const noShow = lessons?.filter(l => l.status === 'no_show').length || 0
          const cancelled = lessons?.filter(l => l.status === 'cancelled').length || 0

          const hoursUsed = lessons
            ?.filter(l => l.status !== 'cancelled')
            .reduce((sum, l) => sum + l.duration_minutes, 0) / 60 || 0

          return {
            contract_item_id: item.id,
            contract_number: item.contracts.contract_number,
            client_name: item.contracts.clients.name,
            description: item.description,
            hours_contracted: item.quantity,
            hours_used: hoursUsed,
            hours_remaining: item.quantity - hoursUsed,
            lessons_scheduled: scheduled,
            lessons_completed: completed,
            lessons_no_show: noShow,
            lessons_cancelled: cancelled,
            total_lessons: lessons?.length || 0
          }
        })
      )

      return summaries
    },
  })

  // Get instructor summary (lessons given, attendance rate, etc)
  const instructorSummaryQuery = useQuery({
    queryKey: ['instructor-summary'],
    queryFn: async () => {
      const { data: instructors, error } = await supabase
        .from('erp_instructors')
        .select('id, full_name, hourly_rate')
        .eq('is_active', true)

      if (error) throw error

      const summaries = await Promise.all(
        (instructors || []).map(async (instructor) => {
          const { data: lessons } = await supabase
            .from('erp_lessons')
            .select('status, duration_minutes')
            .eq('instructor_id', instructor.id)

          const completed = lessons?.filter(l => l.status === 'completed').length || 0
          const noShow = lessons?.filter(l => l.status === 'no_show').length || 0
          const scheduled = lessons?.filter(l => l.status === 'scheduled').length || 0

          const totalLessons = completed + noShow
          const attendanceRate = totalLessons > 0 ? (completed / totalLessons) * 100 : 0

          const hoursWorked = lessons
            ?.filter(l => l.status === 'completed')
            .reduce((sum, l) => sum + l.duration_minutes, 0) / 60 || 0

          const revenue = hoursWorked * instructor.hourly_rate

          return {
            instructor_id: instructor.id,
            instructor_name: instructor.full_name,
            lessons_completed: completed,
            lessons_no_show: noShow,
            lessons_scheduled: scheduled,
            total_lessons: lessons?.length || 0,
            attendance_rate: Math.round(attendanceRate),
            hours_worked: hoursWorked,
            estimated_revenue: revenue
          }
        })
      )

      return summaries.sort((a, b) => b.lessons_completed - a.lessons_completed)
    },
  })

  // Get KPIs for dashboard
  const kpisQuery = useQuery({
    queryKey: ['lesson-kpis'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0]
      const thisMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

      // Today's lessons
      const { data: todayLessons } = await supabase
        .from('erp_lessons')
        .select('id, status')
        .eq('lesson_date', today)
        .neq('status', 'cancelled')

      // Next 7 days lessons
      const next7Days = new Date()
      next7Days.setDate(next7Days.getDate() + 7)
      const { data: upcomingLessons } = await supabase
        .from('erp_lessons')
        .select('id')
        .gte('lesson_date', today)
        .lte('lesson_date', next7Days.toISOString().split('T')[0])
        .eq('status', 'scheduled')

      // This month's lessons
      const { data: monthLessons } = await supabase
        .from('erp_lessons')
        .select('status')
        .gte('lesson_date', `${thisMonth}-01`)
        .lte('lesson_date', `${thisMonth}-31`)

      const completed = monthLessons?.filter(l => l.status === 'completed').length || 0
      const noShow = monthLessons?.filter(l => l.status === 'no_show').length || 0
      const total = completed + noShow
      const attendanceRate = total > 0 ? (completed / total) * 100 : 0

      // Most active instructor this month
      const { data: instructorStats } = await supabase
        .from('erp_lessons')
        .select(`
          instructor_id,
          instructors:erp_instructors(full_name)
        `)
        .gte('lesson_date', `${thisMonth}-01`)
        .lte('lesson_date', `${thisMonth}-31`)
        .eq('status', 'completed')

      const instructorCounts = instructorStats?.reduce((acc: any, lesson: any) => {
        const id = lesson.instructor_id
        acc[id] = (acc[id] || 0) + 1
        return acc
      }, {})

      const mostActiveInstructorId = instructorCounts
        ? Object.keys(instructorCounts).reduce((a, b) =>
            instructorCounts[a] > instructorCounts[b] ? a : b
          )
        : null

      const mostActiveInstructor = mostActiveInstructorId
        ? instructorStats?.find(l => l.instructor_id === parseInt(mostActiveInstructorId))?.instructors
        : null

      return {
        lessons_today: todayLessons?.length || 0,
        upcoming_lessons: upcomingLessons?.length || 0,
        attendance_rate: Math.round(attendanceRate),
        most_active_instructor: mostActiveInstructor?.full_name || 'N/A'
      }
    },
  })

  return {
    auditLogs: auditLogsQuery.data ?? [],
    contractSummary: contractSummaryQuery.data ?? [],
    instructorSummary: instructorSummaryQuery.data ?? [],
    kpis: kpisQuery.data,
    
    isLoadingAudit: auditLogsQuery.isLoading,
    isLoadingContracts: contractSummaryQuery.isLoading,
    isLoadingInstructors: instructorSummaryQuery.isLoading,
    isLoadingKPIs: kpisQuery.isLoading,
  }
}
