import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  defaultAreaCode?: string
  className?: string
  required?: boolean
  label?: string
  error?: string
}

export function PhoneInput({
  value,
  onChange,
  defaultAreaCode = '16',
  className = '',
  required = false,
  label = 'Telefone',
  error
}: PhoneInputProps) {
  // Derived state from value prop
  const parseValue = () => {
    if (value && value.startsWith('+55')) {
      const withoutCountry = value.substring(3)
      return {
        areaCode: withoutCountry.substring(0, 2),
        phoneNumber: withoutCountry.substring(2)
      }
    }
    return {
      areaCode: defaultAreaCode,
      phoneNumber: ''
    }
  }

  const { areaCode, phoneNumber } = parseValue()

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '')
    const limited = cleaned.substring(0, 9)
    if (areaCode) {
      onChange(`+55${areaCode}${limited}`)
    }
  }

  const handleAreaCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '')
    const limited = cleaned.substring(0, 2)
    onChange(`+55${limited}${phoneNumber}`)
  }

  const formatPhoneNumber = (num: string) => {
    if (num.length <= 4) return num
    if (num.length <= 8) return `${num.substring(0, 4)}-${num.substring(4)}`
    return `${num.substring(0, 5)}-${num.substring(5)}`
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        {/* Country Code - Fixed */}
        <div className="w-16">
          <Input
            value="+55"
            disabled
            className="bg-slate-100 text-slate-600 font-medium text-center cursor-not-allowed"
          />
        </div>

        {/* Area Code - Editable */}
        <div className="w-16">
          <Input
            value={areaCode}
            onChange={handleAreaCodeChange}
            placeholder="16"
            maxLength={2}
            className="text-center"
            required={required}
          />
        </div>

        {/* Phone Number */}
        <div className="flex-1">
          <Input
            value={formatPhoneNumber(phoneNumber)}
            onChange={handlePhoneNumberChange}
            placeholder="99999-9999"
            className={className}
            required={required}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      <p className="text-xs text-slate-500">
        Formato: +55 (DDD) 99999-9999
      </p>
    </div>
  )
}
