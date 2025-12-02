'use client'
import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { ToastKeyboardHandler } from '@/components/toast-keyboard-handler'
import { WishlistSyncInitializer } from '@/components/wishlist-sync-initializer'
import { CartSyncInitializer } from '@/components/cart-sync-initializer'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1
          }
        }
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WishlistSyncInitializer />
        <CartSyncInitializer />
        {children}
        <Toaster 
          position="top-right"
          expand={false}
          richColors={false}
          closeButton
          duration={5000}
          toastOptions={{
            classNames: {
              toast: 'auth-toast',
              title: 'auth-toast-title',
              description: 'auth-toast-description',
              actionButton: 'auth-toast-action',
              cancelButton: 'auth-toast-cancel',
              closeButton: 'auth-toast-close',
            },
          }}
        />
        <ToastKeyboardHandler />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </TooltipProvider>
    </QueryClientProvider>
  )
}
