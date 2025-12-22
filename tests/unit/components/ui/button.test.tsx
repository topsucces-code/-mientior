// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeTruthy()
    expect(button.textContent).toBe('Click me')
  })

  it('applies variant classes', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button', { name: /delete/i })
    expect(button.className).toContain('bg-destructive')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: /disabled/i })
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows loading spinner when loading is true', () => {
    render(<Button loading>Submit</Button>)
    const button = screen.getByRole('button', { name: /submit/i })
    expect(button).toBeTruthy()
    // Since I don't have jest-dom, I check disable attribute manually
    expect((button as HTMLButtonElement).disabled).toBe(true)
    // Check if spinner exists. Since it's an SVG, I can try to find it.
    // Lucide icons usually have class "lucide lucide-loader-2" or similar,
    // but I added "animate-spin" class.
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeTruthy()
  })
})
