// @vitest-environment jsdom

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdvancedSearchBar } from './advanced-search-bar'

// Define mock functions
const mockSetSearchQuery = vi.fn()
const mockAddToHistory = vi.fn()
const mockRemoveFromHistory = vi.fn()
const mockClearHistory = vi.fn()

// Mock dependencies
vi.mock('@/contexts/header-context', () => ({
  useHeader: () => ({
    searchQuery: '', // Simplified: assumes controlled input logic is handled or we rely on the change event firing logic
    setSearchQuery: mockSetSearchQuery,
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('@/hooks/use-search-history', () => ({
  useSearchHistory: () => ({
    history: ['apple', 'banana', 'cherry'],
    addToHistory: mockAddToHistory,
    removeFromHistory: mockRemoveFromHistory,
    clearHistory: mockClearHistory,
  }),
}))

// Mock fetch
global.fetch = vi.fn()

describe('AdvancedSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window.location mock
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })
  })

  it('renders search input with correct ARIA roles', () => {
    render(<AdvancedSearchBar />)
    const input = screen.getByRole('combobox')
    expect(input).toBeTruthy()
    expect(input.getAttribute('aria-autocomplete')).toBe('list')
    expect(input.getAttribute('aria-expanded')).toBe('false') // Initially false (assuming history only shows on focus)
  })

  it('shows history on focus and allows keyboard navigation', async () => {
    render(<AdvancedSearchBar />)
    const input = screen.getByRole('combobox')

    // Focus to show history
    fireEvent.focus(input)

    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeTruthy()

    const options = screen.getAllByRole('option')
    expect(options.length).toBe(3)

    // Initial state: no selection
    expect(input.getAttribute('aria-activedescendant')).toBeNull()

    // Press ArrowDown -> select first 'apple'
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe('suggestion-0')
    expect(options[0].getAttribute('aria-selected')).toBe('true')
    expect(options[0].className).toContain('bg-gray-100') // Check visual highlight class

    // Press ArrowDown -> select second 'banana'
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe('suggestion-1')
    expect(options[1].getAttribute('aria-selected')).toBe('true')

    // Press ArrowUp -> select first 'apple'
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input.getAttribute('aria-activedescendant')).toBe('suggestion-0')
  })

  it('selects item with Enter key', async () => {
    render(<AdvancedSearchBar />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)

    // Select first item
    fireEvent.keyDown(input, { key: 'ArrowDown' })

    // Press Enter
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(mockSetSearchQuery).toHaveBeenCalledWith('apple')
    expect(mockAddToHistory).toHaveBeenCalledWith('apple')
    expect(window.location.href).toContain('/search?q=apple')
  })

  it('fetches and navigates suggestions', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        suggestions: [{ text: 'iphone' }, { text: 'ipad' }],
        metadata: {},
      }),
    })

    render(<AdvancedSearchBar />)
    const input = screen.getByRole('combobox')

    // Simulate typing
    fireEvent.change(input, { target: { value: 'ip' } })

    // Wait for debounce and fetch
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Verify suggestions list is shown
    const options = await screen.findAllByRole('option')
    expect(options.length).toBe(2)
    expect(options[0].textContent).toContain('iphone')

    // Navigate suggestions
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe('suggestion-0')

    // Enter on suggestion
    fireEvent.keyDown(input, { key: 'Enter' })

    // Should navigate to link (logic in component uses suggestion.link)
    // The link in component logic: /search?q=...
    expect(window.location.href).toContain('/search?q=iphone')
  })
})
