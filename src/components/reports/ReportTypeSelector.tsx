
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ReportType = 'productivity' | 'vehicle' | 'financial' | 'client'

interface ReportTypeSelectorProps {
  currentType: ReportType
  onTypeChange: (type: ReportType) => void
}

export function ReportTypeSelector({ currentType, onTypeChange }: ReportTypeSelectorProps) {
  return (
    <Tabs value={currentType} onValueChange={(v) => onTypeChange(v as ReportType)} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
        <TabsTrigger value="productivity">Produtividade</TabsTrigger>
        <TabsTrigger value="vehicle">Veículos</TabsTrigger>
        <TabsTrigger value="financial">Financeiro</TabsTrigger>
        <TabsTrigger value="client">Clientes</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
