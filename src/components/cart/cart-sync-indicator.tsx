/**
 * Cart Sync Indicator Component
 * Displays synchronization status and provides manual sync option
 */

'use client'

import { useCartSync } from '@/hooks/use-cart-sync'
import { Loader2, RefreshCw, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

function formatTimeAgo(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'à l\'instant'
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`
  return `il y a ${Math.floor(seconds / 86400)} j`
}

export function CartSyncIndicator() {
  const { isSyncing, lastSyncedAt, syncNow } = useCartSync()

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {isSyncing ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Synchronisation...</span>
        </div>
      ) : lastSyncedAt ? (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-xs">
            Synchronisé {formatTimeAgo(lastSyncedAt)}
          </span>
        </div>
      ) : null}

      {!isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={syncNow}
          className="h-8 px-2 text-xs"
          title="Synchroniser maintenant"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
