// @vitest-environment jsdom
import React from 'react'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { describe, it, expect } from 'vitest'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeTruthy()
  })

  it('shows loading spinner when loading is true', () => {
    render(<Button loading>Submit</Button>)
    const button = screen.getByRole('button')
    // Should be disabled
    expect(button.getAttribute('disabled')).toBeDefined()
    // Should have spinner
    expect(button.querySelector('.animate-spin')).toBeTruthy()
  })
})
