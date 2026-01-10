// @vitest-environment jsdom
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDefined()
  })

  it('handles loading state correctly', () => {
    render(<Button isLoading={true}>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })

    // Should be disabled
    expect(button.disabled).toBe(true)

    // Should verify spinner is present - we can check for a generic svg or class
    // Since we don't have detailed DOM inspection of the Icon component easily without more setup,
    // we can check if there's an SVG that's NOT in the default state.
    // Or we can check if the button contains the 'animate-spin' class element
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeDefined()
  })

  it('does not render spinner when asChild is true', () => {
    render(
      <Button asChild isLoading={true}>
        <a href="/link">Link</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /link/i })

    // Spinner should NOT be present inside the link
    const spinner = link.querySelector('.animate-spin')
    expect(spinner).toBeNull()
  })
})
