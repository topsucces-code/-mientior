"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  formatCardNumber,
  validateCardNumber,
  detectCardType,
  type CardType,
} from '@/lib/checkout-validation'
import { CreditCard } from 'lucide-react'
import Image from 'next/image'

interface CardInputProps {
  value: string
  onChange: (value: string) => void
  onCardTypeDetected?: (cardType: CardType) => void
  className?: string
  placeholder?: string
  disabled?: boolean
  error?: string
}

const cardLogos: Record<CardType, string | null> = {
  visa: '/icons/visa.svg',
  mastercard: '/icons/mastercard.svg',
  amex: '/icons/amex.svg',
  discover: '/icons/discover.svg',
  unknown: null,
}

export function CardInput({
  value,
  onChange,
  onCardTypeDetected,
  className,
  placeholder = 'Numéro de carte',
  disabled = false,
  error,
}: CardInputProps) {
  const [cardType, setCardType] = React.useState<CardType>('unknown')
  const [isValid, setIsValid] = React.useState<boolean | null>(null)

  // Format and validate card as user types
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const formatted = formatCardNumber(rawValue)
    onChange(formatted)

    // Detect card type
    const detectedType = detectCardType(formatted.replace(/\s/g, ''))
    setCardType(detectedType)
    onCardTypeDetected?.(detectedType)

    // Validate if complete
    if (formatted.replace(/\s/g, '').length >= 13) {
      const valid = validateCardNumber(formatted.replace(/\s/g, ''))
      setIsValid(valid)
    } else {
      setIsValid(null)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={19} // 16 digits + 3 spaces
        inputMode="numeric"
        className={cn(
          'h-12 pr-12',
          isValid === false && 'border-red-500 focus-visible:ring-red-500',
          isValid === true && 'border-success focus-visible:ring-success'
        )}
        aria-label="Numéro de carte bancaire"
        aria-invalid={isValid === false}
        aria-describedby={error ? 'card-error' : undefined}
      />

      {/* Card Type Icon */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {cardType !== 'unknown' && cardLogos[cardType] ? (
          <Image
            src={cardLogos[cardType]!}
            alt={cardType}
            width={32}
            height={20}
            className="h-5 w-auto"
          />
        ) : (
          <CreditCard className="h-5 w-5 text-nuanced-400" />
        )}
      </div>

      {/* Validation Status */}
      {isValid !== null && (
        <div className="mt-1 text-xs">
          {isValid ? (
            <span className="text-success">✓ Numéro de carte valide</span>
          ) : (
            <span className="text-red-600">✗ Numéro de carte invalide</span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p id="card-error" className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
