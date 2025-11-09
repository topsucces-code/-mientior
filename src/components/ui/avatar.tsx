'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string
  alt?: string
  fallback?: string | React.ReactNode
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  status?: 'online' | 'offline' | 'away' | 'busy'
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-xl',
}

const statusClasses = {
  online: 'bg-success',
  offline: 'bg-nuanced-500',
  away: 'bg-warning',
  busy: 'bg-error',
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ src, alt, fallback, size = 'md', status, className, ...props }, ref) => {
  // Generate deterministic color from fallback string for consistent avatars
  const getBackgroundColor = (str: string = '') => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = hash % 360
    return `hsl(${hue}, 65%, 50%)`
  }

  const fallbackText = typeof fallback === 'string' ? getInitials(fallback) : fallback

  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback
          className="flex h-full w-full items-center justify-center text-white font-semibold"
          style={{
            backgroundColor: getBackgroundColor(typeof fallback === 'string' ? fallback : ''),
          }}
        >
          {fallbackText}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            statusClasses[status],
            size === 'xs' && 'h-2 w-2',
            size === 'sm' && 'h-2.5 w-2.5',
            size === 'md' && 'h-3 w-3',
            size === 'lg' && 'h-3.5 w-3.5',
            size === 'xl' && 'h-4 w-4'
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  )
})

Avatar.displayName = 'Avatar'

export { Avatar }
export type { AvatarProps }
