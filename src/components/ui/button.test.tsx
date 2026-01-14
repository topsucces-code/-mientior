// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './button'
import React from 'react'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeDefined()
  })

  it('renders loading state when isLoading is true', () => {
    render(<Button isLoading>Click me</Button>)

    // Check if the button is disabled
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button.disabled).toBe(true)

    // Check if the loader is present
    const svg = button.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg?.classList.contains('animate-spin')).toBe(true)
  })

  it('does not render loader when asChild is true', () => {
    render(
      <Button asChild isLoading>
        <a href="#">Link Button</a>
      </Button>
    )

    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeDefined()

    // Check that there is no spinner
    const svg = link.querySelector('.animate-spin')
    expect(svg).toBeNull()
  })

  it('disables child when asChild is true and isLoading is true', () => {
    // Note: 'a' tags don't support disabled attribute in a standard way that testing-library checks via .disabled property on the element instance easily if it's not a form element.
    // However, we can check the attribute.
    // Or we can use a button as child.
    render(
        <Button asChild isLoading>
            <button>Custom Button</button>
        </Button>
    )

    const button = screen.getByRole('button', { name: /custom button/i })
    expect(button.disabled).toBe(true)
  })
})
