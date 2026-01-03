import { useState } from 'react'
import { Plus, Car, Edit, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useVehicles } from '@/hooks/useVehicles'
import { useCompanies } from '@/hooks/useERPConfig'
import type { Vehicle, VehicleTransmission, VehicleCategory } from '@/types/database'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

const TRANSMISSION_LABELS: Record<VehicleTransmission, string> = {
  manual: 'Manual',
  automatic: 'Automático',
}

const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  car: 'Carro',
  motorcycle: 'Moto',
  bus: 'Ônibus',
  truck: 'Caminhão',
}

const CATEGORY_COLORS: Record<VehicleCategory, string> = {
  car: 'bg-blue-100 text-blue-700',
  motorcycle: 'bg-purple-100 text-purple-700',
  bus: 'bg-green-100 text-green-700',
  truck: 'bg-orange-100 text-orange-700',
}

export function Vehicles() {
  const { vehicles, createVehicle, updateVehicle, deleteVehicle, isLoading, isCreating, isUpdating } = useVehicles()
  const { activeCompanies } = useCompanies()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [transmissionFilter, setTransmissionFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    plate: '',
    renavam: '',
    brand: '',
    model: '',
    transmission: 'manual' as VehicleTransmission,
    category: 'car' as VehicleCategory,
    photo_url: '',
    lesson_price: '',
  })

  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([])

  const handleOpenDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle)
      setFormData({
        plate: vehicle.plate,
        renavam: vehicle.renavam,
        brand: vehicle.brand,
        model: vehicle.model,
        transmission: vehicle.transmission,
        category: vehicle.category,
        photo_url: vehicle.photo_url || '',
        lesson_price: vehicle.lesson_price.toString(),
      })
      setSelectedCompanies(vehicle.companies?.map(c => c.id) || [])
    } else {
      setEditingVehicle(null)
      setFormData({
        plate: '',
        renavam: '',
        brand: '',
        model: '',
        transmission: 'manual',
        category: 'car',
        photo_url: '',
        lesson_price: '',
      })
      setSelectedCompanies([])
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedCompanies.length === 0) {
      toast.error('Selecione pelo menos uma empresa')
      return
    }

    try {
      const vehicleData = {
        plate: formData.plate.toUpperCase(),
        renavam: formData.renavam,
        brand: formData.brand,
        model: formData.model,
        transmission: formData.transmission,
        category: formData.category,
        photo_url: formData.photo_url || null,
        lesson_price: parseFloat(formData.lesson_price),
        is_active: true,
      }

      if (editingVehicle) {
        await updateVehicle({
          id: editingVehicle.id,
          vehicle: vehicleData,
          companyIds: selectedCompanies,
        })
        toast.success('Veículo atualizado com sucesso!')
      } else {
        await createVehicle({
          vehicle: vehicleData,
          companyIds: selectedCompanies,
        })
        toast.success('Veículo cadastrado com sucesso!')
      }

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Error saving vehicle:', error)
      toast.error('Erro ao salvar veículo')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        await deleteVehicle(id)
        toast.success('Veículo excluído com sucesso!')
      } catch (error) {
        console.error('Error deleting vehicle:', error)
        toast.error('Erro ao excluir veículo')
      }
    }
  }

  const toggleCompany = (companyId: number) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  // Filtered vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch =
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || vehicle.category === categoryFilter
    const matchesTransmission = transmissionFilter === 'all' || vehicle.transmission === transmissionFilter

    return matchesSearch && matchesCategory && matchesTransmission
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando veículos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Veículos</h1>
          <p className="text-slate-500 mt-1">Gerencie os veículos da auto escola</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="search"
                placeholder="Placa, modelo ou marca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="categoryFilter">Categoria</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="categoryFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="car">Carro</SelectItem>
                <SelectItem value="motorcycle">Moto</SelectItem>
                <SelectItem value="bus">Ônibus</SelectItem>
                <SelectItem value="truck">Caminhão</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transmission Filter */}
          <div className="space-y-2">
            <Label htmlFor="transmissionFilter">Transmissão</Label>
            <Select value={transmissionFilter} onValueChange={setTransmissionFilter}>
              <SelectTrigger id="transmissionFilter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results Count */}
      {filteredVehicles.length !== vehicles.length && (
        <div className="text-sm text-slate-500">
          Mostrando {filteredVehicles.length} de {vehicles.length} veículos
        </div>
      )}

      {/* Vehicles Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Car className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-slate-500">
            {vehicles.length === 0 ? 'Nenhum veículo cadastrado' : 'Nenhum veículo encontrado'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{vehicle.plate}</h3>
                    <p className="text-sm text-slate-600">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(vehicle)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={CATEGORY_COLORS[vehicle.category]}>
                    {CATEGORY_LABELS[vehicle.category]}
                  </Badge>
                  <Badge variant="outline">
                    {TRANSMISSION_LABELS[vehicle.transmission]}
                  </Badge>
                </div>

                {/* Companies */}
                {vehicle.companies && vehicle.companies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {vehicle.companies.map(company => (
                      <Badge key={company.id} variant="secondary" className="text-xs">
                        {company.name}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Price */}
                <div className="pt-2 border-t">
                  <p className="text-sm text-slate-500">Valor da aula</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(vehicle.lesson_price)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Editar Veículo' : 'Novo Veículo'}</DialogTitle>
              <DialogDescription>
                Preencha os dados do veículo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Plate */}
                <div className="space-y-2">
                  <Label htmlFor="plate">Placa *</Label>
                  <Input
                    id="plate"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    placeholder="ABC-1234"
                    maxLength={8}
                    required
                  />
                </div>

                {/* Renavam */}
                <div className="space-y-2">
                  <Label htmlFor="renavam">Renavam *</Label>
                  <Input
                    id="renavam"
                    value={formData.renavam}
                    onChange={(e) => setFormData({ ...formData, renavam: e.target.value })}
                    placeholder="00000000000"
                    maxLength={11}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Brand */}
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Ex: Volkswagen"
                    required
                  />
                </div>

                {/* Model */}
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="Ex: Gol"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Transmission */}
                <div className="space-y-2">
                  <Label htmlFor="transmission">Transmissão *</Label>
                  <Select
                    value={formData.transmission}
                    onValueChange={(value: VehicleTransmission) =>
                      setFormData({ ...formData, transmission: value })
                    }
                  >
                    <SelectTrigger id="transmission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: VehicleCategory) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Carro</SelectItem>
                      <SelectItem value="motorcycle">Moto</SelectItem>
                      <SelectItem value="bus">Ônibus</SelectItem>
                      <SelectItem value="truck">Caminhão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lesson Price */}
              <div className="space-y-2">
                <Label htmlFor="lesson_price">Valor da Aula (R$) *</Label>
                <Input
                  id="lesson_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.lesson_price}
                  onChange={(e) => setFormData({ ...formData, lesson_price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Photo URL */}
              <div className="space-y-2">
                <Label htmlFor="photo_url">URL da Foto</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              {/* Companies */}
              <div className="space-y-2">
                <Label>Empresas * (selecione pelo menos uma)</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  {activeCompanies.map(company => (
                    <div key={company.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`company-${company.id}`}
                        checked={selectedCompanies.includes(company.id)}
                        onCheckedChange={() => toggleCompany(company.id)}
                      />
                      <label
                        htmlFor={`company-${company.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {company.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating}>
                {isCreating || isUpdating ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
