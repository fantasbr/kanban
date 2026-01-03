import { useMemo } from 'react'
import type { Lesson, Instructor } from '@/types/database'
import { format, addMinutes } from 'date-fns'

interface AvailabilityTimelineProps {
  lessons: Lesson[]
  selectedDate: Date
  instructor?: Instructor
  instructorId?: number
  vehicleId?: number
}

interface TimeSlot {
  time: string
  status: 'available' | 'occupied-scheduled' | 'occupied-completed' | 'occupied-other'
  lesson?: Lesson
}

const dayOfWeekMap: Record<number, keyof Instructor['weekly_schedule']> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

export function AvailabilityTimeline({ 
  lessons, 
  selectedDate, 
  instructor,
  instructorId, 
  vehicleId 
}: AvailabilityTimelineProps) {
  
  // Generate time slots based on instructor's schedule and lesson duration
  const timeSlots = useMemo(() => {
    // Get day of week from selectedDate
    const dayOfWeek = selectedDate.getDay()
    const dayKey = dayOfWeekMap[dayOfWeek]

    // Check if instructor has schedule for this day
    const daySchedule = instructor?.weekly_schedule?.[dayKey]

    if (!daySchedule) {
      return [] // No slots if instructor has no schedule for this day
    }

    // Parse start and end times
    const [startHour, startMin] = daySchedule.start!.split(':').map(Number)
    const [endHour, endMin] = daySchedule.end!.split(':').map(Number)

    const start = new Date(selectedDate)
    start.setHours(startHour, startMin, 0, 0)
    
    const end = new Date(selectedDate)
    end.setHours(endHour, endMin, 0, 0)

    const slots: TimeSlot[] = []
    // Use instructor's configured lesson duration, default to 60 minutes
    const interval = instructor?.lesson_duration_minutes || 60

    for (let current = start; current < end; current = addMinutes(current, interval)) {
      const timeString = format(current, 'HH:mm')
      
      // Check if this slot is occupied by any lesson
      const occupyingLesson = lessons.find(lesson => {
        if (lesson.lesson_date !== format(selectedDate, 'yyyy-MM-dd')) return false
        if (instructorId && lesson.instructor_id !== instructorId) return false
        if (vehicleId && lesson.vehicle_id !== vehicleId) return false

        const lessonStart = lesson.start_time
        const lessonEnd = lesson.end_time

        return timeString >= lessonStart && timeString < lessonEnd
      })

      if (occupyingLesson) {
        let status: TimeSlot['status'] = 'occupied-other'
        if (occupyingLesson.status === 'scheduled') status = 'occupied-scheduled'
        else if (occupyingLesson.status === 'completed') status = 'occupied-completed'

        slots.push({
          time: timeString,
          status,
          lesson: occupyingLesson,
        })
      } else {
        slots.push({
          time: timeString,
          status: 'available',
        })
      }
    }

    return slots
  }, [lessons, selectedDate, instructor, instructorId, vehicleId])

  const getSlotColor = (status: TimeSlot['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-800'
      case 'occupied-scheduled':
        return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-800'
      case 'occupied-completed':
        return 'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-800'
      case 'occupied-other':
        return 'bg-gray-100 border-gray-300 dark:bg-gray-900/20 dark:border-gray-800'
    }
  }

  const getSlotLabel = (status: TimeSlot['status']) => {
    switch (status) {
      case 'available':
        return 'Disponível'
      case 'occupied-scheduled':
        return 'Agendada'
      case 'occupied-completed':
        return 'Concluída'
      case 'occupied-other':
        return 'Ocupado'
    }
  }

  // Check if instructor has no schedule for this day
  const dayOfWeek = selectedDate.getDay()
  const dayKey = dayOfWeekMap[dayOfWeek]
  const daySchedule = instructor?.weekly_schedule?.[dayKey]

  if (!daySchedule) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <span className="text-2xl">🏖️</span>
        </div>
        <h3 className="text-lg font-semibold">Folga</h3>
        <p className="text-muted-foreground mt-2">
          Este instrutor não trabalha neste dia da semana
        </p>
      </div>
    )
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum slot disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300" />
          <span>Agendada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span>Concluída</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
          <span>Outro</span>
        </div>
      </div>

      {/* Work Hours Info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <div>Horário de trabalho: {daySchedule.start} - {daySchedule.end}</div>
        <div>Duração da aula: {instructor?.lesson_duration_minutes || 60} minutos</div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
        {timeSlots.map((slot, index) => (
          <div
            key={index}
            className={`
              relative p-2 rounded border-2 text-center transition-all
              ${getSlotColor(slot.status)}
              ${slot.lesson ? 'cursor-pointer hover:shadow-md' : ''}
            `}
            title={
              slot.lesson
                ? `${slot.time} - ${slot.lesson.contract_items?.contracts?.clients?.full_name}`
                : `${slot.time} - ${getSlotLabel(slot.status)}`
            }
          >
            <div className="text-xs font-semibold">{slot.time}</div>
            {slot.lesson && (
              <div className="text-[10px] mt-1 truncate opacity-75">
                {slot.lesson.contract_items?.contracts?.clients?.full_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Total: {timeSlots.length} slots •{' '}
        Disponíveis: {timeSlots.filter(s => s.status === 'available').length} •{' '}
        Ocupados: {timeSlots.filter(s => s.status !== 'available').length}
      </div>
    </div>
  )
}
