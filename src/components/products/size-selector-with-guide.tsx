'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { SizeGuideModal, SizeGuideData } from './size-guide-modal'
import { shouldShowSizeGuideLink } from './size-guide-link-visibility.test'

interface ProductVariant {
  id: string
  size?: string
  color?: string
  stock: number
  sku: string
  priceModifier: number
}

interface Product {
  id: string
  name: string
  variants: ProductVariant[]
}

interface SizeSelectorWithGuideProps {
  product: Product
  sizeGuide: SizeGuideData | null
  selectedSize?: string
  onSizeChange: (size: string) => void
}

/**
 * Size selector component with integrated size guide link
 * Implements requirements 5.1 and 5.5
 */
export function SizeSelectorWithGuide({
  product,
  sizeGuide,
  selectedSize,
  onSizeChange,
}: SizeSelectorWithGuideProps) {
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  // Get unique sizes from variants
  const sizes = Array.from(
    new Set(
      product.variants
        .filter((v) => v.size && v.size.trim() !== '')
        .map((v) => v.size!)
    )
  )

  // Determine if size guide link should be shown (Requirement 5.1)
  const showSizeGuide = shouldShowSizeGuideLink(product)

  const handleSizeSelect = (size: string) => {
    onSizeChange(size)
  }

  const handleSizeSelectFromGuide = (size: string) => {
    // Auto-select size in variant selector from guide (Requirement 5.5)
    onSizeChange(size)
  }

  if (sizes.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Size</label>
        {showSizeGuide && sizeGuide && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={() => setIsGuideOpen(true)}
          >
            <Info className="w-4 h-4 mr-1" />
            Size Guide
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize === size
          const variant = product.variants.find((v) => v.size === size)
          const isOutOfStock = variant ? variant.stock === 0 : false

          return (
            <Button
              key={size}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              disabled={isOutOfStock}
              onClick={() => handleSizeSelect(size)}
              className="min-w-[60px]"
            >
              {size}
            </Button>
          )
        })}
      </div>

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        sizeGuide={sizeGuide}
        onSizeSelect={handleSizeSelectFromGuide}
      />
    </div>
  )
}
