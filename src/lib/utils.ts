import clsx, { ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR')
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length = 140) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '…' : text
}

export function getInitials(name?: string) {
  if (!name) return ''
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Extract the number of days from a return policy string.
 * Supports French and English formats.
 * @param policy - Return policy string (e.g., "Retours gratuits sous 30 jours", "60 days return")
 * @returns Number of days, defaults to 30 if no match found
 * @example
 * extractReturnDays('Retours gratuits sous 30 jours') // 30
 * extractReturnDays('45 business days') // 45
 * extractReturnDays('Invalid text') // 30
 */
export function extractReturnDays(policy?: string): number {
  if (!policy) return 30
  
  // Match number followed by 'jour(s)' or 'day(s)', case insensitive
  const match = policy.match(/(\d+)\s*(?:jours?|days?)/i)
  
  if (match && match[1]) {
    const days = parseInt(match[1], 10)
    return isNaN(days) ? 30 : days
  }
  
  return 30
}

// New utility functions for sophisticated design

export function formatNumberAbbreviated(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
}

export function calculateDiscount(originalPrice: number, salePrice: number): string {
  if (originalPrice <= salePrice) return ''
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100)
  return `-${discount}%`
}

export function calculateTimeRemaining(targetDate: Date | string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const now = new Date()
  const total = target.getTime() - now.getTime()

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds, total }
}

export function generateStarRating(rating: number): ('full' | 'half' | 'empty')[] {
  const stars: ('full' | 'half' | 'empty')[] = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < fullStars; i++) {
    stars.push('full')
  }

  if (hasHalfStar) {
    stars.push('half')
  }

  while (stars.length < 5) {
    stars.push('empty')
  }

  return stars
}

export function getStockStatus(quantity: number): {
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  variant: 'default' | 'warning' | 'error'
  label: string
} {
  if (quantity === 0) {
    return { status: 'out-of-stock', variant: 'error', label: 'Rupture de stock' }
  }
  if (quantity <= 5) {
    return { status: 'low-stock', variant: 'warning', label: `Plus que ${quantity} en stock` }
  }
  return { status: 'in-stock', variant: 'default', label: 'En stock' }
}

export function getContrastColor(backgroundColor: string): 'black' | 'white' {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? 'black' : 'white'
}

export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => ReturnType<T> {
  let inThrottle: boolean
  let lastResult: ReturnType<T>

  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    if (!inThrottle) {
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
      lastResult = func(...args)
    }
    return lastResult
  }
}
