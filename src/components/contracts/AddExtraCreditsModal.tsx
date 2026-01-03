import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AddExtraCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: number
}

export function AddExtraCreditsModal({ open, onOpenChange, contractId }: AddExtraCreditsModalProps) {
  const queryClient = useQueryClient()
  const [selectedCatalogItem, setSelectedCatalogItem] = useState('')
  const [quantity, setQuantity] = useState('1')

  // Fetch lesson items from catalog
  const { data: catalogItems = [] } = useQuery({
    queryKey: ['catalog-lesson-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contract_items_catalog')
        .select('*')
        .eq('is_lesson', true)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      return data || []
    },
  })

  // Fetch contract details for receivables
  const { data: contract } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('erp_contracts')
        .select('client_id, contract_number, company_id')
        .eq('id', contractId)
        .single()

      if (error) throw error
      return data
    },
    enabled: open,
  })

  const selectedItem = catalogItems.find((item: any) => item.id.toString() === selectedCatalogItem)
  const totalPrice = selectedItem ? selectedItem.default_unit_price * parseInt(quantity || '0') : 0

  // Mutation to add extra credits
  const addExtraMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCatalogItem || !quantity) {
        throw new Error('Selecione o tipo de aula e a quantidade')
      }

      if (!contract) {
        throw new Error('Informações do contrato não encontradas')
      }

      const item = catalogItems.find((i: any) => i.id.toString() === selectedCatalogItem)
      if (!item) throw new Error('Item não encontrado')

      const qty = parseInt(quantity)
      if (qty <= 0) throw new Error('Quantidade deve ser maior que zero')

      const total = item.default_unit_price * qty

      // Insert new contract item marked as extra
      const { data: contractItem, error: itemError } = await supabase
        .from('erp_contract_items')
        .insert({
          contract_id: contractId,
          catalog_item_id: item.id,
          description: `${item.name} (Extra)`,
          quantity: qty,
          unit_price: item.default_unit_price,
          total_price: total,
          is_extra: true,
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Create receivable for the extra credits
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // Due in 7 days

      const { error: receivableError } = await supabase
        .from('erp_receivables')
        .insert({
          client_id: contract.client_id,
          company_id: contract.company_id,
          contract_id: contractId,
          amount: total,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pending',
          installment_number: 1,
        })

      if (receivableError) throw receivableError

      return contractItem
    },
    onSuccess: () => {
      toast.success('Aulas extras adicionadas e parcela gerada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['contract-items-with-catalog'] })
      queryClient.invalidateQueries({ queryKey: ['contracts'] })
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      onOpenChange(false)
      // Reset form
      setSelectedCatalogItem('')
      setQuantity('1')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao adicionar aulas extras')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addExtraMutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Comprar Aulas Extras
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Lesson Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Tipo de Aula *</Label>
              <Select value={selectedCatalogItem} onValueChange={setSelectedCatalogItem} required>
                <SelectTrigger id="lesson-type">
                  <SelectValue placeholder="Selecione o tipo de aula" />
                </SelectTrigger>
                <SelectContent>
                  {catalogItems.map((item: any) => {
                    const categoryLabel = {
                      car: '🚗 Carro',
                      motorcycle: '🏍️ Moto',
                      bus: '🚌 Ônibus',
                      truck: '🚚 Caminhão'
                    }[item.vehicle_category] || ''

                    return (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {categoryLabel && (
                            <span className="text-xs text-muted-foreground">
                              ({categoryLabel})
                            </span>
                          )}
                          <span className="ml-auto text-muted-foreground">
                            - R$ {item.default_unit_price.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {selectedItem?.vehicle_category && (
                <p className="text-xs text-muted-foreground">
                  Categoria: {
                    {
                      car: '🚗 Carro',
                      motorcycle: '🏍️ Moto',
                      bus: '🚌 Ônibus',
                      truck: '🚚 Caminhão'
                    }[selectedItem.vehicle_category]
                  }
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            {/* Price Summary */}
            {selectedItem && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Valor unitário:</span>
                  <span className="font-medium">
                    R$ {selectedItem.default_unit_price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Quantidade:</span>
                  <span className="font-medium">{quantity}x</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-green-600">R$ {totalPrice.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Info Message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                💡 Estas aulas serão adicionadas como <strong>créditos extras</strong> ao contrato e
                ficarão destacadas na aba de Aulas.
              </p>
              <p className="text-xs text-blue-800 mt-2">
                💰 Uma <strong>parcela de R$ {totalPrice.toFixed(2)}</strong> será gerada automaticamente
                no financeiro com vencimento em 7 dias.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={addExtraMutation.isPending || !selectedCatalogItem || !quantity}
              className="bg-green-600 hover:bg-green-700"
            >
              {addExtraMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Aulas Extras
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
