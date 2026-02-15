import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AvailabilitySlot, Instructor, WeeklySchedule, Lesson, InstructorBlock } from '@/types/database'
import { format, addMinutes, parse } from 'date-fns'

interface UseAvailabilityProps {
  instructor_id?: number
  vehicle_id?: number
  date?: string
  enabled?: boolean
}

export function useAvailability(props: UseAvailabilityProps) {
  const { instructor_id, vehicle_id, date, enabled = true } = props

  // Get instructor availability
  const instructorAvailabilityQuery = useQuery({
    queryKey: ['instructor-availability', instructor_id, date],
    queryFn: async () => {
      if (!instructor_id || !date) return []

      // Get instructor data
      const { data: instructor } = await supabase
        .from('erp_instructors')
        .select('lesson_duration_minutes, weekly_schedule')
        .eq('id', instructor_id)
        .single()
      
      if (!instructor) return []
      
      const instructorData = instructor as Instructor

      // Get day of week
      const dayOfWeek = format(new Date(date), 'EEEE').toLowerCase() as keyof WeeklySchedule
      const schedule = instructorData.weekly_schedule?.[dayOfWeek]

      if (!schedule?.enabled || !schedule.start || !schedule.end) {
        return [{
          start: '00:00',
          end: '23:59',
          available: false,
          reason: 'Instrutor não trabalha neste dia'
        }] as AvailabilitySlot[]
      }

      // Get lessons for this instructor on this date
      const { data: lessons } = await supabase
        .from('erp_lessons')
        .select('start_time, end_time')
        .eq('instructor_id', instructor_id)
        .eq('lesson_date', date)
        .neq('status', 'cancelled')
      
      const lessonsData = (lessons as unknown as Pick<Lesson, 'start_time' | 'end_time'>[]) || []

      // Get manual blocks
      const { data: blocks } = await supabase
        .from('erp_instructor_blocks')
        .select('start_date, end_date, reason')
        .eq('instructor_id', instructor_id)
        .lte('start_date', date)
        .gte('end_date', date)

      const blocksData = (blocks as unknown as Pick<InstructorBlock, 'start_date' | 'end_date' | 'reason'>[]) || []

      // Generate time slots (every 30 minutes)
      const slots: AvailabilitySlot[] = []
      const workStart = parse(schedule.start, 'HH:mm', new Date())
      const workEnd = parse(schedule.end, 'HH:mm', new Date())
      
      let current = workStart
      const slotDuration = 30 // minutes

      while (current < workEnd) {
        const slotStart = format(current, 'HH:mm')
        const slotEnd = format(addMinutes(current, instructorData.lesson_duration_minutes || 60), 'HH:mm')

        // Check if this slot overlaps with any lesson
        const hasLesson = lessonsData.some(lesson => {
          return (
            (slotStart >= lesson.start_time && slotStart < lesson.end_time) ||
            (slotEnd > lesson.start_time && slotEnd <= lesson.end_time) ||
            (slotStart <= lesson.start_time && slotEnd >= lesson.end_time)
          )
        })

        // Check if this slot overlaps with any block
        // Since blocks are date-based (full days), existence implies the whole day is blocked
        const hasBlock = blocksData && blocksData.length > 0

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: !hasLesson && !hasBlock,
          reason: hasBlock ? blocksData[0].reason : 
            hasLesson ? 'Aula agendada' : undefined
        })

        current = addMinutes(current, slotDuration)
      }

      return slots
    },
    enabled: enabled && !!instructor_id && !!date
  })

  // Get vehicle availability
  const vehicleAvailabilityQuery = useQuery({
    queryKey: ['vehicle-availability', vehicle_id, date],
    queryFn: async () => {
      if (!vehicle_id || !date) return []

      // Get lessons for this vehicle on this date
      const { data: lessons } = await supabase
        .from('erp_lessons')
        .select('start_time, end_time')
        .eq('vehicle_id', vehicle_id)
        .eq('lesson_date', date)
        .neq('status', 'cancelled')
      
      const lessonsData = (lessons as unknown as Pick<Lesson, 'start_time' | 'end_time'>[]) || []

      // Generate time slots (8:00 - 22:00, every 30 minutes)
      const slots: AvailabilitySlot[] = []
      const dayStart = parse('08:00', 'HH:mm', new Date())
      const dayEnd = parse('22:00', 'HH:mm', new Date())
      
      let current = dayStart
      const slotDuration = 30 // minutes
      const lessonDuration = 60 // default lesson duration

      while (current < dayEnd) {
        const slotStart = format(current, 'HH:mm')
        const slotEnd = format(addMinutes(current, lessonDuration), 'HH:mm')

        // Check if this slot overlaps with any lesson
        const hasLesson = lessonsData.some(lesson => {
          return (
            (slotStart >= lesson.start_time && slotStart < lesson.end_time) ||
            (slotEnd > lesson.start_time && slotEnd <= lesson.end_time) ||
            (slotStart <= lesson.start_time && slotEnd >= lesson.end_time)
          )
        })

        slots.push({
          start: slotStart,
          end: slotEnd,
          available: !hasLesson,
          reason: hasLesson ? 'Veículo em uso' : undefined
        })

        current = addMinutes(current, slotDuration)
      }

      return slots
    },
    enabled: enabled && !!vehicle_id && !!date
  })

  return {
    instructorSlots: instructorAvailabilityQuery.data ?? [],
    vehicleSlots: vehicleAvailabilityQuery.data ?? [],
    isLoadingInstructor: instructorAvailabilityQuery.isLoading,
    isLoadingVehicle: vehicleAvailabilityQuery.isLoading,
  }
}
