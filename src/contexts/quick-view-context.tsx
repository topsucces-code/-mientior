'use client'

import * as React from 'react'
import { QuickViewModal } from '@/components/quick-view/quick-view-modal'

interface QuickViewContextValue {
  isOpen: boolean
  productId: string | null
  openQuickView: (productId: string) => void
  closeQuickView: () => void
}

const QuickViewContext = React.createContext<QuickViewContextValue | undefined>(undefined)

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [productId, setProductId] = React.useState<string | null>(null)

  const openQuickView = React.useCallback((id: string) => {
    setProductId(id)
    setIsOpen(true)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
  }, [])

  const closeQuickView = React.useCallback(() => {
    setIsOpen(false)
    setProductId(null)
    // Restore body scroll
    document.body.style.overflow = ''
  }, [])

  // Handle ESC key press globally
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeQuickView()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeQuickView])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <QuickViewContext.Provider value={{ isOpen, productId, openQuickView, closeQuickView }}>
      {children}
      <QuickViewModal 
        productId={productId} 
        isOpen={isOpen} 
        onClose={closeQuickView} 
      />
    </QuickViewContext.Provider>
  )
}

export function useQuickView() {
  const context = React.useContext(QuickViewContext)
  if (!context) {
    throw new Error('useQuickView must be used within QuickViewProvider')
  }
  return context
}
