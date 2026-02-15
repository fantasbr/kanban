/**
 * Utilitários de Validação Centralizados
 * 
 * Objetivo: Padronizar validações em todo o sistema, garantindo segurança e consistência.
 * Utilizado por: Hooks de API, Formulários
 */

/**
 * Valida se uma string tem um tamanho mínimo
 * @param value Valor a ser validado
 * @param minLength Tamanho mínimo (padrão: 1)
 */
export function isValidString(value: string | undefined | null, minLength = 1): boolean {
  if (!value) return false
  return value.trim().length >= minLength
}

/**
 * Valida formato de Email
 * @param email Email a ser validado
 */
export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false
  // Regex robusto para validação de email
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Valida CPF (Cadastro de Pessoas Físicas)
 * Verifica formato e dígitos verificadores
 * @param cpf CPF a ser validado (com ou sem formatação)
 */
export function isValidCPF(cpf: string | undefined | null): boolean {
  if (!cpf) return false

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Verifica tamanho
  if (cleanCPF.length !== 11) return false

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(cleanCPF)) return false

  // Validação dos dígitos verificadores
  const calculateDigit = (slice: string) => {
    let sum = 0
    let weight = slice.length + 1

    for (let i = 0; i < slice.length; i++) {
      sum += parseInt(slice[i]) * weight--
    }

    const remainder = (sum * 10) % 11
    return remainder === 10 || remainder === 11 ? 0 : remainder
  }

  const digit1 = calculateDigit(cleanCPF.substring(0, 9))
  const digit2 = calculateDigit(cleanCPF.substring(0, 10))

  return (
    digit1 === parseInt(cleanCPF.substring(9, 10)) &&
    digit2 === parseInt(cleanCPF.substring(10, 11))
  )
}

/**
 * Valida CNPJ (Cadastro Nacional da Pessoa Jurídica)
 * Verifica formato e dígitos verificadores
 * @param cnpj CNPJ a ser validado (com ou sem formatação)
 */
export function isValidCNPJ(cnpj: string | undefined | null): boolean {
  if (!cnpj) return false

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')

  // Verifica tamanho
  if (cleanCNPJ.length !== 14) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false

  // Validação dos dígitos verificadores
  // Tamanho do CNPJ menos os dígitos verificadores
  const size = cleanCNPJ.length - 2
  const numbers = cleanCNPJ.substring(0, size)
  const digits = cleanCNPJ.substring(size)
  
  const calculateDigit = (nums: string, length: number) => {
    let sum = 0
    let pos = length - 7
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(nums.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }
    
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result
  }

  const digit1 = calculateDigit(numbers, size)
  const digit2 = calculateDigit(numbers + digit1, size + 1)

  return (
    digit1 === parseInt(digits.charAt(0)) &&
    digit2 === parseInt(digits.charAt(1))
  )
}

/**
 * Valida se um número é um ID válido (Inteiro positivo)
 * @param id ID a ser validado
 */
export function isValidId(id: number | undefined | null): boolean {
  if (id === undefined || id === null) return false
  return Number.isInteger(id) && id > 0
}
