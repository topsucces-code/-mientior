'use client'

import * as React from 'react'
import { cn, generateStarRating, formatNumberAbbreviated } from '@/lib/utils'

interface StarRatingProps extends React.HTMLAttributes<HTMLDivElement> {
  rating: number // 0-5
  reviewCount?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  interactive?: boolean
}

function StarRating({
  rating,
  reviewCount = 0,
  size = 'md',
  showCount = true,
  interactive = false,
  className,
  ...props
}: StarRatingProps) {
  const uniqueId = React.useId()
  const stars = generateStarRating(rating)

  const sizeClasses = {
    sm: { star: 'h-3.5 w-3.5', text: 'text-xs' },
    md: { star: 'h-4 w-4', text: 'text-sm' },
    lg: { star: 'h-5 w-5', text: 'text-base' },
  }

  const { star: starSize, text: textSize } = sizeClasses[size]

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      aria-label={`Rated ${rating} out of 5 stars based on ${reviewCount} reviews`}
      {...props}
    >
      <div className="flex items-center gap-0.5">
        {stars.map((starType, index) => (
          <svg
            key={index}
            className={cn(
              starSize,
              interactive && 'cursor-pointer transition-transform hover:scale-110'
            )}
            fill={starType === 'empty' ? 'none' : `url(#aurore-gradient-${uniqueId})`}
            stroke={starType === 'empty' ? 'currentColor' : 'none'}
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`aurore-gradient-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFC107" />
                <stop offset="100%" stopColor="#FFD54F" />
              </linearGradient>
              {starType === 'half' && (
                <clipPath id={`half-star-${uniqueId}-${index}`}>
                  <rect x="0" y="0" width="12" height="24" />
                </clipPath>
              )}
            </defs>
            <path
              clipPath={starType === 'half' ? `url(#half-star-${uniqueId}-${index})` : undefined}
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            />
            {starType === 'half' && (
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              />
            )}
          </svg>
        ))}
      </div>
      {showCount && (
        <span className={cn('text-nuanced-500 text-price', textSize)}>
          ({rating.toFixed(1)})
          {reviewCount > 0 && (
            <>
              {' '}
              • <span>{formatNumberAbbreviated(reviewCount)}</span>
            </>
          )}
        </span>
      )}
    </div>
  )
}

export { StarRating }
export type { StarRatingProps }
