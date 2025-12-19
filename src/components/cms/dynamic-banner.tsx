'use client'

import { useEffect, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { CountdownTimer } from '@/components/ui/countdown-timer'

interface Banner {
  id: string
  title: string
  message: string
  backgroundColor?: string | null
  textColor?: string | null
  backgroundImage?: string | null
  link?: string | null
  linkText?: string | null
  position: 'TOP' | 'HERO' | 'SIDEBAR' | 'FOOTER' | 'POPUP'
  dismissible: boolean
  showCountdown: boolean
  endDate?: string | null
}

interface DynamicBannerProps {
  position?: 'TOP' | 'HERO' | 'SIDEBAR' | 'FOOTER' | 'POPUP'
  className?: string
  fallback?: React.ReactNode
}

export function DynamicBanner({ 
  position = 'TOP', 
  className,
  fallback 
}: DynamicBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch(`/api/cms/banners?position=${position}`)
        const data = await res.json()
        if (data.success) {
          setBanners(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Load dismissed banners from localStorage
    const savedDismissed = localStorage.getItem('dismissed_banners')
    if (savedDismissed) {
      setDismissed(new Set(JSON.parse(savedDismissed)))
    }

    fetchBanners()
  }, [position])

  // Rotate banners every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  const handleDismiss = (bannerId: string) => {
    const newDismissed = new Set(dismissed)
    newDismissed.add(bannerId)
    setDismissed(newDismissed)
    localStorage.setItem('dismissed_banners', JSON.stringify([...newDismissed]))
  }

  // Filter out dismissed banners
  const visibleBanners = banners.filter(b => !dismissed.has(b.id))

  if (isLoading) {
    return null // Or a skeleton
  }

  if (visibleBanners.length === 0) {
    return fallback || null
  }

  const banner = visibleBanners[currentIndex % visibleBanners.length]

  if (!banner) return null

  const style: React.CSSProperties = {
    background: banner.backgroundImage 
      ? `url(${banner.backgroundImage}) center/cover`
      : banner.backgroundColor || '#0891B2',
    color: banner.textColor || '#ffffff'
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        position === 'TOP' && 'h-10',
        position === 'HERO' && 'h-auto min-h-[200px]',
        position === 'POPUP' && 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
        className
      )}
      style={position !== 'POPUP' ? style : undefined}
    >
      {position === 'POPUP' ? (
        <div 
          className="relative max-w-lg rounded-lg p-6 shadow-xl"
          style={style}
        >
          {banner.dismissible && (
            <button
              onClick={() => handleDismiss(banner.id)}
              className="absolute right-2 top-2 rounded-full p-1 hover:bg-white/20 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">{banner.title}</p>
            <p className="mb-4">{banner.message}</p>
            {banner.showCountdown && banner.endDate && (
              <div className="mb-4">
                <CountdownTimer 
                  targetDate={banner.endDate} 
                  variant="card"
                  format="compact"
                />
              </div>
            )}
            {banner.link && (
              <Link 
                href={banner.link}
                className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 font-medium hover:bg-white/30 transition-colors"
              >
                {banner.linkText || 'En savoir plus'}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex-1 text-center text-sm font-medium flex items-center justify-center gap-4">
            <span dangerouslySetInnerHTML={{ __html: banner.message }} />
            {banner.showCountdown && banner.endDate && (
              <CountdownTimer 
                targetDate={banner.endDate} 
                variant="inline"
                format="compact"
              />
            )}
            {banner.link && (
              <Link 
                href={banner.link}
                className="inline-flex items-center gap-1 underline hover:no-underline"
              >
                {banner.linkText || 'Voir'}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          {banner.dismissible && (
            <button
              onClick={() => handleDismiss(banner.id)}
              className="hover:bg-white/20 p-1 rounded transition-colors ml-2"
              aria-label="Fermer la bannière"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Banner indicators for multiple banners */}
      {visibleBanners.length > 1 && position === 'TOP' && (
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-1">
          {visibleBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                'h-1 rounded-full transition-all',
                idx === currentIndex % visibleBanners.length
                  ? 'w-4 bg-white'
                  : 'w-1 bg-white/50'
              )}
              aria-label={`Bannière ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
