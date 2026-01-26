// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/ui/product-card'

// Mock dependencies
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} alt={props.alt} />,
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    if (key === 'ratedOutOf5' && params) {
      return `Rated ${params.rating} out of ${params.max} stars`
    }
    return key
  },
}))

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: any[]) => inputs.join(' '),
}))

vi.mock('@/stores/cart.store', () => ({
  useCartStore: (selector: any) => selector({ addItem: vi.fn() }),
}))

vi.mock('@/stores/wishlist.store', () => ({
  useWishlistStore: () => ({
    addItem: vi.fn(),
    removeItem: vi.fn(),
    isInWishlist: () => false,
  }),
}))

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}))

vi.mock('@/hooks/use-currency', () => ({
  useCurrency: () => ({
    formatPrice: (price: number) => `$${price}`,
  }),
}))

describe('ProductCard Accessibility', () => {
  it('should have accessible star rating', () => {
    render(
      <ProductCard
        id="1"
        name="Test Product"
        slug="test-product"
        price={100}
        rating={4.5}
        reviewCount={10}
      />
    )

    // Check for the accessible star rating
    // This expects role="img" and aria-label="Rated 4.5 out of 5 stars"
    const ratingElement = screen.getByRole('img', { name: /rated 4.5 out of 5 stars/i })
    expect(ratingElement).toBeDefined()
  })
})
