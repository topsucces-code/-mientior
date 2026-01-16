// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import React from 'react'

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDefined()
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading...</Button>)
    const button = screen.getByRole('button')

    // Check if button is disabled
    expect(button.hasAttribute('disabled')).toBe(true)

    // Check for the spinner.
    const svg = button.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.classList.contains('animate-spin')).toBe(true)
  })

  it('does not show loading spinner when isLoading is false', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')

    expect(button.hasAttribute('disabled')).toBe(false)
    const svg = button.querySelector('svg')
    expect(svg).toBeNull()
  })

  it('does not show loading spinner when asChild is true', () => {
    render(
      <Button asChild isLoading>
        <a href="/test">Link</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: /link/i })

    const svg = link.querySelector('svg')
    expect(svg).toBeNull()
  })
})
