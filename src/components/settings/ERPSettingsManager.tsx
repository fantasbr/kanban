import { useState } from 'react'
import { Plus, Pencil, Tag, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useContractTypes, usePaymentMethods } from '@/hooks/useERPConfig'
import type { ContractType, PaymentMethod } from '@/types/database'

export function ERPSettingsManager() {
  const {
    contractTypes,
    activeContractTypes,
    createContractType,
    updateContractType,
    deactivateContractType,
    isLoading: loadingTypes,
  } = useContractTypes()

  const {
    paymentMethods,
    activePaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deactivatePaymentMethod,
    isLoading: loadingMethods,
  } = usePaymentMethods()

  // Contract Types State
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<ContractType | null>(null)
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    description: '',
  })

  // Payment Methods State
  const [isMethodDialogOpen, setIsMethodDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [methodFormData, setMethodFormData] = useState({
    name: '',
  })

  // Contract Type Handlers
  const handleOpenTypeDialog = (type?: ContractType) => {
    if (type) {
      setEditingType(type)
      setTypeFormData({
        name: type.name,
        description: type.description || '',
      })
    } else {
      setEditingType(null)
      setTypeFormData({ name: '', description: '' })
    }
    setIsTypeDialogOpen(true)
  }

  const handleSubmitType = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingType) {
      updateContractType({
        id: editingType.id,
        updates: typeFormData,
      })
    } else {
      createContractType({
        ...typeFormData,
        is_active: true,
      })
    }
    setIsTypeDialogOpen(false)
  }

  // Payment Method Handlers
  const handleOpenMethodDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method)
      setMethodFormData({ name: method.name })
    } else {
      setEditingMethod(null)
      setMethodFormData({ name: '' })
    }
    setIsMethodDialogOpen(true)
  }

  const handleSubmitMethod = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMethod) {
      updatePaymentMethod({
        id: editingMethod.id,
        updates: methodFormData,
      })
    } else {
      createPaymentMethod({
        ...methodFormData,
        is_active: true,
      })
    }
    setIsMethodDialogOpen(false)
  }

  if (loadingTypes || loadingMethods) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Carregando configurações...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configurações ERP</h1>
        <p className="text-slate-500 mt-1">
          Gerenciar tipos de contrato e métodos de pagamento
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="types">Tipos de Contrato</TabsTrigger>
          <TabsTrigger value="methods">Métodos de Pagamento</TabsTrigger>
        </TabsList>

        {/* Contract Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              {activeContractTypes.length} tipo(s) ativo(s)
            </p>
            <Button onClick={() => handleOpenTypeDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Tipo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractTypes.map((type) => (
              <Card key={type.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Tag className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{type.name}</h3>
                      <Badge variant={type.is_active ? 'default' : 'secondary'} className="text-xs mt-1">
                        {type.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </div>
                {type.description && (
                  <p className="text-sm text-slate-600 mb-3">{type.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenTypeDialog(type)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  {type.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deactivateContractType(type.id)}
                    >
                      Desativar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">
              {activePaymentMethods.length} método(s) ativo(s)
            </p>
            <Button onClick={() => handleOpenMethodDialog()} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Método
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paymentMethods.map((method) => (
              <Card key={method.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{method.name}</h3>
                    <Badge variant={method.is_active ? 'default' : 'secondary'} className="text-xs mt-1">
                      {method.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenMethodDialog(method)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  {method.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deactivatePaymentMethod(method.id)}
                    >
                      Desativar
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Contract Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmitType}>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Editar Tipo de Contrato' : 'Novo Tipo de Contrato'}
              </DialogTitle>
              <DialogDescription>
                {editingType
                  ? 'Atualize as informações do tipo de contrato'
                  : 'Adicione um novo tipo de contrato (ex: Autoescola, Despachante)'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type_name">Nome *</Label>
                <Input
                  id="type_name"
                  required
                  placeholder="Ex: Autoescola, Despachante"
                  value={typeFormData.name}
                  onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type_description">Descrição</Label>
                <Input
                  id="type_description"
                  placeholder="Descrição opcional"
                  value={typeFormData.description}
                  onChange={(e) => setTypeFormData({ ...typeFormData, description: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTypeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingType ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Method Dialog */}
      <Dialog open={isMethodDialogOpen} onOpenChange={setIsMethodDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleSubmitMethod}>
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Editar Método de Pagamento' : 'Novo Método de Pagamento'}
              </DialogTitle>
              <DialogDescription>
                {editingMethod
                  ? 'Atualize o método de pagamento'
                  : 'Adicione um novo método de pagamento (ex: PIX, Boleto, Cartão)'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="method_name">Nome *</Label>
                <Input
                  id="method_name"
                  required
                  placeholder="Ex: PIX, Boleto, Cartão de Crédito"
                  value={methodFormData.name}
                  onChange={(e) => setMethodFormData({ ...methodFormData, name: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMethodDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMethod ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
