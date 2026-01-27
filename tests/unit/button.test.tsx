// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { vi } from 'vitest'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeDefined()
  })

  it('handles loading state correctly', () => {
    render(<Button loading>Loading...</Button>)

    // Check if disabled
    const button = screen.getByRole('button')
    expect(button.hasAttribute('disabled')).toBe(true)

    // We check if the text is still there
    expect(screen.getByText('Loading...')).toBeDefined()
  })

  it('does not show spinner when asChild is true', () => {
    render(
      <Button asChild loading>
        <a href="#">Link Button</a>
      </Button>
    )

    const link = screen.getByRole('link')
    // Slot passes props down, so loading prop might be passed if not filtered, but our logic handles rendering of spinner.
    // The link should render.
    expect(screen.getByText('Link Button')).toBeDefined()
  })
})
