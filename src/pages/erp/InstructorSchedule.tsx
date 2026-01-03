import { useState } from 'react'
import { CalendarClock, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLessons } from '@/hooks/useLessons'
import { useInstructors } from '@/hooks/useInstructors'
import { LessonCalendar } from '@/components/lessons/LessonCalendar'
import { LessonDetailsModal } from '@/components/lessons/LessonDetailsModal'
import { AvailabilityTimeline } from '@/components/lessons/AvailabilityTimeline'
import { ClientSearch } from '@/components/lessons/ClientSearch'
import { ClientHeader } from '@/components/lessons/ClientHeader'
import { LessonHistory } from '@/components/lessons/LessonHistory'
import type { Lesson, Client, Contract } from '@/types/database'

interface ClientWithContract extends Client {
  contract: Contract & {
    total_lessons: number
    completed_lessons: number
  }
}

export function InstructorSchedule() {
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<ClientWithContract | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [timelineDate, setTimelineDate] = useState(new Date())

  const { instructors } = useInstructors()
  const { lessons, isLoading } = useLessons({
    instructor_id: selectedInstructorId ? parseInt(selectedInstructorId) : undefined,
  })

  const selectedInstructor = instructors.find(i => i.id === parseInt(selectedInstructorId))

  const handleClientSelect = (client: ClientWithContract | null) => {
    setSelectedClient(client)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarClock className="h-8 w-8" />
          Agenda de Instrutores
        </h1>
        <p className="text-muted-foreground mt-1">
          Busque clientes e visualize a agenda e disponibilidade dos instrutores
        </p>
      </div>

      {/* Instructor Selector - PRIMARY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecione um Instrutor</CardTitle>
          <CardDescription>
            Escolha o instrutor para visualizar sua agenda completa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecione um instrutor..." />
            </SelectTrigger>
            <SelectContent>
              {instructors.filter(i => i.is_active).map((instructor) => (
                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                  <div className="flex items-center gap-2">
                    <span>{instructor.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      CNH {instructor.cnh_category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedInstructor && (
            <p className="text-sm text-muted-foreground mt-3">
              Visualizando agenda de <strong>{selectedInstructor.full_name}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Client Search - OPTIONAL (only show after instructor selected) */}
      {selectedInstructorId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Buscar Cliente (Opcional)</CardTitle>
            <CardDescription>
              Busque um cliente para ver seu histórico e facilitar agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientSearch onClientSelect={handleClientSelect} />
          </CardContent>
        </Card>
      )}

      {/* Client Header (if selected) */}
      {selectedClient && (
        <ClientHeader
          client={selectedClient}
          contract={selectedClient.contract}
        />
      )}

      {/* Main Content */}
      {selectedInstructorId ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lesson History Sidebar (if client selected) */}
          {selectedClient && (
            <div className="lg:col-span-3">
              <LessonHistory clientId={selectedClient.id} />
            </div>
          )}

          {/* Calendar & Timeline */}
          <div className={selectedClient ? "lg:col-span-9" : "lg:col-span-12"}>
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="calendar" className="space-y-4">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="calendar">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Calendário
                    </TabsTrigger>
                    <TabsTrigger value="timeline">
                      <Clock className="h-4 w-4 mr-2" />
                      Timeline
                    </TabsTrigger>
                  </TabsList>

                  {/* Calendar View */}
                  <TabsContent value="calendar">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                          <p className="text-muted-foreground mt-4">Carregando agenda...</p>
                        </div>
                      </div>
                    ) : (
                      <LessonCalendar
                        lessons={lessons}
                        instructor={selectedInstructor}
                        onLessonClick={(lesson) => {
                          setSelectedLesson(lesson)
                          setIsDetailsModalOpen(true)
                        }}
                      />
                    )}
                  </TabsContent>

                  {/* Timeline View */}
                  <TabsContent value="timeline">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Selecione uma data
                        </label>
                        <input
                          type="date"
                          value={timelineDate.toISOString().split('T')[0]}
                          onChange={(e) => setTimelineDate(new Date(e.target.value))}
                          className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>

                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                            <p className="text-muted-foreground mt-4">Carregando timeline...</p>
                          </div>
                        </div>
                      ) : (
                        <AvailabilityTimeline
                          lessons={lessons}
                          selectedDate={timelineDate}
                          instructor={selectedInstructor}
                          instructorId={parseInt(selectedInstructorId)}
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <CalendarClock className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum instrutor selecionado</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Selecione um instrutor acima para visualizar sua agenda completa e disponibilidade
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      <LessonDetailsModal
        lesson={selectedLesson}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />
    </div>
  )
}
