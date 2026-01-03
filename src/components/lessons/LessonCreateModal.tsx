import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useLessons } from '@/hooks/useLessons'
import { useClients } from '@/hooks/useClients'
import { useContracts } from '@/hooks/useContracts'
import { useInstructors } from '@/hooks/useInstructors'
import { useVehicles } from '@/hooks/useVehicles'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

  // Form state
  const [selectedClient, setSelectedClient] = useState('')
  const [selectedContract, setSelectedContract] = useState('')
  const [selectedContractItem, setSelectedContractItem] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [lessonDate, setLessonDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [topic, setTopic] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  // Derived data
  const [clientContracts, setClientContracts] = useState<any[]>([])
  const [contractItems, setContractItems] = useState<any[]>([])
  const [availableCredits, setAvailableCredits] = useState<number>(0)

  // Initialize with prefilled values when modal opens
  useEffect(() => {
    if (open && prefilledClientId) {
      setSelectedClient(prefilledClientId.toString())
    }
    if (open && prefilledContractId) {
      setSelectedContract(prefilledContractId.toString())
    }
    if (open && prefilledContractItemId) {
      setSelectedContractItem(prefilledContractItemId.toString())
    }
  }, [open, prefilledClientId, prefilledContractId, prefilledContractItemId])

  // Filter contracts by selected client (only active contracts)
  useEffect(() => {
    if (selectedClient) {
      const filtered = contracts.filter(
        c => c.client_id === parseInt(selectedClient) && c.status === 'active'
      )
      setClientContracts(filtered)
      // Only clear contract selection if it's not prefilled
      if (!prefilledContractId) {
        setSelectedContract('')
        setSelectedContractItem('')
      }
    } else {
      setClientContracts([])
    }
  }, [selectedClient, contracts, prefilledContractId])

  // Load contract items when contract is selected (with catalog info)
  useEffect(() => {
    if (selectedContract) {
      const loadContractItems = async () => {
        const { data } = await supabase
          .from('erp_contract_items')
          .select(`
            *,
            catalog_items:erp_contract_items_catalog(
              is_lesson,
              vehicle_category
            )
          `)
          .eq('contract_id', parseInt(selectedContract))

        setContractItems(data || [])
        // Only clear contract item selection if it's not prefilled
        if (!prefilledContractItemId) {
          setSelectedContractItem('')
        }
      }
      loadContractItems()
    } else {
      setContractItems([])
    }
  }, [selectedContract, prefilledContractItemId])

  // Auto-select contract item based on vehicle category
  useEffect(() => {
    if (selectedVehicle && contractItems.length > 0 && !prefilledContractItemId) {
      // Find the vehicle to get its category
      const vehicle = vehicles.find(v => v.id === parseInt(selectedVehicle))
      if (vehicle) {
        // Find contract item that matches vehicle category
        const matchingItem = contractItems.find((item: any) => 
          item.catalog_items?.is_lesson === true &&
          item.catalog_items?.vehicle_category === vehicle.category
        )
        
        if (matchingItem) {
          setSelectedContractItem(matchingItem.id.toString())
        }
      }
    }
  }, [selectedVehicle, contractItems, vehicles, prefilledContractItemId])

  // Load available credits when contract item is selected
  useEffect(() => {
    if (selectedContractItem) {
      const loadCredits = async () => {
        const { data } = await supabase
          .rpc('get_available_credits', {
            p_contract_item_id: parseInt(selectedContractItem)
          })
        setAvailableCredits(data || 0)
      }
      loadCredits()
    } else {
      setAvailableCredits(0)
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
      setSelectedInstructor('')
      setSelectedVehicle('')
      setLessonDate('')
      setStartTime('')
      setTopic('')
      setLocation('')
      setNotes('')

      onOpenChange(false)
    } catch (error) {
      console.error('Error creating lesson:', error)
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Nova Aula</DialogTitle>
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
                  onValueChange={setSelectedClient}
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

              <div>
                <Label htmlFor="contractItem">Item do Contrato *</Label>
                <Select 
                  value={selectedContractItem} 
                  onValueChange={setSelectedContractItem}
                  disabled={!selectedContract}
                >
                  <SelectTrigger id="contractItem">
                    <SelectValue placeholder="Selecione o item" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.description} ({item.quantity} aulas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedContractItem && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {availableCredits > 0 ? (
                      <span className="text-green-600 font-medium">
                        ✓ {availableCredits} aula{availableCredits !== 1 ? 's' : ''} disponível{availableCredits !== 1 ? 'is' : ''}
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        ✗ Sem créditos disponíveis
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Date & Time */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
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
          </div>

          {/* Step 3: Instructor & Vehicle */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                3
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
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
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
        </form>
      </DialogContent>
    </Dialog>
  )
}
