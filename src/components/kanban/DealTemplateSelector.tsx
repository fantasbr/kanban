import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { useContractTemplates } from '@/hooks/useContractTemplates'
import { formatCurrency } from '@/lib/utils/currency'
import { Sparkles, Info } from 'lucide-react'

interface DealTemplateSelectorProps {
  contractTypeId: number | null
  value: number | null
  onChange: (templateId: number | null) => void
}

interface TemplateWithValue {
  id: number
  name: string
  value?: number
}

export function DealTemplateSelector({
  contractTypeId,
  value,
  onChange,
}: DealTemplateSelectorProps) {
  const { useTemplatesByType } = useContractTemplates()
  const { data: templates, isLoading } = useTemplatesByType(
    contractTypeId || undefined
  )

  if (!contractTypeId) {
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Template de Contrato</Label>
        <div className="text-sm text-slate-500">Carregando templates...</div>
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <Card className="p-3 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Nenhum template disponível para este tipo de contrato.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Template de Contrato (Sugestão)</Label>
      <Select
        value={value?.toString() ?? ''}
        onValueChange={(val) => onChange(val ? parseInt(val) : null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Selecione um template (opcional)" />
        </SelectTrigger>
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template.id} value={template.id.toString()}>
              <div className="flex items-center gap-2">
                <span>{template.name}</span>
                {(template as unknown as TemplateWithValue).value && (
                  <span className="text-xs text-slate-500">
                     • {formatCurrency((template as unknown as TemplateWithValue).value || 0)}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-800">
              Este template será usado como <strong>sugestão inicial</strong> na
              criação do contrato. Você poderá editar itens e valores livremente.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
