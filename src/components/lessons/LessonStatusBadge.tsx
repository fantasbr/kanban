import { LessonStatus } from '@/types/database'
import { Calendar, CheckCircle2, XCircle, Ban } from 'lucide-react'

interface LessonStatusBadgeProps {
  status: LessonStatus
  className?: string
}

const statusConfig = {
  scheduled: {
    label: 'Agendada',
    icon: Calendar,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  },
  completed: {
    label: 'Concluída',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
  },
  no_show: {
    label: 'Falta',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  },
  cancelled: {
    label: 'Cancelada',
    icon: Ban,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
  },
}

export function LessonStatusBadge({ status, className = '' }: LessonStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${config.className} ${className}`}
      title={config.label}
    >
      <Icon className="h-3 w-3" />
      <span className="hidden sm:inline">{config.label}</span>
    </span>
  )
}
