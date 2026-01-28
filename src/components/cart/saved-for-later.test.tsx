// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SavedForLater } from './saved-for-later'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { SavedForLaterItem } from '@/types'

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => <div role="img" {...props} />
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>
}))

// Mock use-toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}))

describe('SavedForLater', () => {
  const mockItems: SavedForLaterItem[] = [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Test Product',
      productSlug: 'test-product',
      productImage: '/test.jpg',
      price: 1000,
      quantity: 1,
      stock: 10,
      inStock: true,
      savedAt: new Date().toISOString()
    }
  ]

  const mockHandlers = {
    onMoveToCart: vi.fn(),
    onRemove: vi.fn()
  }

  it('renders remove button with accessible label', () => {
    render(
      <TooltipProvider>
        <SavedForLater
            items={mockItems}
            {...mockHandlers}
        />
      </TooltipProvider>
    )

    // Check for aria-label
    // This assertion is expected to FAIL initially, until we implement the fix
    const removeButton = screen.getByLabelText("Supprimer l'article")
    expect(removeButton).toBeTruthy()
  })
})
