
import { useState } from 'react'
import { Save, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useInstructorSettings } from '@/hooks/useInstructorSettings'
import { useVehicles } from '@/hooks/useVehicles'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PreferencesEditorProps {
  instructorId: number
}

export function PreferencesEditor({ instructorId }: PreferencesEditorProps) {
  const { preferences, isLoading, updatePreferences } = useInstructorSettings(instructorId)
  const { vehicles } = useVehicles()
  
  const [formData, setFormData] = useState({
    max_lessons_per_day: preferences?.max_lessons_per_day || 8,
    break_duration: preferences?.break_duration || 15,
    preferred_vehicles: preferences?.preferred_vehicles || [],
  })

  // State initialized from props/hook (reset via key in parent)



  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updatePreferences.mutateAsync(formData)
      toast.success('Preferências atualizadas')
    } catch {
      toast.error('Erro ao atualizar preferências')
    }
  }

  const toggleVehicle = (vehicleId: number) => {
    setFormData(prev => ({
      ...prev,
      preferred_vehicles: prev.preferred_vehicles.includes(vehicleId)
        ? prev.preferred_vehicles.filter(id => id !== vehicleId)
        : [...prev.preferred_vehicles, vehicleId]
    }))
  }

  if (isLoading) {
    return <div className="text-center py-4">Carregando preferências...</div>
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h3 className="font-semibold">Preferências Avançadas</h3>
        <p className="text-sm text-muted-foreground">
          Configure limites e preferências de trabalho do instrutor
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_lessons">Máximo de Aulas por Dia</Label>
            <Input
              id="max_lessons"
              type="number"
              min="1"
              max="15"
              value={formData.max_lessons_per_day}
              onChange={(e) => setFormData({ ...formData, max_lessons_per_day: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="break_duration">Intervalo Mínimo (minutos)</Label>
            <Select 
                value={formData.break_duration.toString()} 
                onValueChange={(v) => setFormData({ ...formData, break_duration: parseInt(v) })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="0">Sem intervalo</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Veículos Preferenciais</Label>
          <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2 cursor-pointer">
            {vehicles.map((vehicle) => (
              <div 
                key={vehicle.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  formData.preferred_vehicles.includes(vehicle.id) 
                    ? 'border-primary bg-primary/5 shadow-sm' 
                    : 'border-transparent hover:bg-slate-50 border-border/50'
                }`}
                onClick={() => toggleVehicle(vehicle.id)}
              >
                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  formData.preferred_vehicles.includes(vehicle.id)
                    ? 'bg-primary border-primary'
                    : 'border-input'
                }`}>
                  {formData.preferred_vehicles.includes(vehicle.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                    <Label 
                      htmlFor={`vehicle-${vehicle.id}`} 
                      className={`text-sm font-medium cursor-pointer ${
                        formData.preferred_vehicles.includes(vehicle.id) ? 'text-primary' : ''
                      }`}
                    >
                      {vehicle.brand} {vehicle.model}
                    </Label>
                    <div className='flex items-center gap-2'>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                          {vehicle.plate}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal">{vehicle.category}</Badge>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">{vehicle.transmission}</Badge>
                    </div>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Nenhum veículo cadastrado</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Esses veículos serão sugeridos primeiro ao agendar aulas para este instrutor.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit">
          <Save className="h-4 w-4 mr-2" />
          Salvar Preferências
        </Button>
      </div>
    </form>
  )
}
