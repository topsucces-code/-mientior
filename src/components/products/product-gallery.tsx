'use client'

/**
 * Sophisticated product gallery with lightbox, zoom, and 360° view support
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Product360Viewer } from '@/components/products/product-360-viewer'
import { ProductVideoPlayer } from '@/components/products/product-video-player'
import { ARPreviewButton } from '@/components/products/ar-preview-button'
import type { ProductImage } from '@/types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
  has360View?: boolean
  hasVideo?: boolean
  userPhotos?: Array<{ url: string; userName: string }>
  arModelUrl?: string
}

export function ProductGallery({
  images,
  productName,
  has360View = false,
  hasVideo = false,
  userPhotos = [],
  arModelUrl,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState<1 | 2 | 4>(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  // Mobile carousel state
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center' })
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [selectedEmblaIndex, setSelectedEmblaIndex] = useState(0)

  const imageRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()

  // After guard, we know images.length > 0, so currentImage is safe (unless empty which is handled below)
  const currentImage = images.length > 0 ? images[selectedIndex]! : null

  // Embla carousel effect
  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedEmblaIndex(emblaApi.selectedScrollSnap())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    
    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()
    emblaApi.on('select', onSelect)
    
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  // Reset pan when zoom changes
  useEffect(() => {
    setPanPosition({ x: 0, y: 0 })
  }, [zoomLevel, selectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setIsLightboxOpen(false)
          break
        case 'ArrowLeft':
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
          break
        case 'ArrowRight':
          setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, images.length])

  // Early guard: handle empty images case
  if (images.length === 0 || !currentImage) {
    return (
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative aspect-square bg-platinum-100 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="text-center text-nuanced-500">
              <p className="text-lg font-medium mb-2">Aucune image disponible</p>
              <p className="text-sm">Les images de ce produit seront bientôt disponibles</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle mouse move for zoom pan
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel === 1 || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2

    setPanPosition({ x: -x * 50, y: -y * 50 })
  }

  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index)
    setZoomLevel(1)
  }

  const handleMainImageClick = () => {
    if (zoomLevel === 1) {
      setIsLightboxOpen(true)
    }
  }

  const handleZoomToggle = () => {
    if (zoomLevel === 1) setZoomLevel(2)
    else if (zoomLevel === 2) setZoomLevel(4)
    else setZoomLevel(1)
  }

  const nextImage = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
    setZoomLevel(1)
  }

  const prevImage = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
    setZoomLevel(1)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Thumbnails - Hidden on mobile */}
      <div className="hidden md:flex order-2 lg:order-1 lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] scrollbar-thin">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => handleThumbnailClick(index)}
            onMouseEnter={() => !prefersReducedMotion && setSelectedIndex(index)}
            className={`relative flex-shrink-0 w-20 h-20 lg:w-24 lg:h-24 rounded-lg border-2 transition-all overflow-hidden ${
              index === selectedIndex
                ? 'border-orange-500 ring-2 ring-orange-500/20'
                : 'border-platinum-300 hover:border-orange-300'
            }`}
            aria-label={`View image ${index + 1}`}
          >
            <Image
              src={image.thumbnail || image.url}
              alt={`${productName} thumbnail ${index + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
            {image.type === 'video' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            )}
            {image.type === '360' && (
              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-xs py-0.5 text-center">
                360°
              </div>
            )}
          </button>
        ))}

        {/* User Photos Section */}
        {userPhotos.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <p className="text-xs text-nuanced-600 font-medium mb-2">Photos clients</p>
            {userPhotos.slice(0, 3).map((photo, index) => (
              <button
                key={index}
                className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-lg border border-platinum-300 hover:border-orange-300 overflow-hidden mb-2 transition-all"
                aria-label={`Customer photo by ${photo.userName}`}
              >
                <Image src={photo.url} alt={`Photo by ${photo.userName}`} fill className="object-cover" sizes="96px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Image */}
      <div className="order-1 lg:order-2 flex-1">
        {/* Desktop view with zoom functionality */}
        <div
          ref={imageRef}
          className={`hidden md:block relative aspect-square bg-platinum-100 rounded-lg overflow-hidden group ${
            currentImage.type === 'image' ? 'cursor-zoom-in' : ''
          }`}
          onMouseEnter={() => currentImage.type === 'image' && setIsHovering(true)}
          onMouseLeave={() => {
            if (currentImage.type === 'image') {
              setIsHovering(false)
              setZoomLevel(1)
            }
          }}
          onMouseMove={currentImage.type === 'image' ? handleMouseMove : undefined}
          onClick={currentImage.type === 'image' ? handleMainImageClick : undefined}
        >
          {/* Render component based on media type */}
          {currentImage.type === '360' && currentImage.frames ? (
            <Product360Viewer images={currentImage.frames} productName={productName} />
          ) : currentImage.type === 'video' && currentImage.videoUrl ? (
            <ProductVideoPlayer
              videoUrl={currentImage.videoUrl}
              posterUrl={currentImage.thumbnail || currentImage.url}
              productName={productName}
            />
          ) : (
            <Image
              src={currentImage.url}
              alt={currentImage.alt || productName}
              fill
              className="object-contain transition-transform duration-300"
              style={{
                transform: `scale(${zoomLevel}) translate(${panPosition.x}%, ${panPosition.y}%)`,
              }}
              sizes="(max-width: 768px) 100vw, 60vw"
              priority
            />
          )}

          {/* Badges Overlay */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {hasVideo && (
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Play className="w-4 h-4" />
                Vidéo disponible
              </div>
            )}
            {has360View && (
              <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">Vue 360° disponible</div>
            )}
          </div>

          {/* Zoom Controls (visible on hover, only for static images) */}
          {isHovering && currentImage.type === 'image' && (
            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoomToggle()
                }}
                className="bg-white/90 hover:bg-white p-2 rounded-full shadow-elevation-2 transition-all"
                aria-label={zoomLevel > 1 ? 'Zoom out' : 'Zoom in'}
              >
                {zoomLevel > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* AR Preview Button (bottom-left overlay) */}
          {arModelUrl && (
            <div className="absolute bottom-4 left-4 z-10">
              <ARPreviewButton modelUrl={arModelUrl} productName={productName} />
            </div>
          )}

          {/* Navigation Arrows (desktop) */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-elevation-2 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-elevation-2 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <div className="overflow-hidden rounded-lg" ref={emblaRef}>
            <div className="flex">
              {images.map((image, index) => (
                <div key={index} className="flex-shrink-0 w-full">
                  <div className="relative aspect-square bg-platinum-100">
                    {image.type === '360' && image.frames ? (
                      <Product360Viewer images={image.frames} productName={productName} />
                    ) : image.type === 'video' && image.videoUrl ? (
                      <ProductVideoPlayer
                        videoUrl={image.videoUrl}
                        posterUrl={image.thumbnail || image.url}
                        productName={productName}
                      />
                    ) : (
                      <Image
                        src={image.url}
                        alt={image.alt || productName}
                        fill
                        className="object-contain"
                        sizes="100vw"
                        priority={index === 0}
                        onClick={() => setIsLightboxOpen(true)}
                      />
                    )}

                    {/* Badges for mobile */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {hasVideo && index === 0 && (
                        <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Play className="w-4 h-4" />
                          Vidéo
                        </div>
                      )}
                      {has360View && index === 0 && (
                        <div className="bg-black/70 text-white px-3 py-1 rounded-full text-sm">Vue 360°</div>
                      )}
                    </div>

                    {/* AR Preview for mobile */}
                    {arModelUrl && index === 0 && (
                      <div className="absolute bottom-4 left-4 z-10">
                        <ARPreviewButton modelUrl={arModelUrl} productName={productName} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination dots */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === selectedEmblaIndex ? 'bg-orange-500 w-6' : 'bg-platinum-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Image Counter */}
        <div className="text-center mt-2 text-sm text-nuanced-600">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-orange-500 transition-colors z-10"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentImage.url}
              alt={currentImage.alt || productName}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {/* Lightbox Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Lightbox Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                    index === selectedIndex ? 'border-orange-500' : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  <Image src={image.thumbnail || image.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
