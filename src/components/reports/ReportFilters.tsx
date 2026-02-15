
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ReportFiltersProps {
  startDate: Date
  endDate: Date
  instructorId: string | null
  vehicleId: string | null
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  onInstructorChange: (id: string) => void
  onVehicleChange: (id: string) => void
  showAdvancedFilters?: boolean
}

export function ReportFilters({
  startDate,
  endDate,
  instructorId,
  vehicleId,
  onStartDateChange,
  onEndDateChange,
  onInstructorChange,
  onVehicleChange,
  showAdvancedFilters = true
}: ReportFiltersProps) {
  
  // Fetch Instructors
  const { data: instructors } = useQuery({
    queryKey: ['instructors-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('erp_instructors')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
      return (data as { id: number; full_name: string }[]) || []
    }
  })

  // Fetch Vehicles
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('erp_vehicles')
        .select('id, plate, model')
        .eq('is_active', true)
        .order('model')
      return (data as { id: number; plate: string; model: string }[]) || []
    }
  })

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end bg-card p-4 rounded-lg border shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {/* Start Date */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Data Inicial</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: ptBR }) : <span>Selecione</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={onStartDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Data Final</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP", { locale: ptBR }) : <span>Selecione</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={onEndDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {showAdvancedFilters && (
          <>
            {/* Instructor Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Instrutor</span>
              <Select value={instructorId || "all"} onValueChange={(val) => onInstructorChange(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Instrutores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Instrutores</SelectItem>
                  {instructors?.map((instructor) => (
                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                      {instructor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vehicle Filter */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Veículo</span>
              <Select value={vehicleId || "all"} onValueChange={(val) => onVehicleChange(val === "all" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Veículos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Veículos</SelectItem>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.model} ({vehicle.plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
