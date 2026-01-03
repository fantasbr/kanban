import { useState } from 'react'
import { Plus, Trash2, Eye, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useContractTemplates } from '@/hooks/useContractTemplates'
import { useContractItemsCatalog } from '@/hooks/useContractItemsCatalog'
import { useContractTypes } from '@/hooks/useERPConfig'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

export function ContractTemplatesManager() {
  const { templates, createTemplate, deleteTemplate, isLoading, isCreating, isDeleting, useTemplateWithItems } = useContractTemplates()
  const { catalogItems } = useContractItemsCatalog()
  const { activeContractTypes } = useContractTypes()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<string>('all')

  const [formData, setFormData] = useState({
    contract_type_id: '',
    name: '',
  })

  const [templateItems, setTemplateItems] = useState<Array<{ catalog_item_id: string; quantity: string }>>([
    { catalog_item_id: '', quantity: '1' },
  ])

  const { data: viewingTemplate } = useTemplateWithItems(selectedTemplate && isViewModalOpen ? selectedTemplate : undefined)

  const resetForm = () => {
    setFormData({
      contract_type_id: '',
      name: '',
    })
    setTemplateItems([{ catalog_item_id: '', quantity: '1' }])
  }

  const handleAddItem = () => {
    setTemplateItems([...templateItems, { catalog_item_id: '', quantity: '1' }])
  }

  const handleRemoveItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...templateItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setTemplateItems(newItems)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.contract_type_id || !formData.name) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const validItems = templateItems.filter(item => item.catalog_item_id)
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item ao template')
      return
    }

    try {
      await createTemplate({
        template: {
          contract_type_id: parseInt(formData.contract_type_id),
          name: formData.name,
          is_active: true,
        },
        items: validItems.map((item, index) => ({
          catalog_item_id: parseInt(item.catalog_item_id),
          quantity: parseInt(item.quantity) || 1,
          display_order: index + 1,
        })),
      })

      toast.success('Template criado com sucesso!')
      setIsCreateModalOpen(false)
      resetForm()
    } catch (error: unknown) {
      console.error('Erro ao criar template:', error)
      toast.error('Erro ao criar template')
    }
  }

  const handleDelete = async () => {
    if (!selectedTemplate) return

    try {
      await deleteTemplate(selectedTemplate)
      toast.success('Template excluído com sucesso!')
      setIsDeleteDialogOpen(false)
      setSelectedTemplate(null)
    } catch (error: unknown) {
      console.error('Erro ao excluir template:', error)
      toast.error('Erro ao excluir template')
    }
  }

  const openViewModal = (id: number) => {
    setSelectedTemplate(id)
    setIsViewModalOpen(true)
  }

  const openDeleteDialog = (id: number) => {
    setSelectedTemplate(id)
    setIsDeleteDialogOpen(true)
  }

  // Filtrar templates
  const filteredTemplates = filterType === 'all' 
    ? templates 
    : templates.filter(t => t.contract_type_id.toString() === filterType)

  // Agrupar por tipo de contrato
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const typeId = template.contract_type_id
    if (!acc[typeId]) {
      acc[typeId] = []
    }
    acc[typeId].push(template)
    return acc
  }, {} as Record<number, typeof templates>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando templates...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Templates de Contrato</h2>
          <p className="text-slate-500 mt-1">
            Gerencie sugestões de combinações de itens para contratos
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Filtro */}
      <div className="flex gap-4">
        <div className="w-64">
          <Label>Filtrar por Tipo de Contrato</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {activeContractTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates agrupados por tipo */}
      {Object.keys(groupedTemplates).length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum template cadastrado</p>
          <Button onClick={() => setIsCreateModalOpen(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Criar Primeiro Template
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([typeId, items]) => {
            const contractType = activeContractTypes.find(t => t.id === parseInt(typeId))
            
            return (
              <Card key={typeId} className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  {contractType?.name || 'Tipo Desconhecido'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((template) => (
                    <Card key={template.id} className="p-4 bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900">{template.name}</h4>
                        </div>
                        <Badge variant="outline">Template</Badge>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openViewModal(template.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(template.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal de Criação */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Template de Contrato</DialogTitle>
            <DialogDescription>
              Crie um template combinando itens do catálogo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contract_type_id">Tipo de Contrato *</Label>
              <Select
                value={formData.contract_type_id}
                onValueChange={(value) => setFormData({ ...formData, contract_type_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {activeContractTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                placeholder="Ex: Carro e Moto"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Itens do Template</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>

              {templateItems.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label>Item do Catálogo</Label>
                      <Select
                        value={item.catalog_item_id}
                        onValueChange={(value) => handleItemChange(index, 'catalog_item_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um item" />
                        </SelectTrigger>
                        <SelectContent>
                          {catalogItems.map((catalogItem) => (
                            <SelectItem key={catalogItem.id} value={catalogItem.id.toString()}>
                              {catalogItem.name} - {formatCurrency(catalogItem.default_unit_price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quantidade</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                        {templateItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

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
                {isCreating ? 'Criando...' : 'Criar Template'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingTemplate?.name}</DialogTitle>
          </DialogHeader>

          {viewingTemplate && (
            <div className="space-y-3">
              <Label>Itens do Template:</Label>
              {viewingTemplate.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                  <div>
                    <p className="font-medium">{item.catalog_item?.name}</p>
                    <p className="text-sm text-slate-600">
                      {item.quantity}x {formatCurrency(item.catalog_item?.default_unit_price || 0)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency((item.catalog_item?.default_unit_price || 0) * item.quantity)}
                  </p>
                </div>
              ))}
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(
                    viewingTemplate.items.reduce(
                      (sum, item) => sum + (item.catalog_item?.default_unit_price || 0) * item.quantity,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTemplate(null)}>
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
