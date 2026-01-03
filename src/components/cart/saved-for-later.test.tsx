
import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SavedForLater } from '@/components/cart/saved-for-later'
import { TooltipProvider } from '@/components/ui/tooltip'

// @vitest-environment jsdom

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

vi.mock('lucide-react', () => ({
  ShoppingCart: () => <span>ShoppingCart</span>,
  Trash2: () => <span>Trash2</span>,
  Heart: () => <span>Heart</span>,
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

const mockItems = [
  {
    id: '1',
    productId: 'prod_1',
    productName: 'Test Product',
    productSlug: 'test-product',
    productImage: '/test-image.jpg',
    price: 1000,
    quantity: 1,
    inStock: true,
    addedAt: new Date(),
  },
]

describe('SavedForLater', () => {
  it('renders correctly', () => {
    render(
      <TooltipProvider>
        <SavedForLater
          items={mockItems}
          onMoveToCart={vi.fn()}
          onRemove={vi.fn()}
        />
      </TooltipProvider>
    )

    expect(screen.getByText('Articles sauvegardés (1)')).toBeDefined()
    expect(screen.getByText('Test Product')).toBeDefined()
  })

  it('has accessible remove button', () => {
    render(
      <TooltipProvider>
        <SavedForLater
          items={mockItems}
          onMoveToCart={vi.fn()}
          onRemove={vi.fn()}
        />
      </TooltipProvider>
    )

    const removeButton = screen.getByLabelText('Supprimer de la liste')
    expect(removeButton).toBeDefined()
  })

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn()
    render(
      <TooltipProvider>
        <SavedForLater
          items={mockItems}
          onMoveToCart={vi.fn()}
          onRemove={onRemove}
        />
      </TooltipProvider>
    )

    const removeButton = screen.getByLabelText('Supprimer de la liste')
    fireEvent.click(removeButton)
    expect(onRemove).toHaveBeenCalledWith('1')
  })
})
