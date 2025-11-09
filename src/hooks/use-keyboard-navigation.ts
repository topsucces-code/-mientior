'use client'

import { useEffect, useCallback, RefObject } from 'react'

interface KeyboardNavigationConfig {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: (shiftKey: boolean) => void
  elementRef?: RefObject<HTMLElement>
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  elementRef,
}: KeyboardNavigationConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onEscape?.()
          break
        case 'Enter':
          onEnter?.()
          break
        case 'ArrowUp':
          event.preventDefault()
          onArrowUp?.()
          break
        case 'ArrowDown':
          event.preventDefault()
          onArrowDown?.()
          break
        case 'ArrowLeft':
          onArrowLeft?.()
          break
        case 'ArrowRight':
          onArrowRight?.()
          break
        case 'Tab':
          onTab?.(event.shiftKey)
          break
      }
    },
    [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab]
  )

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const container = elementRef?.current || document
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    return Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    ).filter((el) => {
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        !el.hasAttribute('hidden')
      )
    })
  }, [elementRef])

  useEffect(() => {
    const target = elementRef?.current || document

    target.addEventListener('keydown', handleKeyDown as EventListener)

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener)
    }
  }, [handleKeyDown, elementRef])

  return {
    handleKeyDown,
    getFocusableElements,
  }
}
