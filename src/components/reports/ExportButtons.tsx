
import { Button } from "@/components/ui/button"
import { FileDown, Printer } from "lucide-react"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportData } from '@/types/supabase-helpers'

interface ExportColumn {
  header: string
  key: string
}

interface ExportButtonsProps {
  data: ExportData
  type: string
  columns: ExportColumn[]
  fileName?: string
}

export function ExportButtons({ data, type, columns, fileName = 'relatorio' }: ExportButtonsProps) {
  
  const handleExportExcel = () => {
    // Transform data based on columns
    const exportData = data.map(item => {
      const row: Record<string, unknown> = {}
      const itemRecord = item as Record<string, unknown>
      columns.forEach(col => {
        row[col.header] = itemRecord[col.key]
      })
      return row
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    XLSX.utils.book_append_sheet(wb, ws, "Relatório")
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Add logic for logo if needed
    // doc.addImage(...)

    doc.setFontSize(18)
    doc.text(`Relatório de ${type}`, 14, 22)
    
    doc.setFontSize(11)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30)

    const tableData = data.map(item => columns.map(col => (item as Record<string, unknown>)[col.key]))
    const tableHeaders = columns.map(col => col.header)

    autoTable(doc, {
      head: [tableHeaders],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: tableData as any,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }, // Blue color
    })

    doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportExcel}>
        <FileDown className="mr-2 h-4 w-4" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        <Printer className="mr-2 h-4 w-4" />
        PDF
      </Button>
    </div>
  )
}
