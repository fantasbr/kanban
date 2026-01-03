import { useState, useEffect } from 'react'
import { Calendar, Plus, Search, Filter, X, Eye, CalendarDays, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLessons } from '@/hooks/useLessons'
import { useInstructors } from '@/hooks/useInstructors'
import { LessonStatusBadge } from '@/components/lessons/LessonStatusBadge'
import { LessonCreateModal } from '@/components/lessons/LessonCreateModal'
import { LessonDetailsModal } from '@/components/lessons/LessonDetailsModal'
import { LessonListSkeleton } from '@/components/lessons/LessonListSkeleton'
import { LessonCalendar } from '@/components/lessons/LessonCalendar'
import type { Lesson, LessonStatus, LessonFilters } from '@/types/database'
import { format } from 'date-fns'

export function Lessons() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Filters
  const [filters, setFilters] = useState<LessonFilters>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [instructorFilter, setInstructorFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Data hooks
  const { lessons, isLoading } = useLessons(filters)
  const { instructors } = useInstructors()

  // Apply filters
  const handleApplyFilters = () => {
    const newFilters: LessonFilters = {}
    
    if (statusFilter !== 'all') {
      newFilters.status = statusFilter as LessonStatus
    }
    if (instructorFilter !== 'all') {
      newFilters.instructor_id = parseInt(instructorFilter)
    }
    if (startDate) {
      newFilters.start_date = startDate
    }
    if (endDate) {
      newFilters.end_date = endDate
    }

    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setInstructorFilter('all')
    setStartDate('')
    setEndDate('')
    setFilters({})
  }

  // Client-side search
  const filteredLessons = lessons.filter(lesson => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      lesson.contract_items?.contracts?.clients?.full_name?.toLowerCase().includes(search) ||
      lesson.instructors?.full_name?.toLowerCase().includes(search) ||
      lesson.vehicles?.plate?.toLowerCase().includes(search) ||
      lesson.topic?.toLowerCase().includes(search)
    )
  })

  const hasActiveFilters = statusFilter !== 'all' || instructorFilter !== 'all' || startDate || endDate || searchTerm

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close modals
      if (e.key === 'Escape') {
        if (isCreateModalOpen) setIsCreateModalOpen(false)
        if (isDetailsModalOpen) setIsDetailsModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCreateModalOpen, isDetailsModalOpen])

  return (
    <TooltipProvider>
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="hidden sm:inline">Agendamento de Aulas</span>
            <span className="sm:hidden">Aulas</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gerencie as aulas dos alunos
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              size="lg"
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="h-5 w-5" />
              Nova Aula
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Agendar nova aula para um aluno</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Hoje
            </p>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </div>
          <p className="text-xl sm:text-2xl font-bold mt-2">
            {lessons.filter(l => {
              const today = new Date().toISOString().split('T')[0]
              return l.lesson_date === today && l.status !== 'cancelled'
            }).length}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            Agendadas
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-2 text-yellow-600">
            {lessons.filter(l => l.status === 'scheduled').length}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            Concluídas
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-2 text-green-600">
            {lessons.filter(l => l.status === 'completed').length}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 sm:p-6">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">
            Faltas
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-2 text-red-600">
            {lessons.filter(l => l.status === 'no_show').length}
          </p>
        </div>
      </div>

      {/* Tabs: List vs Calendar */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            <span>Lista</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendário</span>
          </TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list" className="space-y-4 sm:space-y-6 mt-0">
          {/* Filters */}
          <div className="rounded-lg border bg-card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm sm:text-base">Filtros</h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="ml-auto text-xs h-7"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    handleApplyFilters()
                  }}
                  placeholder="Data inicial"
                  className="text-sm"
                />
              </div>

              <div>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    handleApplyFilters()
                  }}
                  placeholder="Data final"
                  className="text-sm"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value)
                  handleApplyFilters()
                }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="scheduled">Agendadas</SelectItem>
                    <SelectItem value="completed">Conclu ídas</SelectItem>
                    <SelectItem value="no_show">Faltas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Instructor Filter */}
              <div className="sm:col-span-2 lg:col-span-2">
                <Select value={instructorFilter} onValueChange={(value) => {
                  setInstructorFilter(value)
                  handleApplyFilters()
                }}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Instrutor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os instrutores</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 sm:p-6">
              {isLoading ? (
                <LessonListSkeleton />
              ) : filteredLessons.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-2 text-base sm:text-lg font-semibold">
                {hasActiveFilters ? 'Nenhuma aula encontrada' : 'Nenhuma aula agendada'}
              </h3>
              <p className="text-muted-foreground mt-2 text-sm max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Ajuste os filtros acima para encontrar o que você procura'
                  : 'Comece criando sua primeira aula. É rápido e fácil!'}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-6"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Primeira Aula
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {filteredLessons.length} aula{filteredLessons.length !== 1 ? 's' : ''} encontrada{filteredLessons.length !== 1 ? 's' : ''}
              </p>

              {/* Mobile: Card Layout */}
              <div className="space-y-3 md:hidden">
                {filteredLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-accent cursor-pointer active:bg-accent/80 transition-colors"
                    onClick={() => {
                      setSelectedLesson(lesson)
                      setIsDetailsModalOpen(true)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {lesson.contract_items?.contracts?.clients?.full_name || '-'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(lesson.lesson_date), 'dd/MM/yyyy')} • {lesson.start_time}
                        </p>
                      </div>
                      <LessonStatusBadge status={lesson.status} className="text-xs shrink-0" />
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Instrutor: {lesson.instructors?.full_name || '-'}</p>
                      <p>Veículo: {lesson.vehicles?.plate || '-'}</p>
                      {lesson.topic && <p>Tópico: {lesson.topic}</p>}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLesson(lesson)
                        setIsDetailsModalOpen(true)
                      }}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver detalhes
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden md:block border rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Data/Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Instrutor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Veículo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tópico
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {filteredLessons.map((lesson) => (
                      <tr
                        key={lesson.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => {
                          setSelectedLesson(lesson)
                          setIsDetailsModalOpen(true)
                        }}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div>
                            <div className="font-medium">
                              {format(new Date(lesson.lesson_date), 'dd/MM/yyyy')}
                            </div>
                            <div className="text-muted-foreground">
                              {lesson.start_time} - {lesson.end_time}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {lesson.contract_items?.contracts?.clients?.full_name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {lesson.instructors?.full_name || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div>
                            <div className="font-medium">{lesson.vehicles?.plate || '-'}</div>
                            <div className="text-muted-foreground text-xs">
                              {lesson.vehicles?.model || ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="text-muted-foreground">
                            {lesson.topic || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <LessonStatusBadge status={lesson.status} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLesson(lesson)
                              setIsDetailsModalOpen(true)
                            }}
                          >
                            Ver detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
            </div>
          </div>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="mt-0">
          <div className="rounded-lg border bg-card p-4 sm:p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-4 text-sm">Carregando calendário...</p>
                </div>
              </div>
            ) : (
              <LessonCalendar
                lessons={filteredLessons}
                onLessonClick={(lesson) => {
                  setSelectedLesson(lesson)
                  setIsDetailsModalOpen(true)
                }}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <LessonCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
      <LessonDetailsModal
        lesson={selectedLesson}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
    </TooltipProvider>
  )
}
