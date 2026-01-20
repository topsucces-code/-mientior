'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Trash2, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { SavedForLaterItem } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface SavedForLaterProps {
  items: SavedForLaterItem[]
  onMoveToCart: (id: string) => void
  onRemove: (id: string) => void
  className?: string
}

export function SavedForLater({ items, onMoveToCart, onRemove, className }: SavedForLaterProps) {
  const { toast } = useToast()

  const handleMoveToCart = (item: SavedForLaterItem) => {
    if (!item.inStock) {
      toast({
        title: 'Article en rupture de stock',
        description: "Cet article n'est pas disponible actuellement.",
        variant: 'destructive',
      })
      return
    }
    onMoveToCart(item.id)
    toast({
      title: 'Article ajouté au panier',
      description: `${item.productName} a été déplacé vers votre panier.`,
      variant: 'default',
    })
  }

  const handleRemove = (item: SavedForLaterItem) => {
    onRemove(item.id)
    toast({
      title: 'Article supprimé',
      description: `${item.productName} a été retiré de vos articles sauvegardés.`,
      variant: 'default',
    })
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-orange-500" />
        <h2 className="text-anthracite-700 text-lg font-semibold">
          Articles sauvegardés ({items.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="p-4 transition-shadow hover:shadow-elevation-2">
            <div className="space-y-3">
              {/* Product Image */}
              <Link
                href={`/products/${item.productSlug}`}
                className="aspect-square relative block w-full overflow-hidden rounded-md bg-platinum-100"
              >
                {item.productImage ? (
                  <Image
                    src={item.productImage || ''}
                    alt={item.productName || ''}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-nuanced-500 text-xs">No image</span>
                  </div>
                )}
                {item.badge && (
                  <Badge className="absolute left-2 top-2 text-xs" variant="secondary">
                    {item.badge}
                  </Badge>
                )}
              </Link>

              {/* Product Info */}
              <div className="space-y-2">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="text-anthracite-700 line-clamp-2 text-sm font-medium transition-colors hover:text-orange-500"
                >
                  {item.productName}
                </Link>

                {/* Variant Info */}
                {item.variant && (
                  <div className="text-nuanced-600 flex flex-wrap gap-1 text-xs">
                    {item.variant.size && <span>Taille: {item.variant.size}</span>}
                    {item.variant.color && <span>• Couleur: {item.variant.color}</span>}
                  </div>
                )}

                {/* Stock Badge */}
                {item.inStock ? (
                  <Badge
                    variant="outline"
                    className="border-turquoise-200 bg-turquoise-50 text-xs text-turquoise-700"
                  >
                    En stock
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-red-200 bg-red-50 text-xs text-red-700"
                  >
                    Rupture de stock
                  </Badge>
                )}

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-orange-500">
                    {formatCurrency(item.price)}
                  </span>
                  {item.compareAtPrice && item.compareAtPrice > item.price && (
                    <span className="text-nuanced-500 text-xs line-through">
                      {formatCurrency(item.compareAtPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleMoveToCart(item)}
                  disabled={!item.inStock}
                >
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  Ajouter au panier
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-nuanced-500 hover:text-red-600"
                  onClick={() => handleRemove(item)}
                  aria-label="Supprimer l'article"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
