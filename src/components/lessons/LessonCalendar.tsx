import { useRef, useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'

interface HourSlot {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}
import type { Lesson, Instructor } from '@/types/database'

interface LessonCalendarProps {
  lessons: Lesson[]
  instructor?: Instructor
  onLessonClick: (lesson: Lesson) => void
  enableQuickSchedule?: boolean
  onSlotClick?: (date: Date, time: string) => void
  onWeekChange?: (weekStart: Date) => void
}

// Map status to modern gradient colors
const statusColors = {
  scheduled: {
    bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', // blue gradient
    bgSolid: '#dbeafe',
    border: '#3b82f6', // blue-500
    text: '#1e40af', // blue-800
  },
  completed: {
    bg: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', // green gradient
    bgSolid: '#d1fae5',
    border: '#10b981', // green-500
    text: '#065f46', // green-900
  },
  no_show: {
    bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', // red gradient
    bgSolid: '#fee2e2',
    border: '#ef4444', // red-500
    text: '#991b1b', // red-900
  },
  cancelled: {
    bg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', // gray gradient
    bgSolid: '#f3f4f6',
    border: '#9ca3af', // gray-400
    text: '#374151', // gray-700
  },
}

export function LessonCalendar({ 
  lessons, 
  instructor, 
  onLessonClick,
  enableQuickSchedule = false,
  onSlotClick,
  onWeekChange
}: LessonCalendarProps) {
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

    const hours: HourSlot[] = []
    Object.entries(dayMap).forEach(([dayKey, dayNum]) => {
      const daySchedule = instructor.weekly_schedule?.[dayKey as keyof typeof instructor.weekly_schedule]
      if (daySchedule) {
        hours.push({ 
          daysOfWeek: [dayNum], 
          startTime: daySchedule.start || '06:00', // Provide default if null
          endTime: daySchedule.end || '22:00' // Provide default if null
        })
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

  // Calculate min/max time from instructor's schedule
  const { slotMinTime, slotMaxTime } = useMemo(() => {
    if (!instructor?.weekly_schedule) {
      return { slotMinTime: '06:00:00', slotMaxTime: '22:00:00' }
    }

    let earliestStart = '23:59'
    let latestEnd = '00:00'

    Object.values(instructor.weekly_schedule).forEach((schedule) => {
      if (schedule && schedule.start && schedule.end) {
        if (schedule.start < earliestStart) earliestStart = schedule.start
        if (schedule.end > latestEnd) latestEnd = schedule.end
      }
    })

    // Add 1 hour buffer before and after
    const [startHour] = earliestStart.split(':').map(Number)
    const [endHour] = latestEnd.split(':').map(Number)
    
    const bufferStart = Math.max(0, startHour - 1)
    const bufferEnd = Math.min(24, endHour + 1)

    return {
      slotMinTime: `${bufferStart.toString().padStart(2, '0')}:00:00`,
      slotMaxTime: `${bufferEnd.toString().padStart(2, '0')}:00:00`
    }
  }, [instructor])

  // Convert lessons to FullCalendar events
  const events = lessons.map((lesson) => {
    const colors = statusColors[lesson.status]
    const studentName = lesson.contract_items?.contracts?.clients?.full_name || 'Sem nome'
    const instructorName = lesson.instructors?.full_name || 'Sem instrutor'
    const vehicleInfo = lesson.vehicles 
      ? `${lesson.vehicles.brand} ${lesson.vehicles.model} - ${lesson.vehicles.plate}`
      : 'Sem veículo'
    
    return {
      id: lesson.id.toString(),
      title: studentName,
      start: `${lesson.lesson_date}T${lesson.start_time}`,
      end: `${lesson.lesson_date}T${lesson.end_time}`,
      backgroundColor: colors.bgSolid,
      borderColor: colors.border,
      textColor: colors.text,
      extendedProps: {
        lesson,
        instructorName,
        vehicleInfo,
        status: lesson.status,
      },
    }
  })

  const handleEventClick = (info: EventClickArg) => {
    const lesson = info.event.extendedProps.lesson as Lesson
    onLessonClick(lesson)
  }

  const handleDateClick = (info: DateClickArg) => {
    if (!enableQuickSchedule || !onSlotClick) return
    
    // Extract date and time from the clicked slot
    const clickedDate = info.date
    const hours = clickedDate.getHours().toString().padStart(2, '0')
    const minutes = clickedDate.getMinutes().toString().padStart(2, '0')
    const time = `${hours}:${minutes}`
    
    onSlotClick(clickedDate, time)
  }

  const renderEventContent = (eventInfo: EventContentArg) => {
    const { vehicleInfo } = eventInfo.event.extendedProps
    
    return (
      <div className="px-1.5 py-1 h-full flex flex-col justify-center gap-0.5 overflow-hidden">
        {/* Student name - ultra compact */}
        <div className="font-semibold text-xs truncate leading-tight text-gray-900">
          {eventInfo.event.title}
        </div>
        
        {/* Vehicle info - ultra compact */}
        <div className="text-[11px] font-medium truncate text-gray-700">
          🚗 {vehicleInfo}
        </div>
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
        slotMinTime={slotMinTime}
        slotMaxTime={slotMaxTime}
        slotDuration={slotDuration}
        businessHours={businessHours}
        height="auto"
        allDaySlot={false}
        events={events}
        eventClick={handleEventClick}
        dateClick={enableQuickSchedule ? handleDateClick : undefined}
        selectable={enableQuickSchedule}
        eventContent={renderEventContent}
        datesSet={(dateInfo) => {
          // Notify parent when week changes
          if (onWeekChange) {
            onWeekChange(dateInfo.start)
          }
        }}
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

        /* Header with gradient background */
        .lesson-calendar-wrapper .fc-col-header-cell {
          background: linear-gradient(to bottom, hsl(var(--muted) / 0.8), hsl(var(--muted) / 0.4));
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          padding: 0.75rem 0.25rem;
          border-bottom: 2px solid hsl(var(--border));
        }

        /* Time slots - ultra compact */
        .lesson-calendar-wrapper .fc-timegrid-slot {
          height: 2.5rem;
          transition: background-color 0.2s;
        }

        .lesson-calendar-wrapper .fc-timegrid-slot:hover {
          background-color: hsl(var(--accent) / 0.2);
        }


        /* Event cards - ultra compact */
        .lesson-calendar-wrapper .fc-event {
          border-width: 2px;
          border-radius: 0.375rem;
          min-height: 40px !important;
          max-height: 100% !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          transition: all 0.2s ease;
        }

        .lesson-calendar-wrapper .fc-event:hover {
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        /* Force larger text in events */
        .lesson-calendar-wrapper .fc-event-main {
          padding: 0 !important;
        }

        .lesson-calendar-wrapper .fc-event-title {
          font-size: 1rem !important;
          font-weight: 900 !important;
          color: #111827 !important;
        }

        /* Modern buttons with shadow */
        .lesson-calendar-wrapper .fc-button {
          text-transform: capitalize;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .lesson-calendar-wrapper .fc-button:hover {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }

        .lesson-calendar-wrapper .fc-button:active {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        /* Title with gradient text */
        .lesson-calendar-wrapper .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 700;
          text-transform: capitalize;
          background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Calendar grid with rounded corners and shadow */
        .lesson-calendar-wrapper .fc-scrollgrid {
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        /* Today column highlight */
        .lesson-calendar-wrapper .fc-day-today {
          background-color: hsl(var(--accent) / 0.15) !important;
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
