import { useRef, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import type { Lesson, Instructor } from '@/types/database'

interface LessonCalendarProps {
  lessons: Lesson[]
  instructor?: Instructor
  onLessonClick: (lesson: Lesson) => void
}

// Map status to colors
const statusColors = {
  scheduled: {
    bg: '#fef3c7', // yellow-100
    border: '#fbbf24', // yellow-400
    text: '#92400e', // yellow-900
  },
  completed: {
    bg: '#d1fae5', // green-100
    border: '#10b981', // green-500
    text: '#065f46', // green-900
  },
  no_show: {
    bg: '#fee2e2', // red-100
    border: '#ef4444', // red-500
    text: '#991b1b', // red-900
  },
  cancelled: {
    bg: '#f3f4f6', // gray-100
    border: '#9ca3af', // gray-400
    text: '#374151', // gray-700
  },
}

export function LessonCalendar({ lessons, instructor, onLessonClick }: LessonCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)

  // Calculate business hours from instructor's weekly schedule
  const businessHours = useMemo(() => {
    if (!instructor?.weekly_schedule) {
      return [
        { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '06:00', endTime: '22:00' }
      ]
    }

    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    }

    const hours: any[] = []
    Object.entries(dayMap).forEach(([dayKey, dayNum]) => {
      const daySchedule = instructor.weekly_schedule?.[dayKey as keyof typeof instructor.weekly_schedule]
      if (daySchedule) {
        hours.push({ daysOfWeek: [dayNum], startTime: daySchedule.start, endTime: daySchedule.end })
      }
    })

    return hours.length > 0 ? hours : [{ daysOfWeek: [1, 2, 3, 4, 5], startTime: '06:00', endTime: '22:00' }]
  }, [instructor])

  // Calculate slot duration from instructor's lesson duration
  const slotDuration = useMemo(() => {
    const minutes = instructor?.lesson_duration_minutes || 30
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`
  }, [instructor])

  // Convert lessons to FullCalendar events
  const events = lessons.map((lesson) => {
    const colors = statusColors[lesson.status]
    const studentName = lesson.contract_items?.contracts?.clients?.full_name || 'Sem nome'
    const instructorName = lesson.instructors?.full_name || 'Sem instrutor'
    
    return {
      id: lesson.id.toString(),
      title: studentName,
      start: `${lesson.lesson_date}T${lesson.start_time}`,
      end: `${lesson.lesson_date}T${lesson.end_time}`,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        lesson,
        instructorName,
        status: lesson.status,
      },
    }
  })

  const handleEventClick = (info: EventClickArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson
    onLessonClick(lesson)
  }

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { instructorName, status } = eventInfo.event.extendedProps
    
    return (
      <div className="p-1 text-xs overflow-hidden">
        <div className="font-semibold truncate">{eventInfo.event.title}</div>
        <div className="truncate opacity-75">{instructorName}</div>
        {status === 'completed' && <div className="text-[10px] mt-0.5">✓ Concluída</div>}
        {status === 'no_show' && <div className="text-[10px] mt-0.5">✗ Falta</div>}
        {status === 'cancelled' && <div className="text-[10px] mt-0.5">⊘ Cancelada</div>}
      </div>
    )
  }

  return (
    <div className="lesson-calendar-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={ptBrLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        buttonText={{
          today: 'Hoje',
          week: 'Semana',
          day: 'Dia',
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration={slotDuration}
        businessHours={businessHours}
        height="auto"
        allDaySlot={false}
        events={events}
        eventClick={handleEventClick}
        eventContent={renderEventContent}
        nowIndicator={true}
        weekends={true}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric', month: 'numeric' }}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        // Styling
        eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
        dayCellClassNames="hover:bg-muted/30"
      />

      {/* Custom CSS for FullCalendar */}
      <style>{`
        .lesson-calendar-wrapper {
          --fc-border-color: hsl(var(--border));
          --fc-button-bg-color: hsl(var(--primary));
          --fc-button-border-color: hsl(var(--primary));
          --fc-button-hover-bg-color: hsl(var(--primary) / 0.9);
          --fc-button-hover-border-color: hsl(var(--primary) / 0.9);
          --fc-button-active-bg-color: hsl(var(--primary) / 0.8);
          --fc-button-active-border-color: hsl(var(--primary) / 0.8);
          --fc-today-bg-color: hsl(var(--accent));
        }

        .lesson-calendar-wrapper .fc {
          font-family: inherit;
        }

        .lesson-calendar-wrapper .fc-theme-standard td,
        .lesson-calendar-wrapper .fc-theme-standard th {
          border-color: hsl(var(--border));
        }

        .lesson-calendar-wrapper .fc-col-header-cell {
          background-color: hsl(var(--muted) / 0.5);
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          padding: 0.75rem 0.25rem;
        }

        .lesson-calendar-wrapper .fc-timegrid-slot {
          height: 3rem;
        }

        .lesson-calendar-wrapper .fc-event {
          border-width: 2px;
          border-radius: 0.375rem;
          font-size: 0.75rem;
        }

        .lesson-calendar-wrapper .fc-event:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .lesson-calendar-wrapper .fc-button {
          text-transform: capitalize;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
        }

        .lesson-calendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .lesson-calendar-wrapper .fc-scrollgrid {
          border-radius: 0.5rem;
          overflow: hidden;
        }

        /* Dark mode support */
        .dark .lesson-calendar-wrapper .fc-theme-standard td,
        .dark .lesson-calendar-wrapper .fc-theme-standard th {
          border-color: hsl(var(--border));
        }

        .dark .lesson-calendar-wrapper .fc-col-header-cell {
          background-color: hsl(var(--muted) / 0.3);
        }

        .dark .lesson-calendar-wrapper .fc-timegrid-slot-label {
          color: hsl(var(--foreground) / 0.7);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .lesson-calendar-wrapper .fc-toolbar {
            flex-direction: column;
            gap: 0.5rem;
          }

          .lesson-calendar-wrapper .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }

          .lesson-calendar-wrapper .fc-toolbar-title {
            font-size: 1rem;
            margin: 0.5rem 0;
          }

          .lesson-calendar-wrapper .fc-button {
            font-size: 0.75rem;
            padding: 0.375rem 0.75rem;
          }

          .lesson-calendar-wrapper .fc-event {
            font-size: 0.625rem;
          }
        }
      `}</style>
    </div>
  )
}
