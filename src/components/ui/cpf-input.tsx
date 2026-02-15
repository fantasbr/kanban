import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { validateCPF } from '@/lib/validators'
import { supabase } from '@/lib/supabase'

interface CPFInputProps {
  value: string
  onChange: (value: string) => void
  onValidationChange?: (isValid: boolean, isDuplicate: boolean) => void
  className?: string
  required?: boolean
  label?: string
  excludeClientId?: number // Para excluir o próprio cliente ao editar
}

export function CPFInput({
  value,
  onChange,
  onValidationChange,
  className = '',
  required = false,
  label = 'CPF',
  excludeClientId
}: CPFInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [validationState, setValidationState] = useState<{
    isValid: boolean
    isDuplicate: boolean
    duplicateClientName?: string
  }>({
    isValid: true,
    isDuplicate: false
  })

  // Format CPF as user types
  const formatCPF = (cpf: string): string => {
    // Remove all non-numeric characters
    const cleaned = cpf.replace(/\D/g, '')
    
    // Limit to 11 digits
    const limited = cleaned.substring(0, 11)
    
    // Apply mask: 111.111.111-11
    if (limited.length <= 3) return limited
    if (limited.length <= 6) return `${limited.substring(0, 3)}.${limited.substring(3)}`
    if (limited.length <= 9) return `${limited.substring(0, 3)}.${limited.substring(3, 6)}.${limited.substring(6)}`
    return `${limited.substring(0, 3)}.${limited.substring(3, 6)}.${limited.substring(6, 9)}-${limited.substring(9)}`
  }

  // Parse initial value
  useEffect(() => {
    if (value) {
      setDisplayValue(formatCPF(value))
    }
  }, [value])

  // Validate CPF format and check for duplicates
  useEffect(() => {
    const cleanCPF = displayValue.replace(/\D/g, '')
    
    // Reset validation if empty or incomplete
    if (cleanCPF.length === 0) {
      setValidationState({ isValid: true, isDuplicate: false })
      onValidationChange?.(true, false)
      return
    }

    // Only validate when complete (11 digits)
    if (cleanCPF.length !== 11) {
      setValidationState({ isValid: false, isDuplicate: false })
      onValidationChange?.(false, false)
      return
    }

    // Validate CPF format
    const isValidFormat = validateCPF(cleanCPF)
    
    if (!isValidFormat) {
      setValidationState({ isValid: false, isDuplicate: false })
      onValidationChange?.(false, false)
      return
    }

    // Check for duplicates in database
    const checkDuplicate = async () => {
      setIsChecking(true)
      
      try {
        let query = supabase
          .from('erp_clients')
          .select('id, full_name')
          .eq('cpf', cleanCPF)

        // Exclude current client when editing
        if (excludeClientId) {
          query = query.neq('id', excludeClientId)
        }

        const { data: existingClient } = await query.maybeSingle<{ id: number; full_name: string }>()

        if (existingClient) {
          setValidationState({
            isValid: true,
            isDuplicate: true,
            duplicateClientName: existingClient.full_name
          })
          onValidationChange?.(true, true)
        } else {
          setValidationState({
            isValid: true,
            isDuplicate: false
          })
          onValidationChange?.(true, false)
        }
      } catch (error) {
        console.error('Error checking CPF:', error)
        setValidationState({ isValid: true, isDuplicate: false })
        onValidationChange?.(true, false)
      } finally {
        setIsChecking(false)
      }
    }

    // Debounce the duplicate check
    const timer = setTimeout(() => {
      checkDuplicate()
    }, 500)

    return () => clearTimeout(timer)
  }, [displayValue, excludeClientId, onValidationChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value)
    setDisplayValue(formatted)
    
    // Update parent with clean CPF (only numbers)
    const cleaned = formatted.replace(/\D/g, '')
    onChange(cleaned)
  }

  const getValidationIcon = () => {
    const cleanCPF = displayValue.replace(/\D/g, '')
    
    if (cleanCPF.length === 0) return null
    if (cleanCPF.length !== 11) return null
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
    if (validationState.isDuplicate) return <XCircle className="h-4 w-4 text-red-600" />
    if (validationState.isValid) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getErrorMessage = () => {
    const cleanCPF = displayValue.replace(/\D/g, '')
    
    if (cleanCPF.length === 0) return null
    if (cleanCPF.length !== 11 && cleanCPF.length > 0) return 'CPF incompleto'
    if (!validationState.isValid) return 'CPF inválido'
    if (validationState.isDuplicate) {
      return `CPF já cadastrado para: ${validationState.duplicateClientName}`
    }
    return null
  }

  const errorMessage = getErrorMessage()
  const hasError = errorMessage !== null

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          value={displayValue}
          onChange={handleChange}
          placeholder="000.000.000-00"
          maxLength={14} // 11 digits + 3 formatting characters
          className={`pr-10 ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          required={required}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {getValidationIcon()}
        </div>
      </div>
      {errorMessage && (
        <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
      )}
      {validationState.isValid && !validationState.isDuplicate && displayValue.replace(/\D/g, '').length === 11 && (
        <p className="text-xs text-green-600 font-medium">✓ CPF válido</p>
      )}
    </div>
  )
}
