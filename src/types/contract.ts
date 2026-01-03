/**
 * Status possíveis de um contrato
 */
export type ContractStatus = 'active' | 'completed' | 'inactive'

/**
 * Configuração de cores para cada status
 */
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  inactive: 'bg-gray-100 text-gray-700',
}

/**
 * Labels traduzidos para cada status
 */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: 'Ativo',
  completed: 'Concluído',
  inactive: 'Inativo',
}

/**
 * Constantes do wizard de criação de contrato
 */
export const WIZARD_STEPS = {
  BASIC_INFO: 1,
  ITEMS: 2,
  PAYMENT: 3,
  TOTAL: 3,
} as const

export type WizardStep = typeof WIZARD_STEPS[keyof typeof WIZARD_STEPS]
