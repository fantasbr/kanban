import { useState } from 'react'
import { Plus, Trash2, Edit, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useContractItemsCatalog } from '@/hooks/useContractItemsCatalog'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

export function ContractItemsCatalogManager() {
  const { catalogItems, createCatalogItem, updateCatalogItem, deleteCatalogItem, isLoading, isCreating, isDeleting } = useContractItemsCatalog()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_unit_price: '0',
    unit_type: 'unidade',
    is_lesson: false,
    vehicle_category: null as 'car' | 'motorcycle' | 'bus' | 'truck' | null,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      default_unit_price: '0',
      unit_type: 'unidade',
      is_lesson: false,
      vehicle_category: null,
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      await createCatalogItem({
        name: formData.name,
        description: formData.description || null,
        default_unit_price: parseFloat(formData.default_unit_price) || 0,
        unit_type: formData.unit_type,
        is_lesson: formData.is_lesson,
        vehicle_category: formData.vehicle_category,
        is_active: true,
      })

      toast.success('Item criado com sucesso!')
      setIsCreateModalOpen(false)
      resetForm()
    } catch (error: unknown) {
      console.error('Erro ao criar item:', error)
      toast.error('Erro ao criar item')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedItem) return

    try {
      await updateCatalogItem({
        id: selectedItem,
        updates: {
          name: formData.name,
          description: formData.description || null,
          default_unit_price: parseFloat(formData.default_unit_price) || 0,
          unit_type: formData.unit_type,
          is_lesson: formData.is_lesson,
          vehicle_category: formData.vehicle_category,
        },
      })

      toast.success('Item atualizado com sucesso!')
      setIsEditModalOpen(false)
      setSelectedItem(null)
      resetForm()
    } catch (error: unknown) {
      console.error('Erro ao atualizar item:', error)
      toast.error('Erro ao atualizar item')
    }
  }

  const handleDelete = async () => {
    if (!selectedItem) return

    try {
      await deleteCatalogItem(selectedItem)
      toast.success('Item excluído com sucesso!')
      setIsDeleteDialogOpen(false)
      setSelectedItem(null)
    } catch (error: unknown) {
      console.error('Erro ao excluir item:', error)
      toast.error('Erro ao excluir item')
    }
  }

  const openEditModal = (item: typeof catalogItems[0]) => {
    setSelectedItem(item.id)
    setFormData({
      name: item.name,
      description: item.description || '',
      default_unit_price: item.default_unit_price.toString(),
      unit_type: item.unit_type,
      is_lesson: item.is_lesson || false,
      vehicle_category: item.vehicle_category || null,
    })
    setIsEditModalOpen(true)
  }

  const openDeleteDialog = (id: number) => {
    setSelectedItem(id)
    setIsDeleteDialogOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando catálogo...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Itens</h2>
          <p className="text-slate-500 mt-1">
            Gerencie os itens/serviços disponíveis para contratos
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </div>

      {/* Lista de Itens */}
      {catalogItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
          <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum item cadastrado</p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {catalogItems.map((item) => (
            <Card key={item.id} className="p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span>Preço Padrão:</span>
                  <span className="font-semibold">{formatCurrency(item.default_unit_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="capitalize">{item.unit_type}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditModal(item)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(item.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Item do Catálogo</DialogTitle>
            <DialogDescription>
              Adicione um novo item/serviço ao catálogo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                placeholder="Ex: Aula de Carro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição opcional"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_unit_price">Preço Padrão (R$)</Label>
                <Input
                  id="default_unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.default_unit_price}
                  onChange={(e) => setFormData({ ...formData, default_unit_price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit_type">Tipo de Unidade</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="aula">Aula</SelectItem>
                    <SelectItem value="hora">Hora</SelectItem>
                    <SelectItem value="serviço">Serviço</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Is Lesson Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_lesson"
                checked={formData.is_lesson}
                onCheckedChange={(checked) => setFormData({ ...formData, is_lesson: checked as boolean, vehicle_category: checked ? formData.vehicle_category : null })}
              />
              <Label htmlFor="is_lesson" className="cursor-pointer">
                Este item é uma aula (requer veículo)
              </Label>
            </div>

            {/* Vehicle Category - Only show if is_lesson */}
            {formData.is_lesson && (
              <div className="space-y-2">
                <Label htmlFor="vehicle_category">Categoria do Veículo *</Label>
                <Select
                  value={formData.vehicle_category || ''}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_category: value as 'car' | 'motorcycle' | 'bus' | 'truck' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">🚗 Carro</SelectItem>
                    <SelectItem value="motorcycle">🏍️ Moto</SelectItem>
                    <SelectItem value="bus">🚌 Ônibus</SelectItem>
                    <SelectItem value="truck">🚚 Caminhão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Criando...' : 'Criar Item'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Item</DialogTitle>
            <DialogDescription>
              Atualize as informações do item
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nome *</Label>
              <Input
                id="edit_name"
                placeholder="Ex: Aula de Carro"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Descrição</Label>
              <Input
                id="edit_description"
                placeholder="Descrição opcional"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_default_unit_price">Preço Padrão (R$)</Label>
                <Input
                  id="edit_default_unit_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.default_unit_price}
                  onChange={(e) => setFormData({ ...formData, default_unit_price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_unit_type">Tipo de Unidade</Label>
                <Select
                  value={formData.unit_type}
                  onValueChange={(value) => setFormData({ ...formData, unit_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="aula">Aula</SelectItem>
                    <SelectItem value="hora">Hora</SelectItem>
                    <SelectItem value="serviço">Serviço</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Is Lesson Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit_is_lesson"
                checked={formData.is_lesson}
                onCheckedChange={(checked) => setFormData({ ...formData, is_lesson: checked as boolean, vehicle_category: checked ? formData.vehicle_category : null })}
              />
              <Label htmlFor="edit_is_lesson" className="cursor-pointer">
                Este item é uma aula (requer veículo)
              </Label>
            </div>

            {/* Vehicle Category - Only show if is_lesson */}
            {formData.is_lesson && (
              <div className="space-y-2">
                <Label htmlFor="edit_vehicle_category">Categoria do Veículo *</Label>
                <Select
                  value={formData.vehicle_category || ''}
                  onValueChange={(value) => setFormData({ ...formData, vehicle_category: value as 'car' | 'motorcycle' | 'bus' | 'truck' })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">🚗 Carro</SelectItem>
                    <SelectItem value="motorcycle">🏍️ Moto</SelectItem>
                    <SelectItem value="bus">🚌 Ônibus</SelectItem>
                    <SelectItem value="truck">🚚 Caminhão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedItem(null)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
