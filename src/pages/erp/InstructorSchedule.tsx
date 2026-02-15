import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { CalendarClock, Info, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useLessons } from '@/hooks/useLessons'
import { useInstructors } from '@/hooks/useInstructors'
import { LessonCalendar } from '@/components/lessons/LessonCalendar'
import { LessonDetailsModal } from '@/components/lessons/LessonDetailsModal'
import { ClientProgressBar } from '@/components/contracts/ClientProgressBar'
import { QuickScheduleVehicleModal } from '@/components/lessons/QuickScheduleVehicleModal'
import { useClients } from '@/hooks/useClients'
import { supabase } from '@/lib/supabase'
import type { Lesson, Client, Contract, ContractItem } from '@/types/database'

interface CategoryMetrics {
  category: string
  displayName: string
  totalLessons: number
  completedLessons: number
  scheduledLessons: number
  availableLessons: number
  percentage: number
}

interface ClientWithContract extends Client {
  contract: Contract
  contractItems: (ContractItemWithCatalog & { used_quantity?: number })[]
  metrics: CategoryMetrics[]
}

interface ContractItemWithCatalog extends Omit<ContractItem, 'catalog_items'> {
  catalog_items: {
    is_lesson?: boolean
    vehicle_category?: string
  } | null
}

interface ClientLesson {
  id: number
  start_time: string
  end_time: string
}

export function InstructorSchedule() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<ClientWithContract | null>(null)
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([])
  const [showContractSelector, setShowContractSelector] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date())
  const [quickScheduleData, setQuickScheduleData] = useState<{
    date: Date
    time: string
  } | null>(null)

  // Query params for pre-selection
  const preselectedClientId = searchParams.get('clientId')
  const preselectedContractId = searchParams.get('contractId')

  const queryClient = useQueryClient()
  const { instructors } = useInstructors()
  const { clientsWithActiveContracts } = useClients()
  const { lessons, isLoading } = useLessons({
    instructor_id: selectedInstructorId ? parseInt(selectedInstructorId) : undefined,
  })

  const selectedInstructor = instructors.find(i => i.id === parseInt(selectedInstructorId))

  // Calculate KPIs for current visible week
  const weekKPIs = useMemo(() => {
    if (!selectedInstructor || !lessons.length) {
      return { available: 0, occupied: 0, completed: 0 }
    }

    // Get week range
    const weekStart = new Date(currentWeekStart)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 7)

    // Filter lessons for current week
    const weekLessons = lessons.filter(lesson => {
      const lessonDate = new Date(lesson.lesson_date)
      return lessonDate >= weekStart && lessonDate < weekEnd
    })

    const occupied = weekLessons.filter(l => l.status === 'scheduled').length
    const completed = weekLessons.filter(l => l.status === 'completed').length

    // Calculate available slots based on instructor's schedule
    let totalWeekSlots = 0
    if (selectedInstructor.weekly_schedule) {
      Object.values(selectedInstructor.weekly_schedule).forEach((daySchedule) => {
        if (daySchedule && daySchedule.start && daySchedule.end) {
          const [startHour, startMin] = daySchedule.start.split(':').map(Number)
          const [endHour, endMin] = daySchedule.end.split(':').map(Number)
          const startMinutes = startHour * 60 + startMin
          const endMinutes = endHour * 60 + endMin
          const dayDuration = endMinutes - startMinutes
          const lessonDuration = selectedInstructor.lesson_duration_minutes || 30
          totalWeekSlots += Math.floor(dayDuration / lessonDuration)
        }
      })
    }

    const available = Math.max(0, totalWeekSlots - weekLessons.length)

    return { available, occupied, completed }
  }, [selectedInstructor, lessons, currentWeekStart])

  // Load pre-selected client and contract
  const loadContractDetails = useCallback(async (client: Client, contract: Contract) => {
    try {
      // 1. Fetch contract items with catalog info
      const { data: itemsRaw, error: itemsError } = await supabase
        .from('erp_contract_items')
        .select(`
          *,
          catalog_items:erp_contract_items_catalog(
            is_lesson,
            vehicle_category
          )
        `)
        .eq('contract_id', contract.id)

      if (itemsError) throw itemsError

      const items = (itemsRaw as unknown as ContractItemWithCatalog[]) || []

      // Filter only lesson items
      const lessonItems = items?.filter((item) => item.catalog_items?.is_lesson === true) || []

      // 2. Fetch lessons for these items
      const itemIds = lessonItems.map((i) => i.id)
      let lessonsData: Lesson[] = []

      if (itemIds.length > 0) {
        const { data, error: lessonsError } = await supabase
          .from('erp_lessons')
          .select('*')
          .in('contract_item_id', itemIds)

        if (lessonsError) throw lessonsError
        lessonsData = (data as unknown as Lesson[]) || []
      }

      // 3. Calculate metrics by category
      const metricsMap = new Map<string, CategoryMetrics>()

      lessonItems.forEach((item) => {
        const category = item.catalog_items?.vehicle_category || 'other'
        
        if (!metricsMap.has(category)) {
          metricsMap.set(category, {
            category,
            displayName: getCategoryDisplayName(category),
            totalLessons: 0,
            completedLessons: 0,
            scheduledLessons: 0,
            availableLessons: 0,
            percentage: 0,
          })
        }

        const metrics = metricsMap.get(category)!
        metrics.totalLessons += item.quantity
      })

      // Count lessons by status
      lessonsData.forEach((lesson) => {
        const item = lessonItems.find((i) => i.id === lesson.contract_item_id)
        if (!item) return

        const category = item.catalog_items?.vehicle_category || 'other'
        const metrics = metricsMap.get(category)
        if (!metrics) return

        if (lesson.status === 'completed') {
          metrics.completedLessons++
        } else if (lesson.status === 'scheduled') {
          metrics.scheduledLessons++
        }
      })

      // Calculate available and percentage
      metricsMap.forEach((metrics) => {
        metrics.availableLessons = metrics.totalLessons - metrics.completedLessons - metrics.scheduledLessons
        metrics.percentage = metrics.totalLessons > 0 
          ? (metrics.completedLessons / metrics.totalLessons) * 100 
          : 0
      })

      // Add used_quantity to each contract item
      const itemsWithUsage = lessonItems.map((item) => {
        const usedCount = lessonsData.filter(
          lesson => lesson.contract_item_id === item.id && lesson.status !== 'cancelled'
        ).length
        
        return {
          ...item,
          used_quantity: usedCount
        }
      })

      setSelectedClient({
        ...client,
        contract,
        contractItems: itemsWithUsage,
        metrics: Array.from(metricsMap.values())
      })
      setShowContractSelector(false)
    } catch (error) {
      console.error('Error loading contract details:', error)
      toast.error('Erro ao carregar detalhes do contrato')
    }
  }, [])

  useEffect(() => {
    if (preselectedClientId && preselectedContractId && !selectedClient) {
      const loadPreselectedClient = async () => {
        const clientId = parseInt(preselectedClientId)
        const contractId = parseInt(preselectedContractId)
        
        // Find client
        const { data: client, error: clientError } = await supabase
          .from('erp_clients')
          .select('*')
          .eq('id', clientId)
          .single()

        if (clientError || !client) {
          toast.error('Cliente não encontrado')
          return
        }

        // Find contract
        const { data: contract, error: contractError } = await supabase
          .from('erp_contracts')
          .select('*')
          .eq('id', contractId)
          .eq('client_id', clientId)
          .single()

        if (contractError || !contract) {
          toast.error('Contrato não encontrado')
          return
        }

        // Load contract details
        await loadContractDetails(client, contract)
      }

      loadPreselectedClient()
    }
  }, [preselectedClientId, preselectedContractId, selectedClient, loadContractDetails])

  const loadClientData = async (clientId: number) => {
    try {
      // 1. Fetch client
      const { data: client, error: clientError } = await supabase
        .from('erp_clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (clientError) throw clientError

      // 2. Fetch active contracts
      const { data: contracts, error: contractError } = await supabase
        .from('erp_contracts')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')

      if (contractError) throw contractError

      if (!contracts || contracts.length === 0) {
        toast.error('Cliente não possui contratos ativos')
        return
      }

      // 3. Auto-select or show selector
      if (contracts.length === 1) {
        await loadContractDetails(client, contracts[0])
      } else {
        setAvailableContracts(contracts)
        setShowContractSelector(true)
      }
    } catch (error) {
      console.error('Error loading client:', error)
      toast.error('Erro ao carregar dados do cliente')
    }
  }



  const handleClientSelect = async (clientData: Client | { id: number } | { client_id: number } | null) => {
    if (!clientData) {
      setSelectedClient(null)
      return
    }

    // Extract client ID from different possible structures
    const clientId = 'id' in clientData ? clientData.id : 'client_id' in clientData ? clientData.client_id : null
    if (clientId) {
      await loadClientData(clientId)
    }
  }

  const handleContractSelect = async (contractId: string) => {
    const contract = availableContracts.find(c => c.id === parseInt(contractId))
    if (contract && selectedClient) {
      await loadContractDetails(selectedClient, contract)
    }
  }

  const handleClearContext = () => {
    navigate('/erp/agenda-instrutores')
    setSelectedClient(null)
    setAvailableContracts([])
    setShowContractSelector(false)
  }

  const handleSlotClick = (date: Date, time: string) => {
    // Validation: client must be selected
    if (!selectedClient) {
      toast.error('Selecione um cliente primeiro para agendar uma aula')
      return
    }

    // Validation: check available credits
    const totalAvailable = selectedClient.metrics.reduce((sum, m) => sum + m.availableLessons, 0)
    if (totalAvailable === 0) {
      toast.error('Cliente não possui créditos disponíveis')
      return
    }

    setQuickScheduleData({ date, time })
    setIsVehicleModalOpen(true)
  }

  const handleVehicleConfirm = async (vehicleId: number, contractItemId: number) => {
    if (!quickScheduleData || !selectedClient || !selectedInstructor) return

    try {
      // Get the selected contract item
      const selectedContractItem = selectedClient.contractItems.find(item => item.id === contractItemId)
      
      if (!selectedContractItem) {
        toast.error('Item de contrato não encontrado')
        return
      }

      // Calculate end time
      const lessonDuration = selectedInstructor.lesson_duration_minutes || 50
      const [hours, minutes] = quickScheduleData.time.split(':').map(Number)
      const endDate = new Date(quickScheduleData.date)
      endDate.setHours(hours, minutes + lessonDuration)
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      // Check available credits
      const totalLessons = selectedContractItem.quantity
      const usedLessons = selectedContractItem.used_quantity || 0
      const availableCredits = totalLessons - usedLessons

      if (availableCredits <= 0) {
        toast.error('Sem créditos disponíveis para esta categoria. Compre mais aulas para continuar.')
        return
      }

      // Check instructor availability (working hours and blocks)
      const { data: availabilityCheckRaw, error: availabilityError } = await supabase
        .rpc('check_instructor_availability', {
          p_instructor_id: selectedInstructor.id,
          p_lesson_date: quickScheduleData.date.toISOString().split('T')[0],
          p_start_time: quickScheduleData.time,
          p_end_time: endTime
        } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      
      const availabilityCheck = (availabilityCheckRaw as unknown as { is_available: boolean; reason?: string }[]) || []

      if (availabilityError) {
        console.error('Error checking availability:', availabilityError)
        toast.error('Erro ao verificar disponibilidade do instrutor')
        return
      }

      if (availabilityCheck && availabilityCheck.length > 0) {
        const availability = availabilityCheck[0]
        if (!availability.is_available) {
          toast.error(`Instrutor não disponível: ${availability.reason}`)
          return
        }
      }

      // Check max lessons per day preference
      const { data: preferences } = await supabase
        .from('erp_instructor_preferences')
        .select('max_lessons_per_day')
        .eq('instructor_id', selectedInstructor.id)
        .single<{ max_lessons_per_day: number }>()

      if (preferences?.max_lessons_per_day) {
        const { count } = await supabase
          .from('erp_lessons')
          .select('*', { count: 'exact', head: true })
          .eq('instructor_id', selectedInstructor.id)
          .eq('lesson_date', quickScheduleData.date.toISOString().split('T')[0])
          .neq('status', 'cancelled')

        if (count !== null && count >= preferences.max_lessons_per_day) {
          toast.error(`Instrutor já atingiu o limite de ${preferences.max_lessons_per_day} aulas por dia`)
          return
        }
      }

      // Check for conflicts (instructor and vehicle)
      const { data: conflictsRaw, error: conflictsError } = await supabase
        .rpc('check_lesson_conflicts', {
          p_lesson_id: null,
          p_instructor_id: selectedInstructor.id,
          p_vehicle_id: vehicleId,
          p_lesson_date: quickScheduleData.date.toISOString().split('T')[0],
          p_start_time: quickScheduleData.time,
          p_end_time: endTime
        } as unknown as never)

      const conflicts = (conflictsRaw as unknown as { has_conflict: boolean; details?: string }[]) || []

      if (conflictsError) {
        console.error('Error checking conflicts:', conflictsError)
        toast.error('Erro ao verificar conflitos de agendamento')
        return
      }

      if (conflicts && conflicts.length > 0) {
        const conflict = conflicts[0]
        toast.error(conflict.details || 'Conflito de agendamento detectado')
        return
      }

      // Check if client already has a lesson at this time
      const { data, error: clientLessonsError } = await supabase
        .from('erp_lessons')
        .select(`
          id,
          start_time,
          end_time,
          contract_items:erp_contract_items!inner(
            contracts:erp_contracts!inner(
              client_id
            )
          )
        `)
        .eq('lesson_date', quickScheduleData.date.toISOString().split('T')[0])
        .eq('contract_items.contracts.client_id', selectedClient.id)
        .neq('status', 'cancelled')
        
      const clientLessons = (data as unknown as ClientLesson[]) || []

      if (clientLessonsError) {
        console.error('Error checking client lessons:', clientLessonsError)
        toast.error('Erro ao verificar aulas do cliente')
        return
      }

      // Check for time overlap
      if (clientLessons && clientLessons.length > 0) {
        // Normalize time format to HH:MM:SS
        const normalizeTime = (time: string) => {
          const parts = time.split(':')
          if (parts.length === 2) {
            return `${parts[0]}:${parts[1]}:00`
          }
          return time
        }

        const normalizedNewStart = normalizeTime(quickScheduleData.time)
        const normalizedNewEnd = normalizeTime(endTime)

        const hasOverlap = clientLessons.some((lesson) => {
          const lessonStart = normalizeTime(lesson.start_time)
          const lessonEnd = normalizeTime(lesson.end_time)
          
          // Check if times overlap (allow consecutive lessons)
          // Overlap occurs when: new lesson starts BEFORE existing ends AND new lesson ends AFTER existing starts
          // Using < and > (not <= and >=) allows consecutive lessons like 10:00-10:30 and 10:30-11:00
          return (
            (normalizedNewStart < lessonEnd && normalizedNewEnd > lessonStart)
          )
        })

        if (hasOverlap) {
          toast.error('Cliente já possui aula agendada neste horário')
          return
        }
      }

      // Create lesson
      const { error } = await supabase
        .from('erp_lessons')
        .insert({
          instructor_id: selectedInstructor.id,
          contract_item_id: contractItemId,
          vehicle_id: vehicleId,
          lesson_date: quickScheduleData.date.toISOString().split('T')[0],
          start_time: quickScheduleData.time,
          end_time: endTime,
          duration_minutes: lessonDuration,
          scheduled_by: user.id,
          status: 'scheduled'
        } as unknown as never)

      if (error) throw error

      toast.success('Aula agendada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['lessons'] })
      
      // Reload client data to update metrics
      await loadContractDetails(selectedClient, selectedClient.contract)
      
      setIsVehicleModalOpen(false)
      setQuickScheduleData(null)
    } catch (error) {
      console.error('Error scheduling lesson:', error)
      toast.error('Erro ao agendar aula')
    }
  }

  const totalAvailableCredits = useMemo(() => {
    if (!selectedClient) return 0
    return selectedClient.metrics.reduce((sum, m) => sum + m.availableLessons, 0)
  }, [selectedClient])

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CalendarClock className="h-8 w-8" />
          Agenda de Instrutores
        </h1>
        <p className="text-muted-foreground mt-1">
          Selecione um instrutor e, opcionalmente, um cliente para agendar aulas rapidamente
        </p>
      </div>

      {/* Context Banner (when coming from modal) */}
      {preselectedClientId && selectedClient && (
        <Alert className="border-primary">
          <Info className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Agendando aula para {selectedClient.full_name}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearContext}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            Contrato: {selectedClient.contract.contract_number} - 
            {totalAvailableCredits} créditos disponíveis
          </AlertDescription>
        </Alert>
      )}


      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT COLUMN - Instructor Info */}
        <div className="space-y-4">
          {/* Instructor Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>Instrutor *</Label>
                <Select value={selectedInstructorId} onValueChange={setSelectedInstructorId}>
                  <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          {/* Instructor KPIs */}
          {selectedInstructor && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-4">KPIs da Semana</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">📊 Horários Disponíveis</span>
                    <span className="font-semibold">
                      {weekKPIs.available}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">📅 Horários Ocupados</span>
                    <span className="font-semibold">
                      {weekKPIs.occupied}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">✅ Aulas Concluídas</span>
                    <span className="font-semibold">
                      {weekKPIs.completed}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN - Client Info */}
        <div className="space-y-4">
          {/* Client Selector */}
          {!preselectedClientId && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <Label>Cliente (Opcional)</Label>
                  <Select 
                    value={selectedClient?.id.toString() || ''} 
                    onValueChange={(value) => {
                      if (value === 'clear') {
                        handleClientSelect(null)
                      } else {
                        const client = clientsWithActiveContracts.find(c => c.id.toString() === value)
                        if (client) {
                          handleClientSelect(client)
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedClient && (
                        <SelectItem value="clear" className="text-muted-foreground">
                          Limpar seleção
                        </SelectItem>
                      )}
                      {clientsWithActiveContracts.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{client.full_name}</span>
                            <span className="text-xs text-muted-foreground">CPF: {client.cpf}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contract Selector (if multiple contracts) */}
                {showContractSelector && availableContracts.length > 1 && (
                  <div className="space-y-2 mt-4">
                    <Label>Contrato *</Label>
                    <Select onValueChange={handleContractSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContracts.map((contract) => (
                          <SelectItem key={contract.id} value={contract.id.toString()}>
                            {contract.contract_number} - {contract.contract_types?.name || 'N/A'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Client Progress */}
          {selectedClient && (
            <ClientProgressBar
              client={selectedClient}
              contract={selectedClient.contract}
              metrics={selectedClient.metrics}
              compact={true}
            />
          )}
        </div>
      </div>

      {/* Calendar */}
      {selectedInstructorId ? (
        <Card>
          <CardContent className="pt-6">
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
                enableQuickSchedule={!!selectedClient}
                onSlotClick={handleSlotClick}
                onWeekChange={(weekStart) => setCurrentWeekStart(weekStart)}
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <CalendarClock className="mx-auto h-16 w-16 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum instrutor selecionado</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Selecione um instrutor acima para visualizar sua agenda completa
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <LessonDetailsModal
        lesson={selectedLesson}
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
      />

      {selectedClient && selectedInstructor && quickScheduleData && (
        <QuickScheduleVehicleModal
          open={isVehicleModalOpen}
          onOpenChange={setIsVehicleModalOpen}
          instructor={selectedInstructor}
          client={selectedClient}
          contract={selectedClient.contract}
          contractItems={selectedClient.contractItems}  // Pass all items
          date={quickScheduleData.date}
          time={quickScheduleData.time}
          onConfirm={handleVehicleConfirm}
        />
      )}
    </div>
  )
}

// Helper function
function getCategoryDisplayName(category: string): string {
  const names: Record<string, string> = {
    car: '🚗 CARRO',
    motorcycle: '🏍️ MOTO',
    bus: '🚌 ÔNIBUS',
    truck: '🚚 CAMINHÃO',
    other: '📋 OUTROS'
  }
  return names[category] || category.toUpperCase()
}
