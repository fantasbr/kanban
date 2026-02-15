import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useVehicles } from '@/hooks/useVehicles'
import { useLessons } from '@/hooks/useLessons'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, Clock, User, Car, MapPin, FileText, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Instructor, Client, Contract, ContractItem, CreateLessonFormData } from '@/types/database'
import type { MutationError } from '@/types/supabase-helpers'

interface QuickScheduleConfirmationProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  selectedTime: string
  instructor: Instructor
  client: Client
  contract: Contract
  contractItem: ContractItem
  onSuccess?: () => void
}

export function QuickScheduleConfirmation({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  instructor,
  client,
  contract,
  contractItem,
  onSuccess
}: QuickScheduleConfirmationProps) {
  const { vehicles } = useVehicles()
  const { createLesson, isCreating } = useLessons()
  
  const [formData, setFormData] = useState({
    vehicle_id: '',
    topic: '',
    location: 'Auto Escola - Sede',
    notes: '',
  })

  // Filter vehicles compatible with instructor
  const compatibleVehicles = vehicles.filter(v => 
    v.is_active && 
    (!instructor.companies || instructor.companies.length === 0 || 
     v.companies?.some(vc => instructor.companies?.some(ic => ic.id === vc.id)))
  )

  // Pre-select first vehicle if available
  useState(() => {
    if (compatibleVehicles.length > 0 && !formData.vehicle_id) {
      setFormData(prev => ({ ...prev, vehicle_id: compatibleVehicles[0].id.toString() }))
    }
  })

  const handleConfirm = async () => {
    if (!formData.vehicle_id) {
      toast.error('Selecione um veículo')
      return
    }

    try {
      await createLesson({
        contract_item_id: contractItem.id,
        instructor_id: instructor.id,
        vehicle_id: parseInt(formData.vehicle_id),
        lesson_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        topic: formData.topic || undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      } as CreateLessonFormData)

      toast.success('Aula agendada com sucesso!')
      onOpenChange(false)
      onSuccess?.()
      
      // Reset form
      setFormData({
        vehicle_id: compatibleVehicles[0]?.id.toString() || '',
        topic: '',
        location: 'Auto Escola - Sede',
        notes: '',
      })
    } catch (error) {
      const err = error as MutationError
      toast.error(err.message || 'Erro ao agendar aula')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Confirmar Agendamento
          </DialogTitle>
          <DialogDescription>
            Revise os detalhes e confirme o agendamento da aula
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <Alert>
            <AlertDescription>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{client.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Contrato: {contract.contract_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(selectedDate, 'EEEE', { locale: ptBR })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{selectedTime}</div>
                    <div className="text-xs text-muted-foreground">
                      Duração: {instructor.lesson_duration_minutes} min
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{instructor.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      CNH {instructor.cnh_category}
                    </div>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Veículo */}
          <div className="space-y-2">
            <Label htmlFor="vehicle" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Veículo *
            </Label>
            <Select 
              value={formData.vehicle_id} 
              onValueChange={(v) => setFormData({...formData, vehicle_id: v})}
            >
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Selecione o veículo" />
              </SelectTrigger>
              <SelectContent>
                {compatibleVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.brand} {vehicle.model} - {vehicle.plate} ({vehicle.transmission})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campos Opcionais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Tópico (opcional)
              </Label>
              <Input
                id="topic"
                placeholder="Ex: Baliza, Estacionamento..."
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Local (opcional)
              </Label>
              <Input
                id="location"
                placeholder="Ex: Auto Escola - Sede"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre a aula..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={isCreating || !formData.vehicle_id}
          >
            {isCreating ? 'Agendando...' : 'Confirmar Agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
