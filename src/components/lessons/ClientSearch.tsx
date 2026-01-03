import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import type { Client, Contract } from '@/types/database'

interface ClientWithContract extends Client {
  contract: Contract & {
    total_lessons: number
    completed_lessons: number
  }
}

interface ContractOption {
  id: number
  contract_number: string
  total_lessons: number
  completed_lessons: number
}

interface ClientSearchProps {
  onClientSelect: (client: ClientWithContract | null) => void
}

export function ClientSearch({ onClientSelect }: ClientSearchProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientContracts, setClientContracts] = useState<ContractOption[]>([])
  const [selectedContractId, setSelectedContractId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('erp_clients')
        .select('*')
        .order('full_name')

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClientContracts = async (clientId: number) => {
    try {
      const { data: contractsData, error } = await supabase
        .from('erp_contracts')
        .select('id, contract_number, status')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .order('contract_number', { ascending: false })

      if (error) throw error

      // Get details for each contract
      const contractsWithDetails = await Promise.all(
        (contractsData || []).map(async (contract: any) => {
          const { data: items } = await supabase
            .from('erp_contract_items')
            .select('id, quantity')
            .eq('contract_id', contract.id)

          const itemIds = (items || []).map((item: any) => item.id)
          const totalLessons = (items || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)

          let completedCount = 0
          if (itemIds.length > 0) {
            const { count } = await supabase
              .from('erp_lessons')
              .select('*', { count: 'exact', head: true })
              .in('contract_item_id', itemIds)
              .eq('status', 'completed')

            completedCount = count || 0
          }

          return {
            id: contract.id,
            contract_number: contract.contract_number,
            total_lessons: totalLessons,
            completed_lessons: completedCount,
          }
        })
      )

      setClientContracts(contractsWithDetails)

      // If only one contract, select it automatically
      if (contractsWithDetails.length === 1) {
        handleContractSelect(contractsWithDetails[0].id.toString())
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    }
  }

  const handleClientChange = (value: string) => {
    if (value === 'clear') {
      setSelectedClient(null)
      setClientContracts([])
      setSelectedContractId('')
      onClientSelect(null)
    } else {
      const client = clients.find((c) => c.id.toString() === value)
      if (client) {
        setSelectedClient(client)
        setClientContracts([])
        setSelectedContractId('')
        fetchClientContracts(client.id)
      }
    }
  }

  const handleContractSelect = (contractId: string) => {
    setSelectedContractId(contractId)
    const contract = clientContracts.find((c) => c.id.toString() === contractId)
    
    if (selectedClient && contract) {
      onClientSelect({
        ...selectedClient,
        contract: {
          id: contract.id,
          contract_number: contract.contract_number,
          status: 'active',
          total_lessons: contract.total_lessons,
          completed_lessons: contract.completed_lessons,
        } as any,
      })
    }
  }

  const filteredClients = searchValue
    ? clients.filter(
        (client) =>
          client.full_name.toLowerCase().includes(searchValue.toLowerCase()) ||
          client.cpf.includes(searchValue.replace(/\D/g, ''))
      )
    : clients

  return (
    <div className="space-y-4">
      {/* Step 1: Select Client */}
      <div className="space-y-2">
        <Label>1. Buscar Cliente</Label>
        <Input
          placeholder="Filtrar por nome ou CPF..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Select
          value={selectedClient?.id.toString() || ''}
          onValueChange={handleClientChange}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? 'Carregando clientes...' : 'Selecione um cliente...'}>
              {selectedClient ? (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {selectedClient.full_name}
                </span>
              ) : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {selectedClient && (
              <SelectItem value="clear" className="text-muted-foreground">
                Limpar seleção
              </SelectItem>
            )}
            {filteredClients.map((client) => (
              <SelectItem key={client.id} value={client.id.toString()}>
                <div className="flex flex-col">
                  <span className="font-medium">{client.full_name}</span>
                  <span className="text-xs text-muted-foreground">CPF: {client.cpf}</span>
                </div>
              </SelectItem>
            ))}
            {filteredClients.length === 0 && !isLoading && (
              <SelectItem value="none" disabled>
                Nenhum cliente encontrado
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Step 2: Select Contract (if multiple) */}
      {clientContracts.length > 1 && (
        <div className="space-y-2">
          <Label>2. Selecionar Contrato</Label>
          <Select value={selectedContractId} onValueChange={handleContractSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um contrato..." />
            </SelectTrigger>
            <SelectContent>
              {clientContracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">Contrato #{contract.contract_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {contract.completed_lessons} de {contract.total_lessons} aulas
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
