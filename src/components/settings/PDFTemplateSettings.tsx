import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCompanies } from '@/hooks/useERPConfig'
import { usePDFTemplates } from '@/hooks/usePDFTemplates'
import type { PDFTemplate } from '@/types/database'
import { LogoUpload } from './LogoUpload'
import { FileText, Receipt, Save, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function PDFTemplateSettings() {
  const { companies } = useCompanies()
  const { templates, upsertTemplate, deleteTemplate, isUpserting, isDeleting, useTemplateByCompanyAndType } = usePDFTemplates()
  
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>()
  const [templateType, setTemplateType] = useState<'contract' | 'receipt'>('contract')
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  
  // Fetch existing template
  const { data: existingTemplate } = useTemplateByCompanyAndType(selectedCompanyId, templateType)
  
  // Form state
  const [formData, setFormData] = useState({
    show_logo: true,
    logo_url: null as string | null,
    header_text: '',
    footer_text: '',
    show_contact_info: true,
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    contract_terms: '',
    contract_notes: '',
    receipt_notes: '',
  })

  // Update form when template loads
  useState(() => {
    if (existingTemplate) {
      setFormData({
        show_logo: existingTemplate.show_logo,
        logo_url: existingTemplate.logo_url,
        header_text: existingTemplate.header_text || '',
        footer_text: existingTemplate.footer_text || '',
        show_contact_info: existingTemplate.show_contact_info,
        primary_color: existingTemplate.primary_color,
        secondary_color: existingTemplate.secondary_color,
        contract_terms: existingTemplate.contract_terms || '',
        contract_notes: existingTemplate.contract_notes || '',
        receipt_notes: existingTemplate.receipt_notes || '',
      })
      setEditingTemplateId(existingTemplate.id)
    } else {
      setEditingTemplateId(null)
    }
  })

  const handleEdit = (template: PDFTemplate) => {
    setSelectedCompanyId(template.company_id)
    setTemplateType(template.template_type)
    setFormData({
      show_logo: template.show_logo,
      logo_url: template.logo_url,
      header_text: template.header_text || '',
      footer_text: template.footer_text || '',
      show_contact_info: template.show_contact_info,
      primary_color: template.primary_color,
      secondary_color: template.secondary_color,
      contract_terms: template.contract_terms || '',
      contract_notes: template.contract_notes || '',
      receipt_notes: template.receipt_notes || '',
    })
    setEditingTemplateId(template.id)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este template?')) {
      deleteTemplate(id, {
        onSuccess: () => {
          toast.success('Template excluído com sucesso!')
          if (editingTemplateId === id) {
            handleReset()
          }
        },
        onError: (error) => {
          toast.error(`Erro ao excluir template: ${error.message}`)
        },
      })
    }
  }

  const getCompanyName = (companyId: number) => {
    const company = companies.find((c: { id: number; name: string }) => c.id === companyId)
    return company?.name || 'Empresa não encontrada'
  }

  const handleSave = () => {
    if (!selectedCompanyId) {
      toast.error('Selecione uma empresa')
      return
    }

    upsertTemplate(
      {
        company_id: selectedCompanyId,
        template_type: templateType,
        ...formData,
      },
      {
        onSuccess: () => {
          toast.success('Template salvo com sucesso!')
        },
        onError: (error) => {
          toast.error(`Erro ao salvar template: ${error.message}`)
        },
      }
    )
  }

  const handleReset = () => {
    setFormData({
      show_logo: true,
      logo_url: null,
      header_text: '',
      footer_text: '',
      show_contact_info: true,
      primary_color: '#6366f1',
      secondary_color: '#8b5cf6',
      contract_terms: '',
      contract_notes: '',
      receipt_notes: '',
    })
  }

  return (
    <div className="space-y-6">
      {/* Templates List */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Templates Salvos</CardTitle>
            <CardDescription>
              Lista de todos os templates configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">Empresa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-900">Cores</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-900">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm">{getCompanyName(template.company_id)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {template.template_type === 'contract' ? (
                            <>
                              <FileText className="h-4 w-4 text-blue-600" />
                              <span>Contrato</span>
                            </>
                          ) : (
                            <>
                              <Receipt className="h-4 w-4 text-green-600" />
                              <span>Recibo</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded border" 
                            style={{ backgroundColor: template.primary_color }}
                          />
                          <div 
                            className="w-6 h-6 rounded border" 
                            style={{ backgroundColor: template.secondary_color }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(template)}
                            disabled={isDeleting}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            disabled={isDeleting}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingTemplateId ? 'Editar Template' : 'Criar Novo Template'}
          </CardTitle>
          <CardDescription>
            Configure os modelos padrões para geração de PDFs de contratos e recibos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company and Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Select
                value={selectedCompanyId?.toString()}
                onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
              >
                <SelectTrigger id="company">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company: { id: number; name: string }) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Tipo de Template</Label>
              <Select
                value={templateType}
                onValueChange={(value: 'contract' | 'receipt') => setTemplateType(value)}
              >
                <SelectTrigger id="template-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contrato
                    </div>
                  </SelectItem>
                  <SelectItem value="receipt">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4" />
                      Recibo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCompanyId && (
            <Tabs defaultValue="header" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="header">Cabeçalho</TabsTrigger>
                <TabsTrigger value="footer">Rodapé</TabsTrigger>
                <TabsTrigger value="colors">Cores</TabsTrigger>
                <TabsTrigger value="texts">Textos</TabsTrigger>
              </TabsList>

              {/* Header Tab */}
              <TabsContent value="header" className="space-y-4">
                {selectedCompanyId && (
                  <LogoUpload
                    currentLogoUrl={formData.logo_url}
                    onLogoChange={(url) => setFormData({ ...formData, logo_url: url })}
                    companyId={selectedCompanyId}
                  />
                )}

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-logo">Mostrar Logo</Label>
                  <Switch
                    id="show-logo"
                    checked={formData.show_logo}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, show_logo: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="header-text">Texto do Cabeçalho</Label>
                  <Textarea
                    id="header-text"
                    placeholder="Ex: Nome da Empresa - CNPJ: 00.000.000/0000-00"
                    value={formData.header_text}
                    onChange={(e) =>
                      setFormData({ ...formData, header_text: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Footer Tab */}
              <TabsContent value="footer" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-contact">Mostrar Informações de Contato</Label>
                  <Switch
                    id="show-contact"
                    checked={formData.show_contact_info}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, show_contact_info: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-text">Texto do Rodapé</Label>
                  <Textarea
                    id="footer-text"
                    placeholder="Ex: Endereço - Telefone - Email"
                    value={formData.footer_text}
                    onChange={(e) =>
                      setFormData({ ...formData, footer_text: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Colors Tab */}
              <TabsContent value="colors" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primary-color"
                        type="color"
                        value={formData.primary_color}
                        onChange={(e) =>
                          setFormData({ ...formData, primary_color: e.target.value })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.primary_color}
                        onChange={(e) =>
                          setFormData({ ...formData, primary_color: e.target.value })
                        }
                        placeholder="#6366f1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondary-color"
                        type="color"
                        value={formData.secondary_color}
                        onChange={(e) =>
                          setFormData({ ...formData, secondary_color: e.target.value })
                        }
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.secondary_color}
                        onChange={(e) =>
                          setFormData({ ...formData, secondary_color: e.target.value })
                        }
                        placeholder="#8b5cf6"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Texts Tab */}
              <TabsContent value="texts" className="space-y-4">
                {templateType === 'contract' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="contract-terms">Termos e Condições</Label>
                      <Textarea
                        id="contract-terms"
                        placeholder="Digite os termos e condições padrão do contrato..."
                        value={formData.contract_terms}
                        onChange={(e) =>
                          setFormData({ ...formData, contract_terms: e.target.value })
                        }
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contract-notes">Observações</Label>
                      <Textarea
                        id="contract-notes"
                        placeholder="Observações adicionais do contrato..."
                        value={formData.contract_notes}
                        onChange={(e) =>
                          setFormData({ ...formData, contract_notes: e.target.value })
                        }
                        rows={3}
                      />
                    </div>
                  </>
                )}

                {templateType === 'receipt' && (
                  <div className="space-y-2">
                    <Label htmlFor="receipt-notes">Observações do Recibo</Label>
                    <Textarea
                      id="receipt-notes"
                      placeholder="Observações adicionais do recibo..."
                      value={formData.receipt_notes}
                      onChange={(e) =>
                        setFormData({ ...formData, receipt_notes: e.target.value })
                      }
                      rows={5}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Action Buttons */}
          {selectedCompanyId && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleReset} disabled={isUpserting}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              <Button onClick={handleSave} disabled={isUpserting}>
                <Save className="h-4 w-4 mr-2" />
                {isUpserting ? 'Salvando...' : 'Salvar Template'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
