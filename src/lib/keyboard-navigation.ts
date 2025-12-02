/**
 * Keyboard Navigation Utilities
 * 
 * Provides comprehensive keyboard navigation support for accessibility
 * Requirements: 15.1, 15.4
 */

export interface KeyboardShortcut {
  key: string
  description: string
  action: () => void
  modifiers?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  }
}

export interface KeyboardNavigationOptions {
  enableArrowKeys?: boolean
  enableEscape?: boolean
  enableTab?: boolean
  enableZoomShortcuts?: boolean
  customShortcuts?: KeyboardShortcut[]
}

/**
 * Check if a keyboard event matches the specified modifiers
 */
export function matchesModifiers(
  event: KeyboardEvent,
  modifiers?: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  }
): boolean {
  if (!modifiers) return true

  return (
    (modifiers.ctrl === undefined || event.ctrlKey === modifiers.ctrl) &&
    (modifiers.alt === undefined || event.altKey === modifiers.alt) &&
    (modifiers.shift === undefined || event.shiftKey === modifiers.shift) &&
    (modifiers.meta === undefined || event.metaKey === modifiers.meta)
  )
}

/**
 * Create a keyboard event handler with the specified options
 */
export function createKeyboardHandler(
  shortcuts: KeyboardShortcut[]
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      if (
        event.key === shortcut.key &&
        matchesModifiers(event, shortcut.modifiers)
      ) {
        event.preventDefault()
        shortcut.action()
        return
      }
    }
  }
}

/**
 * Standard keyboard shortcuts for image galleries
 */
export const GALLERY_SHORTCUTS = {
  NEXT: 'ArrowRight',
  PREVIOUS: 'ArrowLeft',
  CLOSE: 'Escape',
  ZOOM_IN: ['+', '='],
  ZOOM_OUT: ['-', '_'],
  FIRST: 'Home',
  LAST: 'End',
} as const

/**
 * Standard keyboard shortcuts for modals
 */
export const MODAL_SHORTCUTS = {
  CLOSE: 'Escape',
  CONFIRM: 'Enter',
  TAB_NEXT: 'Tab',
  TAB_PREV: 'Tab', // with Shift modifier
} as const

/**
 * Trap focus within a container element
 * Useful for modals and dialogs
 */
export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Focus first element
  firstElement?.focus()

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Get keyboard shortcut display string
 */
export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = []

  if (shortcut.modifiers?.ctrl) parts.push('Ctrl')
  if (shortcut.modifiers?.alt) parts.push('Alt')
  if (shortcut.modifiers?.shift) parts.push('Shift')
  if (shortcut.modifiers?.meta) parts.push('⌘')

  parts.push(shortcut.key)

  return parts.join(' + ')
}

/**
 * Check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false
  if (element.hasAttribute('disabled')) return false
  if (element.getAttribute('aria-hidden') === 'true') return false

  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') return false

  return true
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  )

  return elements.filter(isFocusable)
}

/**
 * Move focus to the next/previous focusable element
 */
export function moveFocus(
  container: HTMLElement,
  direction: 'next' | 'previous'
): void {
  const focusableElements = getFocusableElements(container)
  const currentIndex = focusableElements.findIndex(
    (el) => el === document.activeElement
  )

  if (currentIndex === -1) {
    focusableElements[0]?.focus()
    return
  }

  const nextIndex =
    direction === 'next'
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) % focusableElements.length

  focusableElements[nextIndex]?.focus()
}
