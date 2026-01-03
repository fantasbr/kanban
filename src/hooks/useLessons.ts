import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Lesson, CreateLessonFormData, LessonFilters, LessonConflict } from '@/types/database'
import { toast } from 'sonner'

export function useLessons(filters?: LessonFilters) {
  const queryClient = useQueryClient()

  // Fetch lessons with filters
  const lessonsQuery = useQuery({
    queryKey: ['lessons', filters],
    queryFn: async () => {
      let query = supabase
        .from('erp_lessons')
        .select(`
          *,
          contract_items:erp_contract_items(
            *,
            contracts:erp_contracts(
              *,
              clients:erp_clients(*)
            )
          ),
          instructors:erp_instructors(*),
          vehicles:erp_vehicles(*)
        `)
        .neq('status', 'cancelled')
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true })

      // Apply filters
      if (filters?.start_date) {
        query = query.gte('lesson_date', filters.start_date)
      }
      if (filters?.end_date) {
        query = query.lte('lesson_date', filters.end_date)
      }
      if (filters?.instructor_id) {
        query = query.eq('instructor_id', filters.instructor_id)
      }
      if (filters?.vehicle_id) {
        query = query.eq('vehicle_id', filters.vehicle_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.contract_id) {
        query = query.eq('contract_items.contract_id', filters.contract_id)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Lesson[]
    },
  })

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: CreateLessonFormData) => {
      // 1. Validate contract status
      const { data: contractItem } = await supabase
        .from('erp_contract_items')
        .select(`
          id,
          contract_id,
          contracts:erp_contracts(
            id,
            status
          )
        `)
        .eq('id', lessonData.contract_item_id)
        .single()

      if (!contractItem) {
        throw new Error('Item de contrato não encontrado')
      }

      const contractStatus = (contractItem.contracts as any)?.status
      if (contractStatus !== 'active') {
        throw new Error(
          `Não é possível agendar aulas para contratos ${
            contractStatus === 'completed' ? 'concluídos' : 
            contractStatus === 'cancelled' ? 'cancelados' : 
            'inativos'
          }`
        )
      }

      // 2. Get instructor duration
      const { data: instructor } = await supabase
        .from('erp_instructors')
        .select('lesson_duration_minutes')
        .eq('id', lessonData.instructor_id)
        .single()

      if (!instructor) throw new Error('Instrutor não encontrado')

      // 3. Calculate end time
      const [hours, minutes] = lessonData.start_time.split(':').map(Number)
      const startDate = new Date()
      startDate.setHours(hours, minutes, 0, 0)
      const endDate = new Date(startDate.getTime() + instructor.lesson_duration_minutes * 60000)
      const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`

      // 4. Check available credits
      const { data: creditsData } = await supabase
        .rpc('get_available_credits', {
          p_contract_item_id: lessonData.contract_item_id
        })

      if (!creditsData || creditsData <= 0) {
        throw new Error('Sem créditos disponíveis neste item de contrato')
      }

      // 5. Check conflicts
      const { data: conflicts } = await supabase
        .rpc('check_lesson_conflicts', {
          p_lesson_id: null,
          p_instructor_id: lessonData.instructor_id,
          p_vehicle_id: lessonData.vehicle_id,
          p_lesson_date: lessonData.lesson_date,
          p_start_time: lessonData.start_time,
          p_end_time: end_time
        })

      if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0] as LessonConflict
        throw new Error(conflict.details)
      }

      // 5. Check instructor availability
      const { data: availability } = await supabase
        .rpc('check_instructor_availability', {
          p_instructor_id: lessonData.instructor_id,
          p_lesson_date: lessonData.lesson_date,
          p_start_time: lessonData.start_time,
          p_end_time: end_time
        })

      if (availability && availability.length > 0 && !availability[0].is_available) {
        throw new Error(availability[0].reason)
      }

      // 6. Validate CNH category
      const { data: isValid } = await supabase
        .rpc('validate_instructor_vehicle_category', {
          p_instructor_id: lessonData.instructor_id,
          p_vehicle_id: lessonData.vehicle_id
        })

      if (!isValid) {
        throw new Error('Categoria CNH do instrutor incompatível com o tipo de veículo')
      }

      // 7. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // 8. Create lesson
      const { data: lesson, error } = await supabase
        .from('erp_lessons')
        .insert({
          contract_item_id: lessonData.contract_item_id,
          instructor_id: lessonData.instructor_id,
          vehicle_id: lessonData.vehicle_id,
          lesson_date: lessonData.lesson_date,
          start_time: lessonData.start_time,
          end_time,
          duration_minutes: instructor.lesson_duration_minutes,
          topic: lessonData.topic,
          location: lessonData.location,
          notes: lessonData.notes,
          scheduled_by: user.id,
          status: 'scheduled'
        })
        .select(`
          *,
          contract_items:erp_contract_items(
            *,
            contracts:erp_contracts(
              *,
              clients:erp_clients(*)
            )
          ),
          instructors:erp_instructors(*),
          vehicles:erp_vehicles(*)
        `)
        .single()

      if (error) throw error

      // 9. Send webhook (lesson_created)
      try {
        const { data: settings } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'webhook_lesson_created_enabled')
          .single()

        if (settings?.value === 'true') {
          const { data: webhookUrl } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'webhook_lesson_created_url')
            .single()

          if (webhookUrl?.value) {
            await fetch(webhookUrl.value, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event_type: 'lesson_created',
                lesson_id: lesson.id,
                student: {
                  id: lesson.contract_items.contracts.clients.id,
                  name: lesson.contract_items.contracts.clients.name,
                  phone: lesson.contract_items.contracts.clients.phone
                },
                instructor: {
                  id: lesson.instructors.id,
                  name: lesson.instructors.full_name
                },
                vehicle: {
                  id: lesson.vehicles.id,
                  plate: lesson.vehicles.plate,
                  model: lesson.vehicles.model
                },
                lesson_date: lesson.lesson_date,
                start_time: lesson.start_time,
                end_time: lesson.end_time,
                topic: lesson.topic
              })
            })

            // Mark webhook as sent
            await supabase
              .from('erp_lessons')
              .update({ webhook_sent_at: new Date().toISOString() })
              .eq('id', lesson.id)
          }
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError)
        // Don't fail the lesson creation if webhook fails
      }

      return lesson
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      
      // Get remaining credits
      supabase
        .rpc('get_available_credits', {
          p_contract_item_id: data.contract_item_id
        })
        .then(({ data: credits }) => {
          toast.success(`Aula agendada! ${credits || 0} créditos restantes`)
        })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar aula')
    }
  })

  // Cancel lesson mutation
  const cancelLessonMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      // 1. Validate contract status
      const { data: lesson } = await supabase
        .from('erp_lessons')
        .select(`
          id,
          contract_item_id,
          contract_items:erp_contract_items(
            id,
            contracts:erp_contracts(
              id,
              status
            )
          )
        `)
        .eq('id', id)
        .single()

      if (!lesson) {
        throw new Error('Aula não encontrada')
      }

      const contractStatus = (lesson.contract_items as any)?.contracts?.status
      if (contractStatus !== 'active') {
        throw new Error(
          `Não é possível alterar o status de aulas de contratos ${
            contractStatus === 'completed' ? 'concluídos' : 
            contractStatus === 'cancelled' ? 'cancelados' : 
            'inativos'
          }`
        )
      }

      // 2. Cancel the lesson
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('erp_lessons')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user.id,
          cancellation_reason: reason
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      toast.success('Aula desmarcada. Crédito devolvido.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao desmarcar aula')
    }
  })

  // Mark no show mutation
  const markNoShowMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      // 1. Validate contract status
      const { data: lesson } = await supabase
        .from('erp_lessons')
        .select(`
          id,
          contract_item_id,
          contract_items:erp_contract_items(
            id,
            contracts:erp_contracts(
              id,
              status
            )
          )
        `)
        .eq('id', id)
        .single()

      if (!lesson) {
        throw new Error('Aula não encontrada')
      }

      const contractStatus = (lesson.contract_items as any)?.contracts?.status
      if (contractStatus !== 'active') {
        throw new Error(
          `Não é possível alterar o status de aulas de contratos ${
            contractStatus === 'completed' ? 'concluídos' : 
            contractStatus === 'cancelled' ? 'cancelados' : 
            'inativos'
          }`
        )
      }

      // 2. Mark as no-show
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('erp_lessons')
        .update({
          status: 'no_show',
          no_show_at: new Date().toISOString(),
          no_show_by: user.id,
          instructor_notes: notes
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      toast.error('Falta registrada')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao registrar falta')
    }
  })

  // Mark completed mutation
  const markCompletedMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      // 1. Validate contract status
      const { data: lesson } = await supabase
        .from('erp_lessons')
        .select(`
          id,
          contract_item_id,
          contract_items:erp_contract_items(
            id,
            contracts:erp_contracts(
              id,
              status
            )
          )
        `)
        .eq('id', id)
        .single()

      if (!lesson) {
        throw new Error('Aula não encontrada')
      }

      const contractStatus = (lesson.contract_items as any)?.contracts?.status
      if (contractStatus !== 'active') {
        throw new Error(
          `Não é possível alterar o status de aulas de contratos ${
            contractStatus === 'completed' ? 'concluídos' : 
            contractStatus === 'cancelled' ? 'cancelados' : 
            'inativos'
          }`
        )
      }

      // 2. Mark as completed
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('erp_lessons')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user.id,
          instructor_notes: notes
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      toast.success('Aula concluída com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao concluir aula')
    }
  })

  return {
    lessons: lessonsQuery.data ?? [],
    isLoading: lessonsQuery.isLoading,
    error: lessonsQuery.error,
    
    createLesson: createLessonMutation.mutateAsync,
    cancelLesson: cancelLessonMutation.mutateAsync,
    markNoShow: markNoShowMutation.mutateAsync,
    markCompleted: markCompletedMutation.mutateAsync,
    
    isCreating: createLessonMutation.isPending,
    isCancelling: cancelLessonMutation.isPending,
    isMarkingNoShow: markNoShowMutation.isPending,
    isMarkingCompleted: markCompletedMutation.isPending,
  }
}
