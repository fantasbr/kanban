import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLessons } from '@/hooks/useLessons'
import { useClients } from '@/hooks/useClients'
import { useContracts } from '@/hooks/useContracts'
import { useInstructors } from '@/hooks/useInstructors'
import { useVehicles } from '@/hooks/useVehicles'
import { Loader2, Zap, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { ContractItem } from '@/types/database'

interface ExtendedContractItem extends ContractItem {
  available_credits: number
}

interface LessonCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefilledClientId?: number
  prefilledContractId?: number
  prefilledContractItemId?: number
}

export function LessonCreateModal({ 
  open, 
  onOpenChange,
  prefilledClientId,
  prefilledContractId,
  prefilledContractItemId
}: LessonCreateModalProps) {
  const { createLesson, isCreating } = useLessons()
  const { clients } = useClients()
  const { contracts } = useContracts()
  const { instructors } = useInstructors()
  const { vehicles } = useVehicles()
  const navigate = useNavigate()

  const [selectedClient, setSelectedClient] = useState(prefilledClientId?.toString() || '')
  const [selectedContract, setSelectedContract] = useState(prefilledContractId?.toString() || '')
  const [selectedContractItem, setSelectedContractItem] = useState(prefilledContractItemId?.toString() || '')
  const [schedulingMethod, setSchedulingMethod] = useState<'quick' | 'agenda' | null>(null)
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [startTime, setStartTime] = useState('')
  // Duration state removed as it was unused
  const [topic, setTopic] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  // Derived data
  // clientContracts refactored to useMemo below
  const [contractItems, setContractItems] = useState<ExtendedContractItem[]>([])
  const [availableCredits, setAvailableCredits] = useState<number>(0)

  // Filter contracts by selected client (only active contracts)
  // Filter contracts by selected client (only active contracts)
  const clientContracts = useMemo(() => { // Changed to useMemo
    if (selectedClient) {
      return contracts.filter(
        c => c.client_id === parseInt(selectedClient) && c.status === 'active'
      )
    }
    return []
  }, [selectedClient, contracts])

  // Reset contract selection when client changes (effect is okay here for side-effect reset)
  // Reset contract selection logic is now in handleClientChange (onValueChange)

  // Load contract items when contract is selected (with catalog info)
  useEffect(() => {
    if (selectedContract) {
      const loadContractItems = async () => {
        const { data, error } = await supabase
          .from('erp_contract_items')
          .select(`
            *,
            catalog_items:erp_catalog_items(is_lesson, vehicle_category)
          `)
          .eq('contract_id', parseInt(selectedContract))

        if (!error && data) {
          // Fetch available credits for each item
          const itemsWithCredits = await Promise.all(
            data.map(async (item: ContractItem) => {
              const { data: credits } = await supabase
                .rpc('get_available_credits', {
                  p_contract_item_id: item.id
                } as never)
              return {
                ...item,
                available_credits: credits || 0
              } as ExtendedContractItem
            })
          )
          setContractItems(itemsWithCredits)
        }

        // Only clear contract item selection if it's not prefilled
        if (!prefilledContractItemId) {
          setSelectedContractItem('')
        }
      }
      loadContractItems()
    }
  }, [selectedContract, prefilledContractItemId])

  // Auto-select contract item moved to handleVehicleChange


  // Load available credits when contract item is selected
  useEffect(() => {
    if (selectedContractItem) {
      const loadCredits = async () => {
        const { data } = await supabase
          .rpc('get_available_credits', {
            p_contract_item_id: parseInt(selectedContractItem)
          } as never)
        setAvailableCredits(data || 0)
      }
      loadCredits()
    }
  }, [selectedContractItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContractItem || !selectedInstructor || !selectedVehicle || !lessonDate || !startTime) {
      return
    }

    try {
      await createLesson({
        contract_item_id: parseInt(selectedContractItem),
        instructor_id: parseInt(selectedInstructor),
        vehicle_id: parseInt(selectedVehicle),
        lesson_date: lessonDate,
        start_time: startTime,
        topic: topic || undefined,
        location: location || undefined,
        notes: notes || undefined,
      })

      // Reset form
      setSelectedClient('')
      setSelectedContract('')
      setSelectedContractItem('')
      setSchedulingMethod(null)
      setSelectedInstructor('')
      setSelectedVehicle('')
      setLessonDate('')
      setStartTime('')
      setTopic('')
      setLocation('')
      setNotes('')
      setContractItems([])
      setAvailableCredits(0)

      onOpenChange(false)
    } catch (error) {
      console.error('Error creating lesson:', error)
    }
  }

  const handleOpenAgenda = () => {
    const params = new URLSearchParams({
      client: selectedClient,
      contract: selectedContract,
      item: selectedContractItem,
    })
    navigate(`/erp/agenda-instrutores?${params.toString()}`)
    onOpenChange(false)
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Nova Aula</DialogTitle>
          <DialogDescription>
            Selecione o cliente, contrato e escolha como deseja agendar a aula
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Contract Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </div>
              <h3 className="font-semibold">Selecionar Contrato</h3>
            </div>

            {prefilledClientId && prefilledContractId && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>✓</strong> Cliente e contrato já selecionados automaticamente
                </p>
              </div>
            )}

            <div className="grid gap-4">


              <div>
                <Label htmlFor="client">Cliente *</Label>
                <Select 
                  value={selectedClient} 
                  onValueChange={(val) => {
                    setSelectedClient(val)
                    // Reset contract when client changes
                    if (selectedContract !== '') setSelectedContract('')
                    if (selectedContractItem !== '') setSelectedContractItem('')
                    setContractItems([])
                    setAvailableCredits(0)
                  }}
                  disabled={!!prefilledClientId}
                >
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="contract">Contrato *</Label>
                <Select 
                  value={selectedContract} 
                  onValueChange={setSelectedContract}
                  disabled={!selectedClient || !!prefilledContractId}
                >
                  <SelectTrigger id="contract">
                    <SelectValue placeholder="Selecione o contrato" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientContracts.map((contract) => (
                      <SelectItem key={contract.id} value={contract.id.toString()}>
                        Contrato #{contract.contract_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Contract Items - Visual Credit Cards */}
              {selectedContract && contractItems.length > 0 && (
                <div>
                  <Label>Selecione o Pacote de Aulas *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Escolha qual pacote usar para esta aula
                  </p>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {contractItems
                      .filter((item) => {
                        // Only show items with available credits
                        const credits = item.available_credits || 0
                        return credits > 0
                      })
                      .map((item) => {
                        const isSelected = selectedContractItem === item.id.toString()
                        const credits = item.available_credits || 0
                        const total = item.quantity || 0
                        const percentage = total > 0 ? (credits / total) * 100 : 0
                        
                        return (
                          <Card
                            key={item.id}
                            className={`cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 shadow-md'
                                : 'hover:border-primary/50 hover:shadow-sm'
                            }`}
                            onClick={() => setSelectedContractItem(item.id.toString())}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    isSelected ? 'border-primary bg-primary' : 'border-input'
                                  }`}>
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                                    )}
                                  </div>
                                  <span className="font-medium">{item.description}</span>
                                </div>
                                <Badge variant={credits > 3 ? 'default' : credits > 0 ? 'secondary' : 'destructive'}>
                                  {credits} {credits === 1 ? 'aula' : 'aulas'}
                                </Badge>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>{credits} disponíveis</span>
                                  <span>{total} total</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      percentage > 50 ? 'bg-green-500' :
                                      percentage > 20 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                  
                  {contractItems.filter((item) => (item.available_credits || 0) > 0).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum pacote com créditos disponíveis</p>
                      <p className="text-sm mt-1">Compre aulas extras para continuar</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Step 1.5: Choose Scheduling Method (only show if contract item selected and no method chosen) */}
          {selectedContractItem && availableCredits > 0 && !schedulingMethod && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  2
                </div>
                <h3 className="font-semibold">Como deseja agendar?</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all" 
                  onClick={() => setSchedulingMethod('quick')}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Agendamento Rápido</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Preencha data e horário manualmente
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Ideal para agendamentos simples e rápidos
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
                  onClick={handleOpenAgenda}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Visualizar Agenda</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Veja disponibilidade no calendário
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Veja horários disponíveis e evite conflitos
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time (only show if quick method selected) */}
          {schedulingMethod === 'quick' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    3
                  </div>
                  <h3 className="font-semibold">Data e Horário</h3>
                </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="date">Data da Aula *</Label>
                <Input
                  id="date"
                  type="date"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  min={today}
                  required
                />
              </div>

              <div>
                <Label htmlFor="time">Horário de Início *</Label>
                <Input
                  id="time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  O horário de término será calculado automaticamente
                </p>
                </div>
              </div>

              {/* Step 3: Instructor & Vehicle */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                    4
                  </div>
                  <h3 className="font-semibold">Instrutor e Veículo</h3>
                </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="instructor">Instrutor *</Label>
                <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
                  <SelectTrigger id="instructor">
                    <SelectValue placeholder="Selecione o instrutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.filter(i => i.is_active).map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id.toString()}>
                        {instructor.full_name} (CNH {instructor.cnh_category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="vehicle">Veículo *</Label>
                <Select value={selectedVehicle} onValueChange={(val) => {
                  setSelectedVehicle(val)
                  // Auto-select contract item based on vehicle
                  if (contractItems.length > 0 && !prefilledContractItemId) {
                    const vehicle = vehicles.find(v => v.id === parseInt(val))
                    if (vehicle) {
                      const matchingItem = contractItems.find((item) => 
                        item.catalog_items?.is_lesson === true &&
                        item.catalog_items?.vehicle_category === vehicle.category
                      )
                      if (matchingItem) {
                        setSelectedContractItem(matchingItem.id.toString())
                      }
                    }
                  }
                }}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Selecione o veículo" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter(v => v.is_active).map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.plate} - {vehicle.model} ({vehicle.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Step 4: Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                4
              </div>
              <h3 className="font-semibold">Detalhes (Opcional)</h3>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="topic">Tópico da Aula</Label>
                <Input
                  id="topic"
                  placeholder="Ex: Baliza, Estacionamento, Baliza em L..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location">Local de Encontro</Label>
                <Input
                  id="location"
                  placeholder="Ex: Auto Escola, Endereço do aluno..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre a aula..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
                </div>
              </div>

              {/* Step 4: Details (Optional) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-semibold">
                    5
                  </div>
                  <h3 className="font-semibold">Detalhes (Opcional)</h3>
                </div>

                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="topic">Tópico da Aula</Label>
                    <Input
                      id="topic"
                      placeholder="Ex: Baliza, Estacionamento, Baliza em L..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Local de Encontro</Label>
                    <Input
                      id="location"
                      placeholder="Ex: Auto Escola, Endereço do aluno..."
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações</Label>
                    <Textarea
                      id="notes"
                      placeholder="Informações adicionais sobre a aula..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isCreating ||
                    !selectedContractItem ||
                    !selectedInstructor ||
                    !selectedVehicle ||
                    !lessonDate ||
                    !startTime ||
                    availableCredits <= 0
                  }
                >
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Agendar Aula
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
