/**
 * Formata um número como moeda brasileira (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Calcula o valor de cada parcela, protegendo contra divisão por zero
 */
export function calculateInstallmentValue(totalValue: number, installments: number): number {
  if (installments <= 0) return totalValue
  return totalValue / installments
}
