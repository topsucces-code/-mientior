// @vitest-environment jsdom
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdvancedSearchBar } from './advanced-search-bar'

// Mock hooks
vi.mock('@/contexts/header-context', () => ({
  useHeader: vi.fn(() => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
  })),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    if (key === 'search') return 'Rechercher'
    return key
  },
}))

vi.mock('@/hooks/use-search-history', () => ({
  useSearchHistory: () => ({
    history: [],
    addToHistory: vi.fn(),
    removeFromHistory: vi.fn(),
    clearHistory: vi.fn(),
  }),
}))

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
})

describe('AdvancedSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders with accessible role and label', () => {
    render(<AdvancedSearchBar />)

    // Check for form role
    const form = screen.getByRole('search')
    expect(form).toBeTruthy()

    // Check for input label
    const input = screen.getByRole('textbox', { name: /rechercher/i })
    expect(input).toBeTruthy()
  })

  it('shows loading state when fetching suggestions', async () => {
    // Mock fetch to delay response
    global.fetch = vi.fn(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ suggestions: [] })
      } as Response), 500))
    )

    render(<AdvancedSearchBar />)
    const input = screen.getByRole('textbox', { name: /rechercher/i })

    // Type something
    fireEvent.change(input, { target: { value: 'iphone' } })

    // Advance timer past debounce (150ms)
    // Wrap in act to process state updates resulting from the timeout
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200)
    })

    // Now fetch should be called and loading should be true
    expect(screen.getByTestId('search-loader')).toBeTruthy()
    expect(screen.queryByTestId('search-icon')).toBeNull()
  })
})
