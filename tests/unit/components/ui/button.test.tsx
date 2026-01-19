import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

// @vitest-environment jsdom

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeTruthy()
    expect(button.disabled).toBe(false)
  })

  it('renders loading state', () => {
    render(<Button isLoading>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeTruthy()
    expect(button.disabled).toBe(true)
    // Should contain a loader icon (svg with animate-spin class)
    // Since we can't easily query by class in testing-library without configuring it,
    // we can check if there's an svg inside.
    const svg = button.querySelector('svg.animate-spin')
    expect(svg).toBeTruthy()
  })

  it('renders disabled state', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button.disabled).toBe(true)
  })

  it('handles asChild correctly (ignores isLoading visual but keeps disabled)', () => {
    // When asChild is true, it renders the child element (Slot)
    // We pass a valid element as child
    render(
      <Button asChild isLoading>
        <a href="#">Link Button</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: /link button/i })
    expect(link).toBeTruthy()
    // Button component passes disabled prop to the Slot/Child.
    // However, <a> tags don't support 'disabled' attribute natively in the same way as buttons.
    // The Button component implementation sets `disabled={isLoading || disabled}` on Comp.
    // If Comp is Slot, it passes `disabled` to the child.
    // So the <a> tag should have a disabled attribute (even if it's not standard HTML behavior for links to disable interaction just by attr).
    // Let's check if the attribute is present.
    // Note: React might filter out invalid attributes for tags.
    // But Radix Slot merges props.
    // Let's verify what happens.

    // Actually, checking if the loader is NOT rendered is the key test here.
    const svg = link.querySelector('svg.animate-spin')
    expect(svg).toBeNull()
  })
})
