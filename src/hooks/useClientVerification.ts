import { useClients } from './useClients'
import { useKanban } from './useKanban'

export function useClientVerification() {
  const { activeClients } = useClients()

  /**
   * Busca cliente por contact_id do Chatwoot
   */
  const findClientByContact = (contactId: number | null) => {
    if (!contactId) return null
    return activeClients.find(c => c.contact_id === contactId) || null
  }

  /**
   * Busca cliente por ID
   */
  const findClientById = (clientId: number | null) => {
    if (!clientId) return null
    return activeClients.find(c => c.id === clientId) || null
  }

  /**
   * Vincula cliente ao deal
   */
  const useLinkClientToDeal = () => {
    const { updateDeal } = useKanban('')
    
    return async (dealId: string, clientId: number) => {
      await updateDeal({ dealId, updates: { existing_client_id: clientId } })
    }
  }

  /**
   * Marca deal como precisando de contrato
   */
  const useMarkNeedsContract = () => {
    const { updateDeal } = useKanban('')
    
    return async (dealId: string, needs: boolean = true) => {
      await updateDeal({ dealId, updates: { needs_contract: needs } })
    }
  }

  return {
    findClientByContact,
    findClientById,
    useLinkClientToDeal,
    useMarkNeedsContract,
  }
}
