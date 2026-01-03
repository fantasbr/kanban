import { useState } from 'react'
import { Plus, Pencil, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTemplates } from '@/hooks/useTemplates'
import { useContractTypes } from '@/hooks/useERPConfig'
import type { ContractTemplate } from '@/types/database'

export function Templates() {
  const {
    templates,
    createTemplate,
    updateTemplate,
    setDefaultTemplate,
    isLoading,
  } = useTemplates()

  const { activeContractTypes } = useContractTypes()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'contract' as 'contract' | 'receipt',
    contract_type_id: null as number | null,
    template_html: '',
    css_styles: '',
    header_html: '',
    footer_html: '',
  })

  const handleOpenDialog = (template?: ContractTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setFormData({
        name: template.name,
        type: template.type,
        contract_type_id: template.contract_type_id,
        template_html: template.template_html,
        css_styles: template.css_styles || '',
        header_html: template.header_html || '',
        footer_html: template.footer_html || '',
      })
    } else {
      setEditingTemplate(null)
      setFormData({
        name: '',
        type: 'contract',
        contract_type_id: null,
        template_html: '',
        css_styles: '',
        header_html: '',
        footer_html: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const templateData = {
      ...formData,
      is_default: false,
      is_active: true,
    }

    if (editingTemplate) {
      updateTemplate({
        id: editingTemplate.id,
        updates: templateData,
      })
    } else {
      createTemplate(templateData)
    }

    setIsDialogOpen(false)
  }

  const contractTemplates = templates.filter((t) => t.type === 'contract')
  const receiptTemplates = templates.filter((t) => t.type === 'receipt')

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
          <h1 className="text-3xl font-bold text-slate-900">Templates PDF</h1>
          <p className="text-slate-500 mt-1">
            Gerenciar templates de contratos e recibos
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="receipts">Recibos</TabsTrigger>
        </TabsList>

        {/* Contract Templates */}
        <TabsContent value="contracts" className="space-y-4">
          <p className="text-sm text-slate-500">
            {contractTemplates.length} template(s) de contrato
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractTemplates.map((template) => (
              <Card key={template.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      {template.is_default && (
                        <Badge variant="default" className="text-xs mt-1">
                          <Check className="h-3 w-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mb-4">
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  {!template.is_default && template.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultTemplate({ id: template.id, type: 'contract' })}
                    >
                      Padrão
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {contractTemplates.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-slate-500">Nenhum template de contrato cadastrado</p>
            </div>
          )}
        </TabsContent>

        {/* Receipt Templates */}
        <TabsContent value="receipts" className="space-y-4">
          <p className="text-sm text-slate-500">
            {receiptTemplates.length} template(s) de recibo
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {receiptTemplates.map((template) => (
              <Card key={template.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{template.name}</h3>
                      {template.is_default && (
                        <Badge variant="default" className="text-xs mt-1">
                          <Check className="h-3 w-3 mr-1" />
                          Padrão
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600 mb-4">
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  {!template.is_default && template.is_active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDefaultTemplate({ id: template.id, type: 'receipt' })}
                    >
                      Padrão
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {receiptTemplates.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
              <p className="text-slate-500">Nenhum template de recibo cadastrado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate
                  ? 'Atualize o template HTML/CSS'
                  : 'Crie um novo template para contratos ou recibos'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template *</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Ex: Contrato Padrão Autoescola"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'contract' | 'receipt') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Contrato</SelectItem>
                      <SelectItem value="receipt">Recibo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.type === 'contract' && (
                <div className="space-y-2">
                  <Label htmlFor="contract_type_id">Tipo de Contrato (opcional)</Label>
                  <Select
                    value={formData.contract_type_id?.toString() || ''}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contract_type_id: value ? parseInt(value) : null })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum (genérico)</SelectItem>
                      {activeContractTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template_html">HTML do Template *</Label>
                <Textarea
                  id="template_html"
                  required
                  rows={6}
                  placeholder="<div>{{'{'}client_name{'}'}}</div>"
                  className="font-mono text-sm"
                  value={formData.template_html}
                  onChange={(e) => setFormData({ ...formData, template_html: e.target.value })}
                />
                <p className="text-xs text-slate-500">
                  Use variáveis: {'{{client_name}}, {{contract_number}}, {{company_name}}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="css_styles">CSS (opcional)</Label>
                <Textarea
                  id="css_styles"
                  rows={4}
                  placeholder=".contract { font-family: Arial; }"
                  className="font-mono text-sm"
                  value={formData.css_styles}
                  onChange={(e) => setFormData({ ...formData, css_styles: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="header_html">Header HTML (opcional)</Label>
                <Textarea
                  id="header_html"
                  rows={3}
                  placeholder="<header>...</header>"
                  className="font-mono text-sm"
                  value={formData.header_html}
                  onChange={(e) => setFormData({ ...formData, header_html: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_html">Footer HTML (opcional)</Label>
                <Textarea
                  id="footer_html"
                  rows={3}
                  placeholder="<footer>...</footer>"
                  className="font-mono text-sm"
                  value={formData.footer_html}
                  onChange={(e) => setFormData({ ...formData, footer_html: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingTemplate ? 'Atualizar' : 'Criar Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
