import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Receipt, PDFTemplate } from '@/types/database'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
    borderBottom: 2,
    borderBottomColor: '#6366f1', // Will be overridden by template
    paddingBottom: 15,
  },
  logo: {
    width: 150,
    height: 56,
    marginBottom: 10,
    objectFit: 'contain',
    alignSelf: 'center',
  },
  headerText: {
    fontSize: 9,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e293b',
  },
  receiptNumber: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 5,
  },
  date: {
    fontSize: 10,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '35%',
    color: '#64748b',
    fontSize: 11,
  },
  value: {
    width: '65%',
    fontWeight: 'bold',
    fontSize: 11,
  },
  valueBox: {
    marginTop: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    border: '1px solid #e2e8f0',
  },
  valueLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  valueAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 5,
  },
  valueExtended: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
  },
  referenceBox: {
    padding: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
    marginBottom: 20,
  },
  referenceTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#92400e',
  },
  referenceText: {
    fontSize: 10,
    color: '#78350f',
    lineHeight: 1.4,
  },
  signature: {
    marginTop: 60,
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #000',
    width: '60%',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 80,
    color: '#f1f5f9',
    opacity: 0.3,
    fontWeight: 'bold',
  },
})

interface ReceiptPDFProps {
  receipt: Receipt
  template?: PDFTemplate | null
}

export const ReceiptPDF = ({ receipt, template }: ReceiptPDFProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const numberToWords = (value: number): string => {
    // Simplified version - in production, use a library like 'extenso'
    const integerPart = Math.floor(value)
    const decimalPart = Math.round((value - integerPart) * 100)
    
    // This is a simplified version - you'd want a proper number-to-words library
    return `${integerPart} reais${decimalPart > 0 ? ` e ${decimalPart} centavos` : ''}`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>RECIBO</Text>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: template?.primary_color || '#6366f1' }]}>
          {/* Logo */}
          {template?.show_logo && template?.logo_url && (
            <Image src={template.logo_url} style={styles.logo} />
          )}
          
          {/* Custom Header Text */}
          {template?.header_text && (
            <Text style={styles.headerText}>{template.header_text}</Text>
          )}
          
          <Text style={styles.title}>RECIBO</Text>
          <Text style={styles.receiptNumber}>Nº {receipt.receipt_number}</Text>
          <Text style={styles.date}>{formatDate(receipt.created_at)}</Text>
        </View>

        {/* Dados do Pagador */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Recebi de:</Text>
            <Text style={styles.value}>{receipt.clients?.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{receipt.clients?.cpf}</Text>
          </View>
          {receipt.clients?.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Endereço:</Text>
              <Text style={styles.value}>
                {receipt.clients.address}, {receipt.clients.city} - {receipt.clients.state}
              </Text>
            </View>
          )}
        </View>

        {/* Valor */}
        <View style={styles.valueBox}>
          <Text style={styles.valueLabel}>A quantia de:</Text>
          <Text style={[styles.valueAmount, { color: template?.primary_color || '#6366f1' }]}>
            {formatCurrency(receipt.amount)}
          </Text>
          <Text style={styles.valueExtended}>
            ({numberToWords(receipt.amount)})
          </Text>
        </View>

        {/* Referente a */}
        <View style={styles.referenceBox}>
          <Text style={styles.referenceTitle}>Referente a:</Text>
          <Text style={styles.referenceText}>
            {receipt.description}
          </Text>
        </View>

        {/* Template Receipt Notes (if configured) */}
        {template?.receipt_notes && (
          <View style={{ padding: 10, backgroundColor: '#f1f5f9', borderRadius: 4, marginBottom: 15 }}>
            <Text style={{ fontSize: 9, color: '#475569', lineHeight: 1.4 }}>
              {template.receipt_notes}
            </Text>
          </View>
        )}

        {/* Forma de Pagamento */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Forma de Pagamento:</Text>
            <Text style={styles.value}>{receipt.payment_methods?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data do Recibo:</Text>
            <Text style={styles.value}>{formatDate(receipt.receipt_date)}</Text>
          </View>
        </View>



        {/* Assinatura */}
        <View style={styles.signature}>
          <View style={styles.signatureLine}>
            <Text>Assinatura / Carimbo</Text>
            <Text style={{ fontSize: 9, marginTop: 5, color: '#64748b' }}>
              {receipt.companies?.name}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {template?.footer_text && (
            <Text style={{ marginBottom: 5 }}>{template.footer_text}</Text>
          )}
          <Text>
            {receipt.companies?.city}, {formatDate(receipt.receipt_date)}
          </Text>
          {!template?.footer_text && (
            <Text style={{ marginTop: 5 }}>
              Recibo gerado eletronicamente - Válido sem assinatura
            </Text>
          )}
          {template?.show_contact_info && receipt.companies?.phone && (
            <Text style={{ marginTop: 3 }}>
              Contato: {receipt.companies.phone}
              {receipt.companies.email && ` | ${receipt.companies.email}`}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  )
}
