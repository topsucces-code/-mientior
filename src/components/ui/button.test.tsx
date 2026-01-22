// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeTruthy()
  })

  it('shows loader when loading is true', () => {
    render(<Button loading>Click me</Button>)
    // Loader2 renders an svg, but it doesn't have a default role or title that is easily queryable
    // without knowing implementation details.
    // However, the button should be disabled.
    const button = screen.getByRole('button')
    expect(button.disabled).toBe(true)

    // We can check if the SVG is present.
    // The Loader2 component from lucide-react usually renders an svg with class lucide-loader-2
    // My implementation adds "animate-spin" class.
    const loader = button.querySelector('.animate-spin')
    expect(loader).toBeTruthy()
  })

  it('does not show loader when loading is false', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    const loader = button.querySelector('.animate-spin')
    expect(loader).toBeNull()
  })

  it('is disabled when loading is true', () => {
    render(<Button loading>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button.disabled).toBe(true)
  })

  it('respects original disabled prop', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button.disabled).toBe(true)
  })
})
