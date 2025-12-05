'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Package } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  showPlaceholderIcon?: boolean
}

const PLACEHOLDER_IMAGE = '/images/placeholder.svg'

export function ProductImage({ 
  src, 
  alt, 
  fill = false, 
  width, 
  height, 
  className = '',
  priority = false,
  showPlaceholderIcon = true,
}: ProductImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Handle relative URLs - ensure they start with /
  const getImageSrc = (url: string) => {
    if (url.startsWith('http')) return url
    if (url.startsWith('/')) return url
    return `/${url}`
  }

  // If no src or error occurred, show placeholder
  const showFallback = !src || error

  if (fill) {
    if (showFallback) {
      return (
        <div className={`absolute inset-0 flex items-center justify-center bg-platinum-100 ${className}`}>
          {showPlaceholderIcon ? (
            <Package className="h-12 w-12 text-platinum-400" />
          ) : (
            <Image
              src={PLACEHOLDER_IMAGE}
              alt={alt}
              fill
              className="object-contain p-8"
            />
          )}
        </div>
      )
    }

    return (
      <>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-platinum-100">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-platinum-300 border-t-orange-500" />
          </div>
        )}
        <Image
          src={getImageSrc(src)}
          alt={alt}
          fill
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
          onError={() => setError(true)}
          onLoad={() => setLoading(false)}
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </>
    )
  }

  // Non-fill mode
  if (showFallback) {
    return (
      <div 
        className={`flex items-center justify-center bg-platinum-100 ${className}`}
        style={{ width, height }}
      >
        <Package className="h-8 w-8 text-platinum-400" />
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div 
          className="flex items-center justify-center bg-platinum-100"
          style={{ width, height }}
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-platinum-300 border-t-orange-500" />
        </div>
      )}
      <Image
        src={getImageSrc(src)}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${loading ? 'hidden' : 'block'}`}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        priority={priority}
      />
    </>
  )
}
