import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { Contract, ContractItem, PDFTemplate } from '@/types/database'

// Register fonts (optional - for better typography)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
// })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#6366f1', // Will be overridden by template
    paddingBottom: 10,
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
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#64748b',
  },
  contractNumber: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '30%',
    color: '#64748b',
    fontSize: 9,
  },
  value: {
    width: '70%',
    fontWeight: 'bold',
    fontSize: 9,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #e2e8f0',
    fontSize: 9,
  },
  tableCol1: {
    width: '10%',
  },
  tableCol2: {
    width: '50%',
  },
  tableCol3: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol4: {
    width: '15%',
    textAlign: 'right',
  },
  tableCol5: {
    width: '10%',
    textAlign: 'right',
  },
  totalSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  signatures: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTop: '1px solid #000',
    marginTop: 40,
    paddingTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8,
    borderTop: '1px solid #e2e8f0',
    paddingTop: 10,
  },
})

interface ContractPDFProps {
  contract: Contract
  items: ContractItem[]
  template?: PDFTemplate | null
}

export const ContractPDF = ({ contract, items, template }: ContractPDFProps) => {
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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
          
          <Text style={styles.title}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</Text>
          <Text style={styles.subtitle}>
            {contract.companies?.name || 'Empresa'}
          </Text>
          <Text style={[styles.contractNumber, { color: template?.primary_color || '#6366f1' }]}>
            Contrato Nº {contract.contract_number}
          </Text>
        </View>

        {/* Partes do Contrato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTRATANTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Razão Social:</Text>
            <Text style={styles.value}>{contract.companies?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CNPJ:</Text>
            <Text style={styles.value}>{contract.companies?.cnpj}</Text>
          </View>
          {contract.companies?.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Endereço:</Text>
              <Text style={styles.value}>
                {contract.companies.address}, {contract.companies.city} - {contract.companies.state}
              </Text>
            </View>
          )}
          {contract.companies?.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telefone:</Text>
              <Text style={styles.value}>{contract.companies.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTRATADO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{contract.clients?.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{contract.clients?.cpf}</Text>
          </View>
          {contract.clients?.rg_number && (
            <View style={styles.row}>
              <Text style={styles.label}>RG:</Text>
              <Text style={styles.value}>
                {contract.clients.rg_number}
                {contract.clients.rg_issuer_state && ` - ${contract.clients.rg_issuer_state}`}
              </Text>
            </View>
          )}
          {contract.clients?.address && (
            <View style={styles.row}>
              <Text style={styles.label}>Endereço:</Text>
              <Text style={styles.value}>
                {contract.clients.address}, {contract.clients.city} - {contract.clients.state}
              </Text>
            </View>
          )}
        </View>

        {/* Objeto do Contrato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OBJETO DO CONTRATO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Tipo:</Text>
            <Text style={styles.value}>{contract.contract_types?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Início:</Text>
            <Text style={styles.value}>{formatDate(contract.start_date)}</Text>
          </View>
          {contract.end_date && (
            <View style={styles.row}>
              <Text style={styles.label}>Data de Término:</Text>
              <Text style={styles.value}>{formatDate(contract.end_date)}</Text>
            </View>
          )}
        </View>

        {/* Itens/Serviços */}
        {items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SERVIÇOS CONTRATADOS</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>#</Text>
                <Text style={styles.tableCol2}>Descrição</Text>
                <Text style={styles.tableCol3}>Qtd</Text>
                <Text style={styles.tableCol4}>Valor Unit.</Text>
                <Text style={styles.tableCol5}>Total</Text>
              </View>
              {items.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={styles.tableCol1}>{index + 1}</Text>
                  <Text style={styles.tableCol2}>{item.description}</Text>
                  <Text style={styles.tableCol3}>{item.quantity}</Text>
                  <Text style={styles.tableCol4}>{formatCurrency(item.unit_price)}</Text>
                  <Text style={styles.tableCol5}>{formatCurrency(item.total_price)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Valores */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(contract.total_value)}</Text>
          </View>
          {contract.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Desconto:</Text>
              <Text style={styles.totalValue}>- {formatCurrency(contract.discount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VALOR TOTAL:</Text>
            <Text style={[styles.grandTotal, { color: template?.primary_color || '#6366f1' }]}>
              {formatCurrency(contract.final_value)}
            </Text>
          </View>
        </View>

        {/* Condições de Pagamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONDIÇÕES DE PAGAMENTO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Forma de Pagamento:</Text>
            <Text style={styles.value}>{contract.payment_methods?.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Parcelas:</Text>
            <Text style={styles.value}>
              {contract.installments}x de {formatCurrency(contract.final_value / contract.installments)}
            </Text>
          </View>
        </View>

        {/* Template Terms (if configured) */}
        {template?.contract_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TERMOS E CONDIÇÕES</Text>
            <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{template.contract_terms}</Text>
          </View>
        )}

        {/* Observações */}
        {(contract.notes || template?.contract_notes) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>OBSERVAÇÕES</Text>
            {contract.notes && (
              <Text style={{ fontSize: 9, lineHeight: 1.5, marginBottom: 5 }}>{contract.notes}</Text>
            )}
            {template?.contract_notes && (
              <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#64748b' }}>{template.contract_notes}</Text>
            )}
          </View>
        )}

        {/* Assinaturas */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>CONTRATANTE</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}>{contract.companies?.name}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>CONTRATADO</Text>
              <Text style={{ fontSize: 8, marginTop: 2 }}>{contract.clients?.full_name}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {template?.footer_text && (
            <Text style={{ marginBottom: 5 }}>{template.footer_text}</Text>
          )}
          <Text>
            {contract.companies?.city}, {formatDate(contract.start_date)}
          </Text>
          {template?.show_contact_info && contract.companies?.phone && (
            <Text style={{ marginTop: 3 }}>
              Contato: {contract.companies.phone}
              {contract.companies.email && ` | ${contract.companies.email}`}
            </Text>
          )}
          {!template?.footer_text && (
            <Text style={{ marginTop: 5 }}>
              Este documento foi gerado eletronicamente e possui validade legal.
            </Text>
          )}
        </View>
      </Page>
    </Document>
  )
}
