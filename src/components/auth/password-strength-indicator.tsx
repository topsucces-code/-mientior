'use client'

import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress-bar'
import {
  checkPasswordStrength,
  PasswordStrength,
  type PasswordStrengthResult,
} from '@/lib/password-validation'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const [strengthResult, setStrengthResult] =
    useState<PasswordStrengthResult | null>(null)

  useEffect(() => {
    if (!password) {
      setStrengthResult(null)
      return
    }

    const result = checkPasswordStrength(password)
    setStrengthResult(result)
  }, [password])

  if (!password || !strengthResult) {
    return null
  }

  const getStrengthColor = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 'error'
      case PasswordStrength.FAIR:
        return 'warning'
      case PasswordStrength.GOOD:
        return 'warning'
      case PasswordStrength.STRONG:
        return 'success'
      default:
        return 'default'
    }
  }

  const getStrengthLabel = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 'Faible'
      case PasswordStrength.FAIR:
        return 'Moyen'
      case PasswordStrength.GOOD:
        return 'Bon'
      case PasswordStrength.STRONG:
        return 'Fort'
      default:
        return ''
    }
  }

  const getStrengthTextColor = (strength: PasswordStrength) => {
    switch (strength) {
      case PasswordStrength.WEAK:
        return 'text-red-600'
      case PasswordStrength.FAIR:
        return 'text-yellow-600'
      case PasswordStrength.GOOD:
        return 'text-yellow-600'
      case PasswordStrength.STRONG:
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  // Check individual requirements
  const requirements = [
    {
      label: 'Au moins 8 caractères',
      met: password.length >= 8,
    },
    {
      label: 'Une lettre majuscule',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Une lettre minuscule',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Un chiffre',
      met: /[0-9]/.test(password),
    },
    {
      label: 'Un caractère spécial',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ]

  return (
    <div className={cn('space-y-3', className)}>
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Force du mot de passe</span>
          <span
            className={cn(
              'text-xs font-medium',
              getStrengthTextColor(strengthResult.strength)
            )}
          >
            {getStrengthLabel(strengthResult.strength)}
          </span>
        </div>
        <ProgressBar
          value={strengthResult.score}
          variant={getStrengthColor(strengthResult.strength)}
          size="sm"
        />
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1.5">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <X className="h-3.5 w-3.5 text-gray-400" />
            )}
            <span
              className={cn(
                'transition-colors',
                req.met ? 'text-green-600' : 'text-gray-600'
              )}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
