import { useEffect } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useContractTemplates } from '@/hooks/useContractTemplates'
import { useCatalogItems } from '@/hooks/useCatalogItems'
import { formatCurrency } from '@/lib/utils/currency'
import { Sparkles, Plus, Trash2 } from 'lucide-react'
import type { DealItem } from '@/types/database'

interface ContractTemplateItemWithCatalogType {
  catalog_item_id: number | null
  quantity: number
  catalog_item?: {
    name: string
    default_unit_price: number
  } | null
}

interface DealTemplateWithItemsProps {
  contractTypeId: number | null
  templateId: number | null
  onTemplateChange: (templateId: number | null) => void
  items: Omit<DealItem, 'id' | 'deal_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]
  onItemsChange: (items: Omit<DealItem, 'id' | 'deal_id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>[]) => void
  onTotalChange: (total: number) => void
}

export function DealTemplateWithItems({
  contractTypeId,
  templateId,
  onTemplateChange,
  items,
  onItemsChange,
  onTotalChange,
}: DealTemplateWithItemsProps) {
  const { useTemplatesByType, useTemplateWithItems } = useContractTemplates()
  const { data: templates, isLoading: templatesLoading } = useTemplatesByType(contractTypeId || undefined)
  const { data: templateData } = useTemplateWithItems(templateId || undefined)
  const { catalogItems } = useCatalogItems()

  // Load template items when template is selected
  useEffect(() => {
    if (templateData?.items && templateData.items.length > 0) {
      const newItems = templateData.items.map((item: unknown) => {
        const typedItem = item as ContractTemplateItemWithCatalogType
        // O preço vem do catalog_item, não do template item
        const unitPrice = typedItem.catalog_item?.default_unit_price || 0
        const quantity = typedItem.quantity || 1
        
        return {
          catalog_item_id: typedItem.catalog_item_id,
          description: typedItem.catalog_item?.name || '',
          quantity: quantity,
          unit_price: unitPrice,
          total_price: unitPrice * quantity,
        }
      })
      onItemsChange(newItems)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData])

  // Calculate total whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.total_price, 0)
    onTotalChange(total)
  }, [items, onTotalChange])

  const handleQuantityChange = (index: number, quantity: number) => {
    const newItems = [...items]
    newItems[index].quantity = quantity
    newItems[index].total_price = quantity * newItems[index].unit_price
    onItemsChange(newItems)
  }

  const handleUnitPriceChange = (index: number, unitPrice: number) => {
    const newItems = [...items]
    newItems[index].unit_price = unitPrice
    newItems[index].total_price = newItems[index].quantity * unitPrice
    onItemsChange(newItems)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onItemsChange(newItems)
  }

  const handleAddItem = () => {
    const newItems = [
      ...items,
      {
        catalog_item_id: null,
        description: '',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
      },
    ]
    onItemsChange(newItems)
  }

  const handleCatalogItemChange = (index: number, catalogItemId: string) => {
    const catalogItem = catalogItems?.find((item) => item.id === parseInt(catalogItemId))
    if (catalogItem) {
      const newItems = [...items]
      newItems[index] = {
        catalog_item_id: catalogItem.id,
        description: catalogItem.name,
        quantity: 1,
        unit_price: catalogItem.default_unit_price,
        total_price: catalogItem.default_unit_price,
      }
      onItemsChange(newItems)
    }
  }

  if (!contractTypeId) return null

  if (templatesLoading) {
    return (
      <div className="space-y-2">
        <Label>Template de Contrato (Sugestão)</Label>
        <div className="text-sm text-slate-500">Carregando templates...</div>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <Card className="p-3 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Nenhum template disponível para este tipo de contrato.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Template Selector */}
      <div className="space-y-2">
        <Label>Template de Contrato (Sugestão)</Label>
        <Select
          value={templateId?.toString() ?? ''}
          onValueChange={(val) => onTemplateChange(val ? parseInt(val) : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um template (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{template.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {templateId && items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Itens do Negócio</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Item
            </Button>
          </div>

          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800">
                Itens do template carregados. Você pode editar quantidades e valores.
              </p>
            </div>
          </Card>

          <div className="space-y-3">
            {items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  {/* Catalog Item Selector */}
                  <div className="space-y-2">
                    <Label className="text-xs">Item do Catálogo</Label>
                    <Select
                      value={item.catalog_item_id?.toString() ?? ''}
                      onValueChange={(val) => handleCatalogItemChange(index, val)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione do catálogo ou digite abaixo" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogItems?.map((catalogItem) => (
                          <SelectItem key={catalogItem.id} value={catalogItem.id.toString()}>
                            {catalogItem.name} - {formatCurrency(catalogItem.default_unit_price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">{item.description || 'Nenhuma descrição'}</p>
                  </div>

                  {/* Quantity, Unit Price, Total */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Quantidade</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Valor Unit.</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => handleUnitPriceChange(index, parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Total</Label>
                      <Input
                        type="text"
                        value={formatCurrency(item.total_price)}
                        disabled
                        className="h-9 bg-slate-50"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                    className="w-full h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
