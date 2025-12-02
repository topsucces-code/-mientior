/**
 * Conflict Notification Component
 * Displays cart conflicts detected during synchronization
 */

'use client'

import { useState } from 'react'
import type { ConflictReport } from '@/lib/cart-conflict-resolver'
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ConflictNotificationProps {
  conflicts: ConflictReport[]
}

export function ConflictNotification({ conflicts }: ConflictNotificationProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  if (conflicts.length === 0) return null

  const activateConflicts = conflicts.filter(c => !dismissed.has(c.itemId))

  if (activateConflicts.length === 0) return null

  // Group conflicts by type
  const groupedConflicts = activateConflicts.reduce((acc, conflict) => {
    if (!acc[conflict.type]) {
      acc[conflict.type] = []
    }
    acc[conflict.type].push(conflict)
    return acc
  }, {} as Record<string, ConflictReport[]>)

  const handleDismiss = (itemId: string) => {
    setDismissed(prev => new Set([...prev, itemId]))
  }

  const handleDismissAll = (type: string) => {
    const itemIds = groupedConflicts[type]?.map(c => c.itemId) || []
    setDismissed(prev => new Set([...prev, ...itemIds]))
  }

  return (
    <div className="space-y-3">
      {/* Product Deleted Conflicts */}
      {groupedConflicts.PRODUCT_DELETED && groupedConflicts.PRODUCT_DELETED.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Produits indisponibles</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismissAll('PRODUCT_DELETED')}
              className="h-6 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {groupedConflicts.PRODUCT_DELETED.map(conflict => (
                <li key={conflict.itemId} className="flex items-start justify-between">
                  <span>{conflict.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(conflict.itemId)}
                    className="h-5 px-1 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Stock Insufficient Conflicts */}
      {groupedConflicts.STOCK_INSUFFICIENT && groupedConflicts.STOCK_INSUFFICIENT.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Stock limité</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismissAll('STOCK_INSUFFICIENT')}
              className="h-6 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {groupedConflicts.STOCK_INSUFFICIENT.map(conflict => (
                <li key={conflict.itemId} className="flex items-start justify-between">
                  <span>
                    {conflict.message}
                    {conflict.oldValue && conflict.newValue && (
                      <span className="text-muted-foreground ml-1">
                        (ajusté de {conflict.oldValue} à {conflict.newValue})
                      </span>
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(conflict.itemId)}
                    className="h-5 px-1 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Price Changed Conflicts */}
      {groupedConflicts.PRICE_CHANGED && groupedConflicts.PRICE_CHANGED.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>Prix mis à jour</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismissAll('PRICE_CHANGED')}
              className="h-6 px-2"
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {groupedConflicts.PRICE_CHANGED.map(conflict => (
                <li key={conflict.itemId} className="flex items-start justify-between">
                  <span>{conflict.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(conflict.itemId)}
                    className="h-5 px-1 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
