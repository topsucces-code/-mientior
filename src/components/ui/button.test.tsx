// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { describe, it, expect } from 'vitest'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDefined()
  })

  it('renders loading state correctly', () => {
    render(<Button isLoading>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button.disabled).toBe(true)
    // We can't easily check for the SVG without looking into the implementation details or adding an aria-label to the loader
    // But we can check if the button is disabled
  })

  it('renders children when loading', () => {
      render(<Button isLoading>Click me</Button>)
      screen.getByText('Click me')
  })
})
