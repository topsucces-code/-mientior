'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PaymentIconProps {
  method: string
  className?: string
  size?: number
}

export function PaymentIcon({ method, className, size = 32 }: PaymentIconProps) {
  const getIcon = () => {
    switch (method.toLowerCase()) {
      // Mobile Money Africain
      case 'orange-money':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#FF6600"/>
            <path d="M8 12h16v8H8z" fill="white"/>
            <path d="M10 14h12v4H10z" fill="#FF6600"/>
            <path d="M14 10l2 12" stroke="white" strokeWidth="2"/>
          </svg>
        )
      
      case 'mtn-momo':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#FFB900"/>
            <path d="M8 8h16v16H8z" fill="white"/>
            <path d="M12 12h8v8h-8z" fill="#FFB900"/>
            <path d="M14 14h4v4h-4z" fill="white"/>
          </svg>
        )
      
      case 'm-pesa':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#00B388"/>
            <path d="M8 10h16v12H8z" fill="white"/>
            <path d="M12 14h8v4h-8z" fill="#00B388"/>
            <path d="M14 12l2 8" stroke="white" strokeWidth="2"/>
          </svg>
        )
      
      case 'wave':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#00D4AA"/>
            <path d="M6 16c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="10" cy="16" r="2" fill="white"/>
            <circle cx="22" cy="16" r="2" fill="white"/>
          </svg>
        )
      
      case 'moov-money':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#00A651"/>
            <path d="M8 12h16v8H8z" fill="white"/>
            <path d="M12 16h8" stroke="#00A651" strokeWidth="2"/>
            <circle cx="16" cy="16" r="3" fill="#00A651"/>
          </svg>
        )
      
      // Cartes bancaires
      case 'visa':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#1A1F71"/>
            <path d="M6 10h20v12H6z" fill="white"/>
            <path d="M8 12h5l1 6h-2l-0.5-3H10l-0.5 3H8l1-6z" fill="#1A1F71"/>
            <path d="M15 12h3l0.5 3h2l-1-3h3l1 6h-3l-0.5-3h-2l0.5 3H15l-1-6z" fill="#1A1F71"/>
          </svg>
        )
      
      case 'mastercard':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#EB001B"/>
            <circle cx="11" cy="16" r="6" fill="#EB001B"/>
            <circle cx="21" cy="16" r="6" fill="#F79E1B"/>
            <path d="M16 11a6 6 0 0 1 0 10 6 6 0 0 1 0-10z" fill="#FF5F00"/>
          </svg>
        )
      
      // Autres
      case 'paypal':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#003087"/>
            <path d="M8 10h6c2 0 3 1 3 3s-1 3-3 3h-4l-1 4H8l2-10z" fill="white"/>
            <path d="M14 16h4c2 0 3 1 3 3s-1 3-3 3h-3l-1-6z" fill="#009CDE"/>
          </svg>
        )
      
      case 'cash-on-delivery':
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#2ECC71"/>
            <path d="M8 12h16v8H8z" fill="white"/>
            <path d="M10 14h12v1H10z" fill="#2ECC71"/>
            <path d="M10 17h8v1H10z" fill="#2ECC71"/>
            <circle cx="22" cy="18" r="2" fill="#2ECC71"/>
          </svg>
        )
      
      default:
        return (
          <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect width="32" height="32" rx="4" fill="#94A3B8"/>
            <path d="M16 8l8 6-8 6-8-6 8-6z" fill="white"/>
            <circle cx="16" cy="16" r="3" fill="#94A3B8"/>
          </svg>
        )
    }
  }

  return getIcon()
}

interface PaymentIconsDisplayProps {
  methods?: string[]
  className?: string
  iconSize?: number
  showLabels?: boolean
}

const defaultMethods = [
  'orange-money',
  'mtn-momo', 
  'm-pesa',
  'wave',
  'visa',
  'mastercard',
  'cash-on-delivery'
]

export function PaymentIconsDisplay({ 
  methods = defaultMethods, 
  className,
  iconSize = 32,
  showLabels = false 
}: PaymentIconsDisplayProps) {
  const getLabel = (method: string) => {
    const labels: Record<string, string> = {
      'orange-money': 'Orange Money',
      'mtn-momo': 'MTN MoMo',
      'm-pesa': 'M-Pesa',
      'wave': 'Wave',
      'moov-money': 'Moov Money',
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'paypal': 'PayPal',
      'cash-on-delivery': 'Paiement à la livraison'
    }
    return labels[method.toLowerCase()] || method
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {methods.map((method) => (
        <div key={method} className="flex flex-col items-center gap-1">
          <PaymentIcon 
            method={method} 
            size={iconSize}
            className="transition-transform hover:scale-110"
          />
          {showLabels && (
            <span className="text-xs text-gray-600 text-center">
              {getLabel(method)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
