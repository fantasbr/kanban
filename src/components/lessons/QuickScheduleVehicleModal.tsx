import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, User, Car as CarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useVehicles } from '@/hooks/useVehicles'
import type { Instructor, Client, Contract, ContractItem } from '@/types/database'

interface ContractItemWithCatalog extends Omit<ContractItem, 'catalog_items'> {
  catalog_items: {
    vehicle_category?: string
    is_lesson?: boolean
  } | null | undefined
  used_quantity?: number
}

interface QuickScheduleVehicleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instructor: Instructor
  client: Client
  contract: Contract
  contractItems: ContractItemWithCatalog[]
  date: Date
  time: string
  onConfirm: (vehicleId: number, contractItemId: number) => Promise<void>
}

export function QuickScheduleVehicleModal({
  open,
  onOpenChange,
  instructor,
  client,
  contractItems,
  date,
  time,
  onConfirm,
}: QuickScheduleVehicleModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { vehicles } = useVehicles()

  // Map CNH categories to vehicle categories
  const cnhToVehicleCategory: Record<string, string[]> = {
    'A': ['motorcycle'],
    'B': ['car'],
    'C': ['car', 'truck'],
    'D': ['car', 'truck', 'bus'],
    'E': ['car', 'truck', 'bus'],
    'AB': ['car', 'motorcycle'],
    'AC': ['car', 'motorcycle', 'truck'],
    'AD': ['car', 'motorcycle', 'truck', 'bus'],
    'AE': ['car', 'motorcycle', 'truck', 'bus'],
  }

  // Filter contract items based on instructor's CNH
  const compatibleContractItems = contractItems.filter((item) => {
    const vehicleCategory = item.catalog_items?.vehicle_category
    const allowedCategories = cnhToVehicleCategory[instructor.cnh_category] || []
    return vehicleCategory && allowedCategories.includes(vehicleCategory)
  })

  // Group by category and get unique categories
  const uniqueCategories = Array.from(
    new Set(compatibleContractItems.map((item: ContractItemWithCatalog) => item.catalog_items?.vehicle_category))
  ).map(category => {
    // Get the first item of each category (with most remaining lessons)
    const itemsOfCategory = compatibleContractItems.filter(
      (item: ContractItemWithCatalog) => item.catalog_items?.vehicle_category === category
    )
    // Sort by remaining lessons (quantity - used_quantity) descending
    itemsOfCategory.sort((a: ContractItemWithCatalog, b: ContractItemWithCatalog) => {
      const remainingA = a.quantity - (a.used_quantity || 0)
      const remainingB = b.quantity - (b.used_quantity || 0)
      return remainingB - remainingA
    })
    return itemsOfCategory[0]
  }).filter(Boolean)

  // Get selected contract item
  const selectedContractItem = uniqueCategories.find(item => item.id.toString() === selectedCategoryId)

  // Filter compatible vehicles based on selected category
  const compatibleVehicles = selectedContractItem
    ? vehicles.filter(
        (vehicle) =>
          vehicle.category === (selectedContractItem as ContractItemWithCatalog).catalog_items?.vehicle_category &&
          vehicle.is_active
      )
    : []

  const handleConfirm = async () => {
    if (!selectedVehicleId || !selectedCategoryId) return

    setIsSubmitting(true)
    try {
      await onConfirm(parseInt(selectedVehicleId), parseInt(selectedCategoryId))
      onOpenChange(false)
      setSelectedCategoryId('')
      setSelectedVehicleId('')
    } catch (error) {
      console.error('Error scheduling lesson:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedCategoryId('')
    setSelectedVehicleId('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Aula Rápida</DialogTitle>
          <DialogDescription>
            Selecione o veículo para confirmar o agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lesson Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{client.full_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Instrutor: {instructor.full_name}</span>
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={selectedCategoryId} onValueChange={(value) => {
              setSelectedCategoryId(value)
              setSelectedVehicleId('')  // Reset vehicle when category changes
            }}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione a categoria..." />
              </SelectTrigger>
              <SelectContent>
                {compatibleContractItems.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Nenhuma categoria compatível com CNH {instructor.cnh_category}
                  </SelectItem>
                ) : (
                  uniqueCategories.map((item: ContractItemWithCatalog) => (
                    <SelectItem key={item.id} value={item.id.toString()}>
                      {item.catalog_items?.vehicle_category === 'car' && '🚗 CARRO'}
                      {item.catalog_items?.vehicle_category === 'motorcycle' && '🏍️ MOTO'}
                      {item.catalog_items?.vehicle_category === 'truck' && '🚚 CAMINHÃO'}
                      {item.catalog_items?.vehicle_category === 'bus' && '🚌 ÔNIBUS'}
                      {!['car', 'motorcycle', 'truck', 'bus'].includes(item.catalog_items?.vehicle_category || '') && item.catalog_items?.vehicle_category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">Veículo *</Label>
            {!selectedCategoryId ? (
              <div className="text-sm text-muted-foreground">
                Selecione uma categoria primeiro
              </div>
            ) : compatibleVehicles.length === 0 ? (
              <div className="text-sm text-destructive">
                Nenhum veículo compatível disponível para esta categoria
              </div>
            ) : (
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Selecione o veículo..." />
                </SelectTrigger>
                <SelectContent>
                  {compatibleVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4" />
                        <span>
                          {vehicle.plate} - {vehicle.model}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedVehicleId || !selectedCategoryId || isSubmitting || compatibleVehicles.length === 0}
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
