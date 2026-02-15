export type ContractStatus = 'draft' | 'active' | 'completed' | 'cancelled';


/**
 * Configuração de cores para cada status
 */
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

/**
 * Labels traduzidos para cada status
 */
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
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
